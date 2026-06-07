import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Square } from 'lucide-react';
import { interviewApi } from '../../api/interviewApi.js';
import { mediaApi } from '../../api/mediaApi.js';
import { evaluationApi } from '../../api/evaluationApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import CameraPreview from '../../components/ui/CameraPreview.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import InterviewInstructions from '../../components/ui/InterviewInstructions.jsx';
import InterviewQuestionCard from '../../components/ui/InterviewQuestionCard.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import ProgressIndicator from '../../components/ui/ProgressIndicator.jsx';
import RecordingIndicator from '../../components/ui/RecordingIndicator.jsx';
import UploadProgress from '../../components/ui/UploadProgress.jsx';
import { API_BASE_URL } from '../../api/httpClient.js';
import { getApiErrorMessage, normalizeStatusKey } from '../../utils/formatters.js';
import { getAccessToken } from '../../utils/storage.js';
import { useAuth } from '../auth/useAuth.js';

const uploadSteps = ['Cerrar respuesta actual', 'Detener grabación', 'Guardar entrevista', 'Finalizar'];
const MAX_INTERVIEW_DURATION_MS = 30 * 60 * 1000;

function chooseMimeType() {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported(type)) || '';
}

function normalizeVideoMimeType(type) {
  const baseType = String(type || '').split(';')[0].trim();
  return baseType.startsWith('video/') ? baseType : 'video/webm';
}

function videoExtensionForMimeType(type) {
  if (type === 'video/mp4') return 'mp4';
  if (type === 'video/quicktime') return 'mov';
  return 'webm';
}

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function isCodingQuestion(question) {
  const type = normalizeStatusKey(question?.questionType || question?.skillType);
  return type === 'CODING' || type === 'CODE' || type === 'CODING_EXERCISE';
}

function buildInitialResponse(question, startMs) {
  const isCoding = isCodingQuestion(question);
  return {
    questionId: question.questionId,
    answerText: isCoding ? null : '',
    videoStartMs: startMs,
    videoEndMs: startMs,
    answerStartedAt: new Date().toISOString(),
    answerEndedAt: null,
    codeSubmission: isCoding
      ? {
          language: question.language || 'javascript',
          code: '',
        }
      : null,
  };
}

export default function InterviewSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('instructions');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [stream, setStream] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [codeLanguages, setCodeLanguages] = useState([]);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const finalVideoFileRef = useRef(null);
  const finalResponsesRef = useRef(null);
  const recordingStartedAtRef = useRef(null);
  const activeQuestionStartRef = useRef(null);
  const intervalRef = useRef(null);
  const finishingRef = useRef(false);
  const phaseRef = useRef(phase);
  const interviewStartedRef = useRef(false);

  const questions = useMemo(() => interview?.questions || [], [interview]);
  const currentQuestion = questions[currentIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.questionId] : null;
  const shouldWarnBeforeUnload = ['recording', 'finishing', 'finish-error'].includes(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const relativeNow = useCallback(() => {
    if (!recordingStartedAtRef.current) return 0;
    return Math.min(
      MAX_INTERVIEW_DURATION_MS,
      Math.max(0, Math.round(performance.now() - recordingStartedAtRef.current)),
    );
  }, []);

  const loadInterview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await interviewApi.getInterview(id);
      setInterview(data);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  useEffect(() => {
    if (!questions.some(isCodingQuestion)) return;
    evaluationApi.getJudge0Languages()
      .then(setCodeLanguages)
      .catch(() => setCodeLanguages([]));
  }, [questions]);

  useEffect(() => {
    const handler = (event) => {
      if (!shouldWarnBeforeUnload) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldWarnBeforeUnload]);

  useEffect(() => {
    const closeAbandonedInterview = () => {
      if (!interviewStartedRef.current || finishingRef.current) return;
      if (!['recording', 'finish-error'].includes(phaseRef.current)) return;

      const token = getAccessToken();
      if (!token) return;

      fetch(`${API_BASE_URL}/interviews/${encodeURIComponent(id)}/abandon`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('pagehide', closeAbandonedInterview);
    return () => {
      closeAbandonedInterview();
      window.removeEventListener('pagehide', closeAbandonedInterview);
    };
  }, [id]);

  useEffect(() => () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  const ensureResponseStarted = useCallback((question) => {
    const startMs = relativeNow();
    activeQuestionStartRef.current = startMs;
    setResponses((current) => {
      if (current[question.questionId]) return current;
      return {
        ...current,
        [question.questionId]: buildInitialResponse(question, startMs),
      };
    });
  }, [relativeNow]);

  const startInterview = async () => {
    if (!questions.length) {
      setError('La entrevista no tiene preguntas generadas.');
      return;
    }

    setPhase('starting');
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);

      await interviewApi.startInterview(id);
      interviewStartedRef.current = true;

      chunksRef.current = [];
      const mimeType = chooseMimeType();
      const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      recordingStartedAtRef.current = performance.now();
      setElapsedMs(0);
      intervalRef.current = window.setInterval(() => setElapsedMs(relativeNow()), 1000);
      ensureResponseStarted(questions[0]);
      setPhase('recording');
    } catch (apiError) {
      mediaStream?.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraError(apiError.name === 'NotAllowedError'
        ? 'Permiso de cámara o micrófono denegado.'
        : getApiErrorMessage(apiError));
      setPhase('instructions');
    }
  };

  const finalizeCurrentQuestion = useCallback(() => {
    if (!currentQuestion) return responses;
    const endMs = relativeNow();
    const endedAt = new Date().toISOString();
    const existing = responses[currentQuestion.questionId] || buildInitialResponse(currentQuestion, activeQuestionStartRef.current ?? endMs);
    const nextResponses = {
      ...responses,
      [currentQuestion.questionId]: {
        ...existing,
        videoEndMs: endMs,
        answerEndedAt: endedAt,
      },
    };
    setResponses(nextResponses);
    return nextResponses;
  }, [currentQuestion, relativeNow, responses]);

  const goNext = () => {
    finalizeCurrentQuestion();
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      ensureResponseStarted(questions[nextIndex]);
    }
  };

  const updateCode = (code) => {
    if (!currentQuestion) return;
    setResponses((current) => {
      const existing = current[currentQuestion.questionId] || buildInitialResponse(currentQuestion, activeQuestionStartRef.current ?? relativeNow());
      return {
        ...current,
        [currentQuestion.questionId]: {
          ...existing,
          codeSubmission: {
            ...(existing.codeSubmission || { language: currentQuestion.language || 'javascript' }),
            code,
          },
        },
      };
    });
  };

  const updateLanguage = useCallback((language, template = '') => {
    if (!currentQuestion) return;
    setResponses((current) => {
      const existing = current[currentQuestion.questionId] || buildInitialResponse(currentQuestion, activeQuestionStartRef.current ?? relativeNow());
      return {
        ...current,
        [currentQuestion.questionId]: {
          ...existing,
          codeSubmission: {
            ...(existing.codeSubmission || {}),
            language,
            code: template || existing.codeSubmission?.code || '',
          },
        },
      };
    });
  }, [currentQuestion, relativeNow]);

  const stopRecorder = async () => new Promise((resolve, reject) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      resolve();
      return;
    }
    recorder.onstop = resolve;
    recorder.onerror = () => reject(new Error('No se pudo detener la grabación'));
    recorder.stop();
  });

  const submitFinalPayload = async ({ videoFile, finalResponses }) => {
    setUploadStep(2);
    const media = await mediaApi.uploadMedia({
      file: videoFile,
      resourceType: 'VIDEO',
      ownerId: user.userId || user.id,
      interviewId: id,
      onUploadProgress: (event) => {
        if (event.total) setUploadPercent(Math.round((event.loaded * 100) / event.total));
      },
    });

    setUploadStep(3);
    await interviewApi.finishInterview(id, {
      videoMediaId: media.mediaId,
      responses: questions.map((question) => {
        const response = finalResponses[question.questionId] || buildInitialResponse(question, 0);
        return {
          questionId: response.questionId,
          answerText: response.answerText,
          videoStartMs: response.videoStartMs,
          videoEndMs: response.videoEndMs,
          answerStartedAt: response.answerStartedAt,
          answerEndedAt: response.answerEndedAt || new Date().toISOString(),
          codeSubmission: response.codeSubmission?.code ? response.codeSubmission : null,
        };
      }),
    });
  };

  const finishInterview = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase('finishing');
    setUploadStep(0);
    setError('');

    try {
      const finalResponses = finalizeCurrentQuestion();
      setUploadStep(1);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      await stopRecorder();
      stream?.getTracks().forEach((track) => track.stop());

      const uploadMimeType = normalizeVideoMimeType(recorderRef.current?.mimeType || chunksRef.current[0]?.type);
      const blob = new Blob(chunksRef.current, { type: uploadMimeType });
      if (!blob.size) throw new Error('La grabación no produjo video.');

      const extension = videoExtensionForMimeType(uploadMimeType);
      const file = new File([blob], `interview-${id}.${extension}`, { type: uploadMimeType });
      finalVideoFileRef.current = file;
      finalResponsesRef.current = finalResponses;
      await submitFinalPayload({ videoFile: file, finalResponses });

      navigate(`/interviews/${id}/processing`);
    } catch (apiError) {
      finishingRef.current = false;
      setPhase(finalVideoFileRef.current ? 'finish-error' : 'recording');
      setError(getApiErrorMessage(apiError));
    }
  };

  useEffect(() => {
    if (phase === 'recording' && elapsedMs >= MAX_INTERVIEW_DURATION_MS && !finishingRef.current) {
      finishInterview();
    }
  }, [elapsedMs, phase]);

  const retrySubmitFinalPayload = async () => {
    if (!finalVideoFileRef.current || !finalResponsesRef.current) return;
    setPhase('finishing');
    setError('');
    setUploadPercent(0);
    try {
      await submitFinalPayload({
        videoFile: finalVideoFileRef.current,
        finalResponses: finalResponsesRef.current,
      });
      navigate(`/interviews/${id}/processing`);
    } catch (apiError) {
      setPhase('finish-error');
      setError(getApiErrorMessage(apiError));
    }
  };

  if (loading) return <LoadingState label="Cargando entrevista" />;
  if (error && !interview) return <ErrorState message={error} onRetry={loadInterview} />;

  return (
    <>
      <PageHeader
        eyebrow="Sesión"
        title="Entrevista"
        description="Responde una pregunta a la vez. La cámara y el micrófono se graban de forma continua hasta finalizar."
        action={<RecordingIndicator active={phase === 'recording' || phase === 'finishing'} elapsedLabel={formatElapsed(elapsedMs)} />}
      />

      {cameraError ? <div className="mb-5"><Alert tone="error">{cameraError}</Alert></div> : null}
      {error && interview ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}

      {phase === 'instructions' || phase === 'starting' ? (
        <InterviewInstructions
          questionCount={questions.length}
          onStart={startInterview}
          loading={phase === 'starting'}
        />
      ) : null}

      {phase === 'recording' && currentQuestion ? (
        <div className="grid gap-5 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <ProgressIndicator current={currentIndex + 1} total={questions.length} />
            <InterviewQuestionCard
              question={currentQuestion}
              response={currentResponse}
              codeLanguages={codeLanguages}
              onCodeChange={updateCode}
              onLanguageChange={updateLanguage}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {currentIndex < questions.length - 1 ? (
                <Button onClick={goNext}>
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="danger" onClick={finishInterview}>
                  <Square className="h-4 w-4" />
                  Finalizar entrevista
                </Button>
              )}
            </div>
          </div>
          <aside className="order-first mx-auto w-full max-w-md space-y-4 min-[900px]:order-none min-[900px]:sticky min-[900px]:top-6 min-[900px]:mx-0 min-[900px]:max-w-none min-[900px]:self-start">
            <CameraPreview stream={stream} />
            <Card>
              <CardHeader title="Grabación activa" description="No cierres ni recargues esta pestaña." />
              <CardBody className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Video continuo</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Preguntas registradas</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Feedback al finalizar</div>
              </CardBody>
            </Card>
          </aside>
        </div>
      ) : null}

      {phase === 'finishing' ? (
        <Card className="max-w-2xl">
          <CardHeader title="Finalizando entrevista" description={uploadPercent ? `Guardando entrevista: ${uploadPercent}%` : 'Preparando tus respuestas.'} />
          <CardBody>
            <UploadProgress steps={uploadSteps} activeStep={uploadStep} />
          </CardBody>
        </Card>
      ) : null}

      {phase === 'finish-error' ? (
        <Card className="max-w-2xl">
          <CardHeader title="No se pudo finalizar" description="La entrevista sigue disponible mientras esta pestaña permanezca abierta." />
          <CardBody className="space-y-4">
            <Alert tone="error">{error}</Alert>
            <Button onClick={retrySubmitFinalPayload}>Reintentar subida y cierre</Button>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

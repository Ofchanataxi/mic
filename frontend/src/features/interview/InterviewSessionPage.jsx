import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Square } from 'lucide-react';
import { interviewApi } from '../../api/interviewApi.js';
import { mediaApi } from '../../api/mediaApi.js';
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
import { getApiErrorMessage } from '../../utils/formatters.js';
import { useAuth } from '../auth/useAuth.js';

const uploadSteps = ['Cerrar respuesta actual', 'Detener grabacion', 'Subir video', 'Finalizar entrevista'];

function chooseMimeType() {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported(type)) || '';
}

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function buildInitialResponse(question, startMs) {
  const isCoding = question.questionType === 'CODING';
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

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const finalVideoFileRef = useRef(null);
  const finalResponsesRef = useRef(null);
  const recordingStartedAtRef = useRef(null);
  const activeQuestionStartRef = useRef(null);
  const intervalRef = useRef(null);
  const finishingRef = useRef(false);

  const questions = useMemo(() => interview?.questions || [], [interview]);
  const currentQuestion = questions[currentIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.questionId] : null;
  const shouldWarnBeforeUnload = ['recording', 'finishing', 'finish-error'].includes(phase);

  const relativeNow = useCallback(() => {
    if (!recordingStartedAtRef.current) return 0;
    return Math.max(0, Math.round(performance.now() - recordingStartedAtRef.current));
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
    const handler = (event) => {
      if (!shouldWarnBeforeUnload) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldWarnBeforeUnload]);

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
        ? 'Permiso de camara o microfono denegado.'
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

  const updateAnswer = (answerText) => {
    if (!currentQuestion) return;
    setResponses((current) => ({
      ...current,
      [currentQuestion.questionId]: {
        ...(current[currentQuestion.questionId] || buildInitialResponse(currentQuestion, activeQuestionStartRef.current ?? relativeNow())),
        answerText,
      },
    }));
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

  const updateLanguage = (language) => {
    if (!currentQuestion) return;
    setResponses((current) => {
      const existing = current[currentQuestion.questionId] || buildInitialResponse(currentQuestion, activeQuestionStartRef.current ?? relativeNow());
      return {
        ...current,
        [currentQuestion.questionId]: {
          ...existing,
          codeSubmission: {
            ...(existing.codeSubmission || { code: '' }),
            language,
          },
        },
      };
    });
  };

  const stopRecorder = async () => new Promise((resolve, reject) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      resolve();
      return;
    }
    recorder.onstop = resolve;
    recorder.onerror = () => reject(new Error('No se pudo detener la grabacion'));
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

      const blob = new Blob(chunksRef.current, { type: recorderRef.current?.mimeType || 'video/webm' });
      if (!blob.size) throw new Error('La grabacion no produjo video.');

      const file = new File([blob], `interview-${id}.webm`, { type: blob.type });
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
        eyebrow="Sesion"
        title="Entrevista tecnica"
        description="Responde una pregunta a la vez. La camara y el microfono se graban de forma continua hasta finalizar."
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
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <ProgressIndicator current={currentIndex + 1} total={questions.length} />
            <InterviewQuestionCard
              question={currentQuestion}
              response={currentResponse}
              onAnswerChange={updateAnswer}
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
          <aside className="space-y-4">
            <CameraPreview stream={stream} />
            <Card>
              <CardHeader title="Grabacion activa" description="No cierres ni recargues esta pestana." />
              <CardBody className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Video continuo</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Timestamps por pregunta</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Subida al finalizar</div>
              </CardBody>
            </Card>
          </aside>
        </div>
      ) : null}

      {phase === 'finishing' ? (
        <Card className="max-w-2xl">
          <CardHeader title="Finalizando entrevista" description={uploadPercent ? `Subiendo video: ${uploadPercent}%` : 'Preparando video y respuestas.'} />
          <CardBody>
            <UploadProgress steps={uploadSteps} activeStep={uploadStep} />
          </CardBody>
        </Card>
      ) : null}

      {phase === 'finish-error' ? (
        <Card className="max-w-2xl">
          <CardHeader title="No se pudo finalizar" description="El video sigue en memoria mientras esta pestana permanezca abierta." />
          <CardBody className="space-y-4">
            <Alert tone="error">{error}</Alert>
            <Button onClick={retrySubmitFinalPayload}>Reintentar subida y cierre</Button>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { feedbackApi } from '../../api/feedbackApi.js';
import { evaluationApi } from '../../api/evaluationApi.js';
import { interviewApi } from '../../api/interviewApi.js';
import { mediaApi } from '../../api/mediaApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import DimensionScoresGrid from '../../components/ui/DimensionScoresGrid.jsx';
import FeedbackSummary from '../../components/ui/FeedbackSummary.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import QuestionFeedbackDetail from '../../components/ui/QuestionFeedbackDetail.jsx';
import QuestionFeedbackList from '../../components/ui/QuestionFeedbackList.jsx';
import SegmentedVideoPlayer from '../../components/ui/SegmentedVideoPlayer.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';
import { normalizeFeedbackData } from '../../utils/feedbackNormalizer.js';

const VIDEO_ACCESS_REFRESH_MS = 8 * 60 * 1000;

export default function FeedbackPage() {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationQuestions, setEvaluationQuestions] = useState(null);
  const [interview, setInterview] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notReady, setNotReady] = useState(false);
  const videoRefreshInProgress = useRef(false);
  const lastVideoRefreshAt = useRef(0);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotReady(false);
    try {
      const [feedbackResult, evaluationResult, questionsResult, interviewResult] = await Promise.allSettled([
        feedbackApi.getFeedbackByInterview(id),
        evaluationApi.getEvaluationByInterview(id),
        evaluationApi.getEvaluationQuestions(id),
        interviewApi.getInterview(id),
      ]);

      if (feedbackResult.status === 'fulfilled') {
        setFeedback(feedbackResult.value);
      } else if ([404, 409].includes(feedbackResult.reason?.response?.status)) {
        setNotReady(true);
      } else {
        throw feedbackResult.reason;
      }

      if (evaluationResult.status === 'fulfilled') setEvaluation(evaluationResult.value);
      if (questionsResult.status === 'fulfilled') setEvaluationQuestions(questionsResult.value);
      if (interviewResult.status === 'fulfilled') setInterview(interviewResult.value);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const normalized = useMemo(() => normalizeFeedbackData({
    feedback,
    evaluation,
    evaluationQuestions,
    interview,
  }), [feedback, evaluation, evaluationQuestions, interview]);

  useEffect(() => {
    if (!selectedQuestionId && normalized.questions.length) {
      setSelectedQuestionId(normalized.questions[0].questionId);
    }
  }, [normalized.questions, selectedQuestionId]);

  const refreshVideoAccess = useCallback(async ({ force = false } = {}) => {
    if (!normalized.videoMediaId || videoRefreshInProgress.current) return;
    if (!force && Date.now() - lastVideoRefreshAt.current < 10000) return;
    videoRefreshInProgress.current = true;
    lastVideoRefreshAt.current = Date.now();
    try {
      const access = await mediaApi.getMediaAccess(normalized.videoMediaId);
      const nextUrl = access.accessUrl || '';
      setVideoUnavailable(!nextUrl);
      setVideoUrl(nextUrl ? `${nextUrl}${nextUrl.includes('?') ? '&' : '?'}renewedAt=${Date.now()}` : '');
    } catch (accessError) {
      setVideoUrl('');
      setVideoUnavailable([404, 410].includes(accessError?.response?.status));
    } finally {
      videoRefreshInProgress.current = false;
    }
  }, [normalized.videoMediaId]);

  useEffect(() => {
    if (!normalized.videoMediaId) {
      setVideoUrl('');
      setVideoUnavailable(false);
      return undefined;
    }

    setVideoUnavailable(false);
    refreshVideoAccess({ force: true });
    const interval = window.setInterval(() => refreshVideoAccess({ force: true }), VIDEO_ACCESS_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [normalized.videoMediaId, refreshVideoAccess]);

  const selectedQuestion = normalized.questions.find((question) => question.questionId === selectedQuestionId)
    || normalized.questions[0];
  const selectedQuestionIsCode = selectedQuestion?.skillType === 'CODE' || selectedQuestion?.skillType === 'CODING';

  return (
    <>
      <PageHeader
        title="Resultados"
        description="Revisa tu desempeño y las recomendaciones de cada pregunta."
      />

      {loading ? <LoadingState label="Cargando resultados" /> : null}
      {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}

      {!loading && notReady ? (
        <Card className="max-w-2xl">
          <CardHeader title="Resultados aún no disponibles" description="El análisis todavía está en curso." />
          <CardBody className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">Puedes salir de esta pantalla y volver más tarde.</p>
            <Link to={`/interviews/${id}/processing`}>
              <Button>Ver estado</Button>
            </Link>
          </CardBody>
        </Card>
      ) : null}

      {!loading && !notReady && !error && normalized.interviewId ? (
        <div className="space-y-5">
          <FeedbackSummary feedback={normalized} />
          <DimensionScoresGrid scores={normalized.scores} />

          <Card>
            <CardHeader title="Preguntas" description="Selecciona una pregunta para revisar sus resultados." />
            <CardBody>
              <QuestionFeedbackList
                questions={normalized.questions}
                selectedId={selectedQuestion?.questionId}
                onSelect={setSelectedQuestionId}
              />
            </CardBody>
          </Card>

          <QuestionFeedbackDetail
            question={selectedQuestion}
            videoContent={!selectedQuestionIsCode ? (
              <SegmentedVideoPlayer
                videoUrl={videoUrl}
                unavailable={videoUnavailable}
                question={selectedQuestion}
                onPlaybackError={() => refreshVideoAccess()}
                embedded
              />
            ) : null}
          />
        </div>
      ) : null}
    </>
  );
}

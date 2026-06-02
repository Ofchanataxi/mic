import { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function FeedbackPage() {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationQuestions, setEvaluationQuestions] = useState(null);
  const [interview, setInterview] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notReady, setNotReady] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    async function loadVideo() {
      if (!normalized.videoMediaId) return;
      try {
        const access = await mediaApi.getMediaAccess(normalized.videoMediaId);
        if (mounted) setVideoUrl(access.accessUrl || '');
      } catch (_) {
        if (mounted) setVideoUrl('');
      }
    }
    loadVideo();
    return () => {
      mounted = false;
    };
  }, [normalized.videoMediaId]);

  const selectedQuestion = normalized.questions.find((question) => question.questionId === selectedQuestionId)
    || normalized.questions[0];

  return (
    <>
      <PageHeader
        eyebrow="Reporte"
        title="Reporte final"
        description="Resumen de tu entrevista, resultados por área y recomendaciones por pregunta."
        action={<Button variant="secondary" onClick={loadFeedback}>Actualizar</Button>}
      />

      {loading ? <LoadingState label="Cargando reporte" /> : null}
      {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}

      {!loading && notReady ? (
        <Card className="max-w-2xl">
          <CardHeader title="Reporte aún no disponible" description="El análisis todavía está en curso." />
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

          <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader title="Preguntas evaluadas" description={`${normalized.questions.length} preguntas`} />
              <CardBody>
                <QuestionFeedbackList
                  questions={normalized.questions}
                  selectedId={selectedQuestion?.questionId}
                  onSelect={setSelectedQuestionId}
                />
              </CardBody>
            </Card>

            <div className="space-y-5">
              <SegmentedVideoPlayer videoUrl={videoUrl} question={selectedQuestion} />
              <QuestionFeedbackDetail question={selectedQuestion} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

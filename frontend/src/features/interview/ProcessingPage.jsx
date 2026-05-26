import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { evaluationApi } from '../../api/evaluationApi.js';
import { feedbackApi } from '../../api/feedbackApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import ProcessingTimeline from '../../components/ui/ProcessingTimeline.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

const POLLING_MS = 5000;
const failedStatuses = new Set(['FAILED', 'DISPATCH_FAILED', 'CANCELLED']);
const evaluationDoneStatuses = new Set(['COMPLETED', 'PARTIAL']);
const waitingStatus = (interviewId) => ({ interviewId, status: 'WAITING' });

function isNotFoundError(error) {
  return error?.response?.status === 404;
}

export default function ProcessingPage() {
  const { id } = useParams();
  const [evaluationStatus, setEvaluationStatus] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partialErrors, setPartialErrors] = useState({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const feedbackReady = feedbackStatus?.status === 'READY';
  const shouldStopPolling = useMemo(() => feedbackReady, [feedbackReady]);

  const loadStatuses = useCallback(async () => {
    setError('');
    setPartialErrors({});
    const evaluationResult = await Promise.resolve()
      .then(() => evaluationApi.getEvaluationJobStatus(id))
      .then((value) => ({ status: 'fulfilled', value }))
      .catch((reason) => ({ status: 'rejected', reason }));

    let nextEvaluationStatus = evaluationStatus;

    if (evaluationResult.status === 'fulfilled') {
      nextEvaluationStatus = evaluationResult.value;
      setEvaluationStatus(nextEvaluationStatus);
    } else if (isNotFoundError(evaluationResult.reason)) {
      nextEvaluationStatus = waitingStatus(id);
      setEvaluationStatus(nextEvaluationStatus);
    }

    const shouldCheckFeedback = evaluationDoneStatuses.has(nextEvaluationStatus?.status);
    let feedbackResult = null;

    if (shouldCheckFeedback) {
      feedbackResult = await Promise.resolve()
        .then(() => feedbackApi.getFeedbackJobStatus(id))
        .then((value) => ({ status: 'fulfilled', value }))
        .catch((reason) => ({ status: 'rejected', reason }));

      if (feedbackResult.status === 'fulfilled') {
        setFeedbackStatus(feedbackResult.value);
      } else if (isNotFoundError(feedbackResult.reason)) {
        setFeedbackStatus(waitingStatus(id));
      }
    } else {
      setFeedbackStatus(waitingStatus(id));
    }

    const failures = [evaluationResult, feedbackResult]
      .filter(Boolean)
      .filter((result) => result.status === 'rejected')
      .filter((result) => !isNotFoundError(result.reason));
    if (failures.length && evaluationResult.status === 'rejected' && feedbackResult?.status === 'rejected') {
      setError(getApiErrorMessage(failures[0].reason));
    } else {
      setPartialErrors({
        evaluation: evaluationResult.status === 'rejected' && !isNotFoundError(evaluationResult.reason)
          ? getApiErrorMessage(evaluationResult.reason)
          : '',
        feedback: feedbackResult?.status === 'rejected' && !isNotFoundError(feedbackResult.reason)
          ? getApiErrorMessage(feedbackResult.reason)
          : '',
      });
    }

    setLastUpdatedAt(new Date());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  useEffect(() => {
    if (shouldStopPolling) return undefined;
    const interval = window.setInterval(loadStatuses, POLLING_MS);
    return () => window.clearInterval(interval);
  }, [loadStatuses, shouldStopPolling]);

  return (
    <>
      <PageHeader
        eyebrow="Procesamiento"
        title="Analizando entrevista"
        description="Estamos analizando tu entrevista. Esto puede tardar unos minutos mientras se procesa contenido, audio, video, codigo y feedback."
        action={feedbackReady ? (
          <Link to={`/interviews/${id}/feedback`}>
            <Button>Ver feedback</Button>
          </Link>
        ) : null}
      />

      {loading ? <LoadingState label="Consultando procesamiento" /> : null}
      {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}
      {partialErrors.evaluation ? <div className="mb-5"><Alert tone="warning" title="No se pudo consultar evaluacion">{partialErrors.evaluation}</Alert></div> : null}
      {partialErrors.feedback ? <div className="mb-5"><Alert tone="warning" title="No se pudo consultar feedback">{partialErrors.feedback}</Alert></div> : null}

      {!loading ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader title="Etapas" description={lastUpdatedAt ? `Ultima consulta: ${lastUpdatedAt.toLocaleTimeString()}` : 'Polling activo cada 5 segundos'} />
            <CardBody>
              <ProcessingTimeline evaluationStatus={evaluationStatus?.status} feedbackStatus={feedbackStatus?.status} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Entrevista ${id}`} description="Estado actual reportado por backend." />
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                <span className="text-sm font-medium text-slate-700">Evaluacion</span>
                <StatusBadge status={evaluationStatus?.status} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                <span className="text-sm font-medium text-slate-700">Feedback</span>
                <StatusBadge status={feedbackStatus?.status} fallback="WAITING" />
              </div>
              {failedStatuses.has(evaluationStatus?.status) || failedStatuses.has(feedbackStatus?.status) ? (
                <Alert tone="warning">
                  Si el backend esta reintentando el procesamiento, este estado puede corregirse en la siguiente consulta.
                </Alert>
              ) : null}
              {evaluationStatus?.errorMessage ? <Alert tone="error">{evaluationStatus.errorMessage}</Alert> : null}
              {feedbackStatus?.errorMessage ? <Alert tone="error">{feedbackStatus.errorMessage}</Alert> : null}
              {!feedbackReady ? (
                <Button variant="secondary" onClick={loadStatuses}>Reintentar consulta</Button>
              ) : (
                <Link to={`/interviews/${id}/feedback`}>
                  <Button className="w-full">Abrir reporte</Button>
                </Link>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}
    </>
  );
}

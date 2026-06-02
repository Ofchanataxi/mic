import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { evaluationApi } from '../../api/evaluationApi.js';
import { feedbackApi } from '../../api/feedbackApi.js';
import { interviewApi } from '../../api/interviewApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import ProcessingTimeline from '../../components/ui/ProcessingTimeline.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { formatDate, getApiErrorMessage } from '../../utils/formatters.js';

const POLLING_MS = 5000;
const failedStatuses = new Set(['FAILED', 'DISPATCH_FAILED', 'CANCELLED']);
const evaluationDoneStatuses = new Set(['COMPLETED', 'PARTIAL']);
const waitingStatus = (interviewId) => ({ interviewId, status: 'WAITING' });
const abandonedGraceMs = 5 * 60 * 1000;

function isNotFoundError(error) {
  return error?.response?.status === 404;
}

function isTransientMediaProcessingStatus(status) {
  return status?.status === 'FAILED'
    && /media.*READY|not READY|Current status:\s*PROCESSING|status:\s*PROCESSING/i.test(status.errorMessage || '');
}

function isClosedInterview(interview) {
  if (!interview) return false;
  if (interview.status === 'CANCELLED') return true;
  if (interview.status !== 'IN_PROGRESS') return false;
  const updatedAt = new Date(interview.updatedAt || interview.startedAt || interview.createdAt).getTime();
  return Number.isFinite(updatedAt) && Date.now() - updatedAt > abandonedGraceMs;
}

export default function ProcessingPage() {
  const { id } = useParams();
  const [evaluationStatus, setEvaluationStatus] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [closedInterview, setClosedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partialErrors, setPartialErrors] = useState({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const feedbackReady = feedbackStatus?.status === 'READY';
  const shouldStopPolling = useMemo(() => feedbackReady || Boolean(closedInterview), [feedbackReady, closedInterview]);
  const displayEvaluationStatus = isTransientMediaProcessingStatus(evaluationStatus)
    ? { ...evaluationStatus, status: 'PROCESSING', errorMessage: null }
    : evaluationStatus;

  const loadStatuses = useCallback(async () => {
    setError('');
    setPartialErrors({});
    const interviewResult = await Promise.resolve()
      .then(() => interviewApi.getInterview(id))
      .then((value) => ({ status: 'fulfilled', value }))
      .catch((reason) => ({ status: 'rejected', reason }));

    if (interviewResult.status === 'fulfilled' && isClosedInterview(interviewResult.value)) {
      setClosedInterview(interviewResult.value);
      setEvaluationStatus({ interviewId: id, status: 'CANCELLED' });
      setFeedbackStatus({ interviewId: id, status: 'CANCELLED' });
      setLastUpdatedAt(new Date());
      setLoading(false);
      return;
    }

    setClosedInterview(null);

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
        eyebrow="Análisis"
        title="Analizando entrevista"
        description={closedInterview ? 'Esta entrevista fue cerrada antes de finalizar y no generará reporte.' : 'Estamos analizando tu entrevista. Esto puede tardar unos minutos mientras preparamos tu reporte.'}
        action={feedbackReady ? (
          <Link to={`/interviews/${id}/feedback`}>
            <Button>Ver reporte</Button>
          </Link>
        ) : null}
      />

      {loading ? <LoadingState label="Consultando análisis" /> : null}
      {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}
      {partialErrors.evaluation ? <div className="mb-5"><Alert tone="warning" title="No se pudo actualizar el estado">{partialErrors.evaluation}</Alert></div> : null}
      {partialErrors.feedback ? <div className="mb-5"><Alert tone="warning" title="No se pudo actualizar el reporte">{partialErrors.feedback}</Alert></div> : null}

      {!loading ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader title="Etapas" description={lastUpdatedAt ? `Última actualización: ${lastUpdatedAt.toLocaleTimeString()}` : 'Actualizando estado'} />
            <CardBody>
              <ProcessingTimeline evaluationStatus={displayEvaluationStatus?.status} feedbackStatus={feedbackStatus?.status} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={displayEvaluationStatus?.startedAt ? `Entrevista del ${formatDate(displayEvaluationStatus.startedAt)}` : 'Entrevista en análisis'}
              description={closedInterview ? 'No hay reporte disponible para esta entrevista.' : 'Puedes salir de esta pantalla y volver cuando quieras.'}
            />
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                <span className="text-sm font-medium text-slate-700">Evaluación</span>
                <StatusBadge status={displayEvaluationStatus?.status} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                <span className="text-sm font-medium text-slate-700">Reporte</span>
                <StatusBadge status={feedbackStatus?.status} fallback="WAITING" />
              </div>
              {failedStatuses.has(displayEvaluationStatus?.status) || failedStatuses.has(feedbackStatus?.status) ? (
                <Alert tone="warning">
                  Estamos intentando completar el análisis. Si el problema continúa, vuelve a intentarlo más tarde.
                </Alert>
              ) : null}
              {displayEvaluationStatus?.errorMessage ? <Alert tone="error">{displayEvaluationStatus.errorMessage}</Alert> : null}
              {feedbackStatus?.errorMessage ? <Alert tone="error">{feedbackStatus.errorMessage}</Alert> : null}
              {!feedbackReady ? (
                closedInterview ? null : <Button variant="secondary" onClick={loadStatuses}>Actualizar estado</Button>
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

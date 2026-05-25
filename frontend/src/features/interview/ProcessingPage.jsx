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

export default function ProcessingPage() {
  const { id } = useParams();
  const [evaluationStatus, setEvaluationStatus] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partialErrors, setPartialErrors] = useState({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const feedbackReady = feedbackStatus?.status === 'READY';
  const shouldStopPolling = useMemo(() => (
    feedbackReady
    || failedStatuses.has(evaluationStatus?.status)
    || failedStatuses.has(feedbackStatus?.status)
  ), [evaluationStatus?.status, feedbackReady, feedbackStatus?.status]);

  const loadStatuses = useCallback(async () => {
    setError('');
    setPartialErrors({});
    const [evaluationResult, feedbackResult] = await Promise.allSettled([
      evaluationApi.getEvaluationJobStatus(id),
      feedbackApi.getFeedbackJobStatus(id),
    ]);

    if (evaluationResult.status === 'fulfilled') {
      setEvaluationStatus(evaluationResult.value);
    }
    if (feedbackResult.status === 'fulfilled') {
      setFeedbackStatus(feedbackResult.value);
    }

    const failures = [evaluationResult, feedbackResult].filter((result) => result.status === 'rejected');
    if (failures.length === 2) {
      setError(getApiErrorMessage(failures[0].reason));
    } else {
      setPartialErrors({
        evaluation: evaluationResult.status === 'rejected' ? getApiErrorMessage(evaluationResult.reason) : '',
        feedback: feedbackResult.status === 'rejected' ? getApiErrorMessage(feedbackResult.reason) : '',
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

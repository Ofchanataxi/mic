import { useState } from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatScore } from '../../utils/formatters.js';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import Card, { CardBody } from './Card.jsx';

const finishedInterviewStatuses = new Set(['FINISHED', 'COMPLETED']);
const feedbackReadyStatuses = new Set(['READY', 'COMPLETED']);
const feedbackProcessingStatuses = new Set(['PENDING', 'WAITING', 'PROCESSING', 'GENERATING', 'FEEDBACK_PENDING']);
const feedbackFailedStatuses = new Set(['FAILED', 'DISPATCH_FAILED']);

function getFeedbackPresentation(status, hasFeedback) {
  if (hasFeedback || feedbackReadyStatuses.has(status)) {
    return { label: 'Resultados listos', tone: 'success' };
  }
  if (feedbackFailedStatuses.has(status)) {
    return { label: 'Error al procesar resultados', tone: 'danger' };
  }
  if (feedbackProcessingStatuses.has(status) || !status) {
    return { label: 'Resultados en proceso', tone: 'warning' };
  }
  return { label: 'Resultados en proceso', tone: 'warning' };
}

export default function HistoryCard({ item }) {
  const [showInterruptionInfo, setShowInterruptionInfo] = useState(false);
  const hasFeedback = Boolean(item.feedbackReportId || feedbackReadyStatuses.has(item.feedbackStatus));
  const isInterrupted = Boolean(
    item.closedWithoutReport
      || item.interviewStatus === 'CANCELLED'
      || item.interviewStatus === 'INTERRUPTED',
  );
  const isFinished = finishedInterviewStatuses.has(item.interviewStatus);
  const feedback = getFeedbackPresentation(item.feedbackStatus, hasFeedback);

  return (
    <Card>
      <CardBody className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Fecha</p>
            <p className="mt-1 text-sm text-slate-900">{formatDate(item.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Puesto</p>
            <p className="mt-1 text-sm text-slate-900">{item.targetRole || 'Sin puesto definido'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Nivel</p>
            <p className="mt-1 text-sm text-slate-900">{item.level || 'Pendiente'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Estado</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {isInterrupted ? <Badge tone="danger">Entrevista interrumpida</Badge> : null}
              {!isInterrupted && isFinished ? <Badge tone={feedback.tone}>{feedback.label}</Badge> : null}
              {!isInterrupted && !isFinished ? <Badge tone="warning">Entrevista en curso</Badge> : null}
            </div>
            {isInterrupted ? (
              <div className="group relative mt-2 inline-flex">
                <button
                  type="button"
                  className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Información sobre la entrevista interrumpida"
                  aria-expanded={showInterruptionInfo}
                  onClick={() => setShowInterruptionInfo((visible) => !visible)}
                  onBlur={() => setShowInterruptionInfo(false)}
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                </button>
                <div
                  role="tooltip"
                  className={`absolute left-0 top-9 z-20 w-72 rounded-md bg-slate-950 px-3 py-2 text-xs leading-5 text-white shadow-lg ${
                    showInterruptionInfo ? 'block' : 'hidden group-hover:block group-focus-within:block'
                  }`}
                >
                  La entrevista se interrumpió al cerrar la ventana, abandonar la sesión, realizar una acción no permitida o por un error del sistema.
                </div>
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Puntuación</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {isInterrupted ? 'No disponible' : formatScore(item.globalScore)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {isInterrupted ? (
            <span className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-500">
              Entrevista cerrada
            </span>
          ) : (
            <Link to={`/interviews/${item.interviewId}/processing`}>
              <Button variant="secondary">{hasFeedback ? 'Ver entrevista' : 'Ver avance'}</Button>
            </Link>
          )}
          {hasFeedback ? (
            <Link to={`/interviews/${item.interviewId}/feedback`}>
              <Button>Ver feedback</Button>
            </Link>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

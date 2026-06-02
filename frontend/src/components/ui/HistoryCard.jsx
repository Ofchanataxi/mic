import { Link } from 'react-router-dom';
import { formatDate, formatScore } from '../../utils/formatters.js';
import Button from './Button.jsx';
import Card, { CardBody } from './Card.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function HistoryCard({ item }) {
  const hasFeedback = Boolean(item.feedbackReportId || item.feedbackStatus === 'READY');
  const isClosedWithoutReport = Boolean(item.closedWithoutReport || (item.interviewStatus === 'CANCELLED' && !hasFeedback));

  return (
    <Card>
      <CardBody className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Fecha</p>
            <p className="mt-1 text-sm text-slate-900">{formatDate(item.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Rol</p>
            <p className="mt-1 text-sm text-slate-900">{item.targetRole || 'Sin rol'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Nivel</p>
            <p className="mt-1 text-sm text-slate-900">{item.level || 'Pendiente'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Estados</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <StatusBadge status={item.interviewStatus} />
              {!isClosedWithoutReport ? <StatusBadge status={item.feedbackStatus} fallback="FEEDBACK_PENDING" /> : null}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Puntuación</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatScore(item.globalScore)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {isClosedWithoutReport ? (
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
              <Button>Ver reporte</Button>
            </Link>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

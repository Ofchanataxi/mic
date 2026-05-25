import { Link } from 'react-router-dom';
import { formatDate, formatScore } from '../../utils/formatters.js';
import Button from './Button.jsx';
import Card, { CardBody } from './Card.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function HistoryCard({ item }) {
  const hasFeedback = Boolean(item.feedbackReportId || item.feedbackStatus === 'READY');
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
              <StatusBadge status={item.feedbackStatus} fallback="FEEDBACK_PENDING" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Score</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatScore(item.globalScore)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Link to={`/interviews/${item.interviewId}/processing`}>
            <Button variant="secondary">{hasFeedback ? 'Ver entrevista' : 'Continuar procesamiento'}</Button>
          </Link>
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

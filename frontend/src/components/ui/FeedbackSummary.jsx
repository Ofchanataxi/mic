import { formatScore } from '../../utils/formatters.js';
import Card, { CardBody, CardHeader } from './Card.jsx';
import RecommendationList from './RecommendationList.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function FeedbackSummary({ feedback }) {
  return (
    <Card>
      <CardHeader title="Resumen ejecutivo" action={<StatusBadge status={feedback.status} fallback="READY" />} />
      <CardBody className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Score global</p>
            <p className="mt-2 text-4xl font-bold text-slate-950">{formatScore(feedback.overallScore)}</p>
            {feedback.level ? <p className="mt-1 text-sm text-slate-500">{feedback.level}</p> : null}
          </div>
          <p className="text-sm leading-6 text-slate-600">
            {typeof feedback.summary === 'string' ? feedback.summary : JSON.stringify(feedback.summary || {})}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <RecommendationList title="Fortalezas" items={feedback.strengths} />
          <RecommendationList title="Areas de mejora" items={feedback.weaknesses} />
          <RecommendationList title="Recomendaciones" items={feedback.recommendations} />
        </div>
      </CardBody>
    </Card>
  );
}

import { formatScore } from '../../utils/formatters.js';
import Card, { CardBody, CardHeader } from './Card.jsx';
import RecommendationList from './RecommendationList.jsx';

function readableSummary(summary) {
  if (!summary) return 'Aquí encontrarás los aspectos más destacados de tu entrevista.';
  if (typeof summary === 'string') return summary;
  if (summary.executiveSummary) return summary.executiveSummary;
  if (summary.overall?.level || summary.overall?.score !== undefined) {
    return `Tu resultado general fue ${summary.overall?.level || 'evaluado'}${
      summary.overall?.score !== undefined ? `, con una puntuación de ${formatScore(summary.overall.score)}` : ''
    }.`;
  }
  return 'Aquí encontrarás los aspectos más destacados de tu entrevista.';
}

export default function FeedbackSummary({ feedback }) {
  return (
    <Card>
      <CardHeader title="Resumen ejecutivo" />
      <CardBody className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Puntuación global</p>
            <p className="mt-2 text-4xl font-bold text-slate-950">{formatScore(feedback.overallScore)}</p>
            {feedback.level ? <p className="mt-1 text-sm text-slate-500">{feedback.level}</p> : null}
          </div>
          <p className="text-sm leading-6 text-slate-600">
            {readableSummary(feedback.summary)}
          </p>
        </div>
        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <div className="h-full rounded-md border border-slate-200 p-4">
            <RecommendationList title="Fortalezas" items={feedback.strengths} emptyMessage="Sin observaciones destacadas." />
          </div>
          <div className="h-full rounded-md border border-slate-200 p-4">
            <RecommendationList title="Áreas de mejora" items={feedback.weaknesses} emptyMessage="No se identificaron áreas específicas." />
          </div>
          <div className="h-full rounded-md border border-slate-200 p-4">
            <RecommendationList title="Recomendaciones" items={feedback.recommendations} emptyMessage="Sin recomendaciones adicionales." />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

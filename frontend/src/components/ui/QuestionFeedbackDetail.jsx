import { formatScore } from '../../utils/formatters.js';
import Card, { CardBody, CardHeader } from './Card.jsx';
import RecommendationList from './RecommendationList.jsx';
import ScoreBar from './ScoreBar.jsx';
import StatusBadge from './StatusBadge.jsx';

function JsonBlock({ title, value }) {
  if (!value) return null;
  const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">{content}</pre>
    </div>
  );
}

export default function QuestionFeedbackDetail({ question }) {
  if (!question) return null;
  return (
    <Card>
      <CardHeader
        title={`Pregunta ${question.order || '-'}`}
        description={[question.topic, question.subtopic].filter(Boolean).join(' - ')}
        action={<StatusBadge status={question.status} fallback={formatScore(question.finalScore)} />}
      />
      <CardBody className="space-y-5">
        <section>
          <h3 className="text-sm font-semibold text-slate-950">Pregunta</h3>
          <p className="mt-2 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{question.questionText || 'Sin texto de pregunta.'}</p>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-slate-950">Respuesta</h3>
          <p className="mt-2 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{question.answerText || 'Sin respuesta textual.'}</p>
        </section>
        {question.transcription ? (
          <section>
            <h3 className="text-sm font-semibold text-slate-950">Transcripcion</h3>
            <p className="mt-2 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{question.transcription}</p>
          </section>
        ) : null}
        <section className="grid gap-3 md:grid-cols-2">
          <ScoreBar label="Score final" value={question.finalScore} />
          <ScoreBar label="Semantico" value={question.scores?.semantic} />
          <ScoreBar label="Audio" value={question.scores?.audio} />
          <ScoreBar label="Video" value={question.scores?.video} />
          <ScoreBar label="Codigo" value={question.scores?.code} />
        </section>
        <div className="grid gap-4 lg:grid-cols-3">
          <RecommendationList title="Fortalezas" items={question.strengths} />
          <RecommendationList title="Debilidades" items={question.weaknesses} />
          <RecommendationList title="Recomendaciones" items={question.recommendations} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <JsonBlock title="Analisis semantico" value={question.semanticEvaluation} />
          <JsonBlock title="Analisis audio" value={question.audioAnalysis} />
          <JsonBlock title="Analisis video" value={question.videoAnalysis} />
          <JsonBlock title="Analisis codigo" value={question.codeEvaluation} />
        </div>
      </CardBody>
    </Card>
  );
}

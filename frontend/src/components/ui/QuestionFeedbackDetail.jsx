import { formatScore } from '../../utils/formatters.js';
import Card, { CardBody, CardHeader } from './Card.jsx';
import RecommendationList from './RecommendationList.jsx';
import ScoreBar from './ScoreBar.jsx';
import StatusBadge from './StatusBadge.jsx';

const asArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const formatPercent = (value) => (Number.isFinite(Number(value)) ? `${Math.round(Number(value))}/100` : null);

const formatSpeechRate = (value) => (Number.isFinite(Number(value)) ? `${Math.round(Number(value))} palabras/min` : null);

function ReadableAnalysisCard({ title, summary, items = [] }) {
  const visibleItems = items.filter(Boolean);
  if (!summary && !visibleItems.length) return null;

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {summary ? <p className="mt-2 text-sm leading-6 text-slate-700">{summary}</p> : null}
      {visibleItems.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {visibleItems.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function buildSemanticAnalysis(question) {
  const semantic = question.semanticEvaluation;
  if (!semantic) return null;
  const summary = typeof semantic === 'string'
    ? semantic
    : semantic.justification || 'La respuesta se revisó por claridad, coherencia, profundidad y relevancia.';

  return {
    title: 'Comentario de claridad',
    summary,
    items: [
      formatPercent(semantic.overallSemanticScore || question.scores?.semantic) && `Claridad general: ${formatPercent(semantic.overallSemanticScore || question.scores?.semantic)}`,
      formatPercent(semantic.technicalAccuracyScore) && `Precisión técnica: ${formatPercent(semantic.technicalAccuracyScore)}`,
      formatPercent(semantic.clarityScore) && `Claridad: ${formatPercent(semantic.clarityScore)}`,
      formatPercent(semantic.depthScore) && `Profundidad: ${formatPercent(semantic.depthScore)}`,
    ],
  };
}

function buildAudioAnalysis(question) {
  const audio = question.audioAnalysis;
  if (!audio) return null;
  const indicators = audio.confidenceIndicators || {};
  const summary = [
    indicators.responseLength,
    indicators.speechRate,
  ].filter(Boolean).join('. ') || 'El audio se revisó considerando duración, ritmo y contenido hablado.';

  return {
    title: 'Comentario de audio',
    summary,
    items: [
      Number.isFinite(Number(audio.wordCount)) && `${audio.wordCount} palabras detectadas en la transcripción.`,
      formatSpeechRate(audio.speechRate) && `Ritmo aproximado: ${formatSpeechRate(audio.speechRate)}.`,
      formatPercent(audio.fluencyScore || question.scores?.audio) && `Fluidez estimada: ${formatPercent(audio.fluencyScore || question.scores?.audio)}.`,
      indicators.pauseEstimation,
    ],
  };
}

function buildVideoAnalysis(question) {
  const video = question.videoAnalysis;
  if (!video) return null;
  const behavior = video.observableBehavior || {};
  const raw = video.rawData || {};
  const unavailable = ['VIDEO_MODEL_NOT_CONFIGURED', 'VIDEO_SEGMENT_UNAVAILABLE'].includes(raw.status);
  const summary = unavailable
    ? 'No hubo suficiente información visual para emitir una conclusión confiable.'
    : 'La revisión visual se basó en señales observables de la respuesta, sin inferir condiciones personales.';

  return {
    title: 'Comentario de video',
    summary,
    items: [
      behavior.visiblePerson === true && 'La persona aparece visible en los frames analizados.',
      behavior.visiblePerson === false && 'No se pudo confirmar una persona visible en el segmento.',
      behavior.framing && `Encuadre: ${behavior.framing}.`,
      behavior.gazeObservation && `Mirada/orientación: ${behavior.gazeObservation}.`,
      behavior.postureObservation && `Postura observable: ${behavior.postureObservation}.`,
      behavior.attentionObservation && `Atención observable: ${behavior.attentionObservation}.`,
      ...asArray(behavior.limitations).map((item) => `Limitación: ${item}.`),
      formatPercent(video.eyeContactScore) && `Contacto visual estimado: ${formatPercent(video.eyeContactScore)}.`,
      formatPercent(video.postureScore) && `Postura estimada: ${formatPercent(video.postureScore)}.`,
      formatPercent(video.attentionScore) && `Atención estimada: ${formatPercent(video.attentionScore)}.`,
    ],
  };
}

function buildCodeAnalysis(question) {
  const code = question.codeEvaluation;
  if (!code) return null;
  const status = code.compilationStatus || code.rawData?.status;
  const summary = status === 'NO_CODE_SUBMISSION'
    ? 'No se recibió una solución de código para esta pregunta.'
    : status === 'JUDGE0_NOT_CONFIGURED'
      ? 'No fue posible ejecutar automáticamente la solución.'
      : status === 'JUDGE0_REQUEST_FAILED'
        ? 'No se pudo ejecutar el código, pero la pregunta se evaluó con la información disponible.'
        : 'La solución de código fue ejecutada y se usó el resultado en la calificación.';

  return {
    title: 'Comentario de código',
    summary,
    items: [
      Number.isFinite(Number(code.passedTests)) && Number.isFinite(Number(code.totalTests)) && `${code.passedTests}/${code.totalTests} pruebas superadas.`,
      formatPercent(code.executionScore || question.scores?.code) && `Resultado de código: ${formatPercent(code.executionScore || question.scores?.code)}.`,
      code.runtimeError && `Observación técnica: ${String(code.runtimeError).slice(0, 220)}.`,
    ],
  };
}

export default function QuestionFeedbackDetail({ question }) {
  if (!question) return null;
  const readableAnalyses = [
    buildSemanticAnalysis(question),
    buildAudioAnalysis(question),
    buildVideoAnalysis(question),
    buildCodeAnalysis(question),
  ].filter(Boolean);

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
            <h3 className="text-sm font-semibold text-slate-950">Transcripción</h3>
            <p className="mt-2 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{question.transcription}</p>
          </section>
        ) : null}
        <section className="grid gap-3 md:grid-cols-2">
          <ScoreBar label="Puntuación final" value={question.finalScore} />
          <ScoreBar label="Claridad" value={question.scores?.semantic} />
          <ScoreBar label="Audio" value={question.scores?.audio} />
          <ScoreBar label="Video" value={question.scores?.video} />
          <ScoreBar label="Código" value={question.scores?.code} />
        </section>
        <div className="grid gap-4 lg:grid-cols-3">
          <RecommendationList title="Fortalezas" items={question.strengths} />
          <RecommendationList title="Debilidades" items={question.weaknesses} />
          <RecommendationList title="Recomendaciones" items={question.recommendations} />
        </div>
        {readableAnalyses.length ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {readableAnalyses.map((analysis) => (
              <ReadableAnalysisCard
                key={analysis.title}
                title={analysis.title}
                summary={analysis.summary}
                items={analysis.items}
              />
            ))}
          </section>
        ) : null}
      </CardBody>
    </Card>
  );
}

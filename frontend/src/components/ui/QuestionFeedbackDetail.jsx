import { HelpCircle } from 'lucide-react';
import { formatScore, formatSkillType } from '../../utils/formatters.js';
import Card, { CardBody, CardHeader } from './Card.jsx';
import RecommendationList from './RecommendationList.jsx';

const asArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

function HelpTip({ text }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-8 z-20 hidden w-72 rounded-md bg-slate-950 px-3 py-2 text-left text-xs font-normal leading-5 text-white shadow-lg group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

function AnalysisCard({ title, help, children }) {
  if (!children) return null;
  return (
    <div className="h-full rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <HelpTip text={help} />
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}

function semanticComment(question) {
  const semantic = question.semanticEvaluation;
  if (typeof semantic === 'string') return semantic;
  return semantic?.justification
    || question.summary
    || 'Se revisó qué tan clara, correcta, profunda y relacionada con la pregunta fue la respuesta.';
}

function audioComment(question) {
  const audio = question.audioAnalysis;
  const indicators = audio?.confidenceIndicators || {};
  const observations = [
    indicators.responseLength,
    indicators.speechRate,
    indicators.pauseEstimation,
  ].filter(Boolean);
  return observations.join('. ')
    || 'Se revisaron el ritmo de habla, la fluidez y la forma de desarrollar la respuesta.';
}

function videoComment(question) {
  const video = question.videoAnalysis;
  const behavior = video?.observableBehavior || {};
  const raw = video?.rawData || {};
  if (['VIDEO_MODEL_NOT_CONFIGURED', 'VIDEO_SEGMENT_UNAVAILABLE'].includes(raw.status)) {
    return 'No hubo suficiente información visual para ofrecer una observación confiable.';
  }
  const observations = [
    behavior.gazeObservation,
    behavior.postureObservation,
    behavior.attentionObservation,
    ...asArray(behavior.limitations),
  ].filter(Boolean);
  return observations.join('. ')
    || 'Se observaron la presencia frente a cámara, la postura y la atención durante la respuesta.';
}

function codeComment(question) {
  const code = question.codeEvaluation;
  const status = code?.compilationStatus || code?.rawData?.status;
  if (status === 'NO_CODE_SUBMISSION') return 'No se recibió una solución de código para evaluar.';
  if (status === 'JUDGE0_REQUEST_FAILED') {
    return 'No fue posible ejecutar la solución, pero se revisó el planteamiento disponible.';
  }
  if (Number.isFinite(Number(code?.passedTests)) && Number.isFinite(Number(code?.totalTests))) {
    return `La solución superó ${code.passedTests} de ${code.totalTests} pruebas y se revisó junto con el razonamiento presentado.`;
  }
  return question.summary || 'Se revisaron la solución, su ejecución y la forma de resolver el problema.';
}

function scoreExplanation(skillType) {
  if (skillType === 'CODE' || skillType === 'CODING') {
    return 'El resultado combina principalmente la ejecución del código (80 %) y la explicación de la solución (20 %).';
  }
  if (skillType === 'SOFT') {
    return 'El resultado combina el contenido y la estructura de la respuesta (70 %) con el desenvolvimiento al comunicarla (30 %).';
  }
  return 'El resultado combina la calidad técnica del contenido (80 %) con el desenvolvimiento al comunicarlo (20 %).';
}

function FeedbackColumns({ question, includeStrengths = true }) {
  return (
    <div className={`grid items-stretch gap-4 ${includeStrengths ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
      {includeStrengths ? (
        <div className="h-full rounded-md border border-slate-200 p-4">
          <RecommendationList title="Fortalezas" items={question.strengths} emptyMessage="Sin observaciones destacadas." />
        </div>
      ) : null}
      <div className="h-full rounded-md border border-slate-200 p-4">
        <RecommendationList title="Debilidades" items={question.weaknesses} emptyMessage="No se identificaron debilidades específicas." />
      </div>
      <div className="h-full rounded-md border border-slate-200 p-4">
        <RecommendationList title="Recomendaciones" items={question.recommendations} emptyMessage="Sin recomendaciones adicionales." />
      </div>
    </div>
  );
}

export default function QuestionFeedbackDetail({ question, videoContent = null }) {
  if (!question) return null;
  const isCode = question.skillType === 'CODE' || question.skillType === 'CODING';
  const sourceCode = question.codeSubmission?.sourceCode || question.codeSubmission?.code || '';

  return (
    <Card>
      <CardHeader
        title={`Pregunta ${question.order || '-'}`}
        description={formatSkillType(question.skillType)}
      />
      <CardBody className="space-y-6">
        <section>
          <p className="rounded-md bg-slate-50 p-4 text-base font-medium leading-7 text-slate-800">
            {question.questionText || 'Pregunta no disponible.'}
          </p>
        </section>

        <section className="rounded-md border-2 border-brand-200 bg-brand-50 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">Resultado de la pregunta</p>
              <p className="mt-1 text-4xl font-bold text-slate-950">{formatScore(question.finalScore)}</p>
            </div>
            <HelpTip text={scoreExplanation(question.skillType)} />
          </div>
          <div className="mt-4 h-4 overflow-hidden rounded-full bg-white ring-1 ring-brand-100">
            <div
              className="h-full rounded-full bg-brand-600"
              style={{ width: `${Math.max(0, Math.min(100, Number(question.finalScore) || 0))}%` }}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{scoreExplanation(question.skillType)}</p>
        </section>

        {!isCode ? videoContent : null}

        {isCode ? (
          <>
            <section>
              <h3 className="text-sm font-semibold text-slate-950">Respuesta de código</h3>
              <pre className="mt-3 max-h-[420px] overflow-auto rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                <code>{sourceCode || 'No se envió código para esta pregunta.'}</code>
              </pre>
            </section>
            <AnalysisCard
              title="Comentario sobre el código"
              help="Resume el resultado de ejecución y la calidad general de la solución presentada."
            >
              {codeComment(question)}
            </AnalysisCard>
            <FeedbackColumns question={question} includeStrengths={false} />
          </>
        ) : (
          <>
            <FeedbackColumns question={question} />
            <section className="grid items-stretch gap-4 lg:grid-cols-3">
              <AnalysisCard
                title="Análisis del contenido"
                help="Revisa la claridad, coherencia, precisión y profundidad de lo que se respondió."
              >
                {semanticComment(question)}
              </AnalysisCard>
              <AnalysisCard
                title="Análisis del desenvolvimiento"
                help="Revisa la fluidez, el ritmo de habla y la forma de comunicar la respuesta."
              >
                {audioComment(question)}
              </AnalysisCard>
              <AnalysisCard
                title="Análisis del comportamiento"
                help="Revisa señales visuales observables, como postura, atención y presencia frente a cámara."
              >
                {videoComment(question)}
              </AnalysisCard>
            </section>
          </>
        )}
      </CardBody>
    </Card>
  );
}

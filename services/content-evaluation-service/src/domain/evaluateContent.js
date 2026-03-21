const POSITIVE_TECH_KEYWORDS = [
  'api', 'algoritmo', 'arquitectura', 'array', 'async', 'backend', 'base de datos', 'bdd', 'cache',
  'clase', 'cola', 'cola de mensajes', 'complejidad', 'componente', 'concurrencia', 'docker', 'endpoint',
  'estructura de datos', 'frontend', 'función', 'heap', 'http', 'índice', 'join', 'latencia', 'lista',
  'microservicio', 'middleware', 'normalización', 'objeto', 'patrón', 'polimorfismo', 'promesa', 'queue',
  'recurs', 'rest', 'script', 'servicio', 'sql', 'stack', 'testing', 'transacción'
];

const EXPLANATION_MARKERS = ['porque', 'por ejemplo', 'ya que', 'esto permite', 'en resumen', 'por lo tanto'];
const DEPTH_MARKERS = ['trade-off', 'ventaja', 'desventaja', 'complejidad', 'escalabilidad', 'mantenibilidad', 'rendimiento', 'consistencia'];
const UNCERTAINTY_MARKERS = ['creo', 'tal vez', 'más o menos', 'no estoy seguro', 'quizás'];

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function countMatches(text, markers) {
  const normalized = normalize(text);
  return markers.reduce((total, marker) => total + (normalized.includes(normalize(marker)) ? 1 : 0), 0);
}

function uniqueKeywordMatches(text) {
  const normalized = normalize(text);
  return POSITIVE_TECH_KEYWORDS.filter((keyword) => normalized.includes(normalize(keyword))).length;
}

function splitWords(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function buildJustification({ technicalScore, clarityScore, depthScore, keywordMatches, explanationMarkers, uncertaintyMarkers }) {
  const strengths = [];
  const concerns = [];

  if (technicalScore >= 0.7) strengths.push('menciona conceptos técnicos relevantes y consistentes con la pregunta');
  else concerns.push('faltan conceptos técnicos más específicos');

  if (clarityScore >= 0.7) strengths.push('explica la idea con una estructura comprensible');
  else concerns.push('la explicación necesita un orden más claro');

  if (depthScore >= 0.65) strengths.push('profundiza con implicancias o trade-offs');
  else concerns.push('conviene profundizar con ejemplos o decisiones técnicas');

  if (keywordMatches === 0) concerns.push('la respuesta usa poca terminología técnica');
  if (uncertaintyMarkers > 1) concerns.push('el discurso transmite demasiada duda');
  if (explanationMarkers > 0 && strengths.length < 3) strengths.push('intenta justificar la respuesta con conectores explicativos');

  return `Fortalezas: ${strengths.join('; ') || 'ninguna clara'} | Mejora: ${concerns.join('; ') || 'mantener consistencia técnica y ejemplos concretos'}.`;
}

export function evaluateContent({ questionText, transcript }) {
  const transcriptWords = splitWords(transcript);
  const questionWords = splitWords(questionText);
  const keywordMatches = uniqueKeywordMatches(transcript);
  const explanationMarkers = countMatches(transcript, EXPLANATION_MARKERS);
  const depthMarkers = countMatches(transcript, DEPTH_MARKERS);
  const uncertaintyMarkers = countMatches(transcript, UNCERTAINTY_MARKERS);
  const overlapWithQuestion = questionWords.length === 0
    ? 0
    : questionWords.filter((word) => normalize(transcript).includes(normalize(word))).length / questionWords.length;

  const hasEnoughContent = transcriptWords.length >= 8;
  const technicalScore = clamp((keywordMatches / 6) * 0.62 + overlapWithQuestion * 0.32 + (hasEnoughContent ? 0.18 : 0.04));
  const clarityScore = clamp((transcriptWords.length >= 25 ? 0.35 : transcriptWords.length / 80) + explanationMarkers * 0.18 - uncertaintyMarkers * 0.08);
  const depthScore = clamp((depthMarkers * 0.22) + (keywordMatches / 8) * 0.28 + (transcriptWords.length >= 40 ? 0.25 : transcriptWords.length / 200));

  return {
    technicalScore: Number(technicalScore.toFixed(3)),
    clarityScore: Number(clarityScore.toFixed(3)),
    depthScore: Number(depthScore.toFixed(3)),
    justification: buildJustification({
      technicalScore,
      clarityScore,
      depthScore,
      keywordMatches,
      explanationMarkers,
      uncertaintyMarkers,
    }),
    analysisMode: 'simulated-heuristic',
    metadata: {
      transcriptWordCount: transcriptWords.length,
      questionWordCount: questionWords.length,
      keywordMatches,
      explanationMarkers,
      depthMarkers,
      uncertaintyMarkers,
      overlapWithQuestion: Number(overlapWithQuestion.toFixed(3)),
    },
  };
}

const { levelFromScore } = require('../utils/scoreUtils');

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean).map(String) : []);

const uniqueLimit = (values, limit = 6) => [...new Set(values.filter(Boolean).map(String))].slice(0, limit);

const bySkill = (questions, skillType) => questions.filter((question) => question.skillType === skillType);

const collect = (questions, key) => uniqueLimit(questions.flatMap((question) => asArray(question[key])), 6);

const sectionFeedback = ({ label, score, questions }) => ({
  summary: questions.length
    ? `${label}: desempeño ${levelFromScore(score).toLowerCase()} con score ${score ?? 'no disponible'}.`
    : `${label}: no hubo suficientes datos para esta sección.`,
  strengths: collect(questions, 'strengths'),
  improvementAreas: collect(questions, 'weaknesses'),
  recommendations: collect(questions, 'recommendations'),
});

const buildQuestionFallback = (question) => ({
  questionId: question.questionId,
  summary: `La respuesta obtuvo un score de ${question.finalScore ?? 'no disponible'} en una pregunta de tipo ${question.skillType}.`,
  strengths: asArray(question.strengths),
  weaknesses: asArray(question.weaknesses),
  recommendations: asArray(question.recommendations),
});

const generateHeuristicReport = ({ evaluation }) => {
  const questions = Array.isArray(evaluation.questions) ? evaluation.questions : [];
  const strengths = uniqueLimit([
    ...collect(questions, 'strengths'),
    ...(evaluation.summary?.strengths || []),
  ]);
  const improvementAreas = uniqueLimit([
    ...collect(questions, 'weaknesses'),
    ...(evaluation.summary?.weaknesses || []),
  ]);
  const recommendations = uniqueLimit([
    ...collect(questions, 'recommendations'),
    ...(evaluation.summary?.recommendations || []),
  ]);

  return {
    executiveSummary: `La entrevista obtuvo un nivel ${levelFromScore(evaluation.overallScore).toLowerCase()} con score global ${evaluation.overallScore ?? 'no disponible'}. El reporte resume los resultados calculados por evaluation-service y propone acciones de mejora.`,
    generalLevel: levelFromScore(evaluation.overallScore),
    mainStrengths: strengths,
    mainImprovementAreas: improvementAreas,
    actionableRecommendations: recommendations,
    technicalFeedback: sectionFeedback({
      label: 'Evaluación técnica',
      score: evaluation.technicalScore,
      questions: bySkill(questions, 'TECHNICAL'),
    }),
    softSkillsFeedback: sectionFeedback({
      label: 'Comunicación y soft skills',
      score: evaluation.softSkillsScore,
      questions: bySkill(questions, 'SOFT'),
    }),
    codeFeedback: sectionFeedback({
      label: 'Código',
      score: evaluation.codeScore,
      questions: bySkill(questions, 'CODE'),
    }),
    audioFeedback: {
      summary: `Audio: score ${evaluation.audioScore ?? 'no disponible'}.`,
      observations: uniqueLimit(questions.map((question) => question.audioAnalysis?.confidenceIndicators?.speechRate)),
      recommendations: ['Mantener respuestas estructuradas y con ritmo claro.'],
    },
    videoFeedback: {
      summary: evaluation.videoScore === null || evaluation.videoScore === undefined
        ? 'Video: no hay score disponible en esta versión.'
        : `Video: score ${evaluation.videoScore}.`,
      observations: uniqueLimit(questions.map((question) => question.videoAnalysis?.rawData?.message)),
      recommendations: [],
    },
    multimodalObservations: uniqueLimit([
      'El reporte combina resultados semánticos, técnicos, de código y observaciones de audio/video disponibles.',
    ]),
    questionFeedback: questions.map(buildQuestionFallback),
  };
};

module.exports = {
  generateHeuristicReport,
  asArray,
  uniqueLimit,
};

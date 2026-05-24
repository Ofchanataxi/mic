const openaiProvider = require('../providers/openaiProvider');
const { clampScore } = require('../utils/scoreUtils');

const fallbackLowScore = (reason) => ({
  coherenceScore: 10,
  technicalAccuracyScore: 10,
  clarityScore: 10,
  depthScore: 5,
  relevanceScore: 10,
  overallSemanticScore: 10,
  strengths: [],
  weaknesses: ['No hay suficiente contenido evaluable en la respuesta.'],
  recommendations: ['Responder con mayor detalle y relacionar la respuesta directamente con la pregunta.'],
  justification: reason,
});

const parseJson = (content) => {
  const parsed = JSON.parse(content);
  return {
    coherenceScore: clampScore(parsed.coherenceScore),
    technicalAccuracyScore: clampScore(parsed.technicalAccuracyScore),
    clarityScore: clampScore(parsed.clarityScore),
    depthScore: clampScore(parsed.depthScore),
    relevanceScore: clampScore(parsed.relevanceScore),
    overallSemanticScore: clampScore(parsed.overallSemanticScore),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
    justification: String(parsed.justification || ''),
  };
};

const buildRubric = (skillType) => {
  if (skillType === 'SOFT') {
    return 'Evalua estructura de respuesta, comunicacion, reflexion, manejo de situacion, ejemplos concretos y profesionalismo.';
  }
  if (skillType === 'CODE') {
    return 'Evalua razonamiento explicado, claridad de la solucion, comprension del problema, eficiencia aproximada y relacion entre explicacion y codigo.';
  }
  return 'Evalua correctitud tecnica, claridad, profundidad, relevancia y coherencia.';
};

const evaluateAnswer = async ({ questionText, skillType, answerText, transcription, codeSubmission }) => {
  const combinedAnswer = [answerText, transcription].filter(Boolean).join('\n\nTranscripcion:\n').trim();
  if (!combinedAnswer && !codeSubmission?.sourceCode) {
    return fallbackLowScore('No hay respuesta textual, transcripcion ni codigo suficiente para evaluar.');
  }

  const messages = [
    {
      role: 'system',
      content: [
        'Eres un evaluador de entrevistas tecnicas de software.',
        'Responde exclusivamente JSON parseable.',
        'Todas las justificaciones, fortalezas, debilidades y recomendaciones deben estar en espanol.',
        'No inventes informacion no presente y no uses lenguaje medico ni diagnosticos.',
        'Scores entre 0 y 100.',
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify({
        instruction: 'Evalua la respuesta frente a la pregunta y devuelve exactamente las claves solicitadas.',
        requiredJsonShape: {
          coherenceScore: 0,
          technicalAccuracyScore: 0,
          clarityScore: 0,
          depthScore: 0,
          relevanceScore: 0,
          overallSemanticScore: 0,
          strengths: ['string'],
          weaknesses: ['string'],
          recommendations: ['string'],
          justification: 'string',
        },
        skillType,
        rubric: buildRubric(skillType),
        questionText,
        answerText: combinedAnswer,
        codeSubmission: codeSubmission || null,
      }),
    },
  ];

  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const content = await openaiProvider.createJsonEvaluation(messages);
      return parseJson(content);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Semantic evaluation returned invalid JSON: ${lastError.message}`);
};

module.exports = {
  evaluateAnswer,
};

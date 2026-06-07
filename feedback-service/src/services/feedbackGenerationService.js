const openaiProvider = require('../providers/openaiProvider');
const feedbackSummaryService = require('./feedbackSummaryService');
const logger = require('../utils/logger');
const { levelFromScore } = require('../utils/scoreUtils');

const parseReport = (content) => {
  const parsed = JSON.parse(content);
  return {
    executiveSummary: String(parsed.executiveSummary || ''),
    generalLevel: ['BAJO', 'MEDIO', 'ALTO'].includes(parsed.generalLevel)
      ? parsed.generalLevel
      : levelFromScore(parsed.overallScore),
    mainStrengths: feedbackSummaryService.asArray(parsed.mainStrengths),
    mainImprovementAreas: feedbackSummaryService.asArray(parsed.mainImprovementAreas),
    actionableRecommendations: feedbackSummaryService.asArray(parsed.actionableRecommendations),
    technicalFeedback: parsed.technicalFeedback || {},
    softSkillsFeedback: parsed.softSkillsFeedback || {},
    codeFeedback: parsed.codeFeedback || {},
    audioFeedback: parsed.audioFeedback || {},
    videoFeedback: parsed.videoFeedback || {},
    multimodalObservations: feedbackSummaryService.asArray(parsed.multimodalObservations),
    questionFeedback: Array.isArray(parsed.questionFeedback) ? parsed.questionFeedback : [],
  };
};

const compactEvaluation = (evaluation) => ({
  interviewId: evaluation.interviewId,
  userId: evaluation.userId,
  scores: {
    overall: evaluation.overallScore,
    technical: evaluation.technicalScore,
    softSkills: evaluation.softSkillsScore,
    code: evaluation.codeScore,
    audio: evaluation.audioScore,
    video: evaluation.videoScore,
    semantic: evaluation.semanticScore,
  },
  summary: evaluation.summary,
  questions: (evaluation.questions || []).map((question) => ({
    questionId: question.questionId,
    order: question.order,
    skillType: question.skillType,
    questionText: question.questionText,
    answerText: question.answerText,
    transcription: question.transcription,
    finalScore: question.finalScore,
    semanticScore: question.semanticScore,
    audioScore: question.audioScore,
    videoScore: question.videoScore,
    codeScore: question.codeScore,
    strengths: question.strengths || [],
    weaknesses: question.weaknesses || [],
    recommendations: question.recommendations || [],
    semanticEvaluation: question.semanticEvaluation,
    audioAnalysis: question.audioAnalysis,
    videoAnalysis: question.videoAnalysis,
    codeEvaluation: question.codeEvaluation,
  })),
});

const buildMessages = ({ evaluation, candidateProfile, candidateTopics }) => [
  {
    role: 'system',
    content: [
      'Eres un redactor experto de feedback para entrevistas tecnicas de software.',
      'No recalcules ni modifiques scores.',
      'No inventes resultados que no esten en los datos.',
      'No diagnostiques condiciones psicologicas, medicas ni clinicas.',
      'Escribe en espanol, con tono constructivo, claro y accionable.',
      'Redacta las observaciones de audio y video con lenguaje natural para el candidato.',
      'No menciones frames, modelos, detecciones, metadatos, transcripciones, limitaciones tecnicas ni versiones del sistema.',
      'En audio usa expresiones directas como "tuvo varias pausas", "mantuvo un ritmo claro" o "la respuesta fue breve".',
      'En video usa expresiones prudentes como "mantuvo la atencion", "mostro poca atencion" o "conservo una postura estable".',
      'No atribuyas emociones, intenciones ni estados mentales a partir del audio o del video.',
      'Devuelve exclusivamente JSON valido con las claves solicitadas.',
    ].join(' '),
  },
  {
    role: 'user',
    content: JSON.stringify({
      requiredJsonShape: {
        executiveSummary: 'string',
        generalLevel: 'BAJO | MEDIO | ALTO',
        mainStrengths: ['string'],
        mainImprovementAreas: ['string'],
        actionableRecommendations: ['string'],
        technicalFeedback: {
          summary: 'string',
          strengths: ['string'],
          improvementAreas: ['string'],
          recommendations: ['string'],
        },
        softSkillsFeedback: {
          summary: 'string',
          strengths: ['string'],
          improvementAreas: ['string'],
          recommendations: ['string'],
        },
        codeFeedback: {
          summary: 'string',
          strengths: ['string'],
          improvementAreas: ['string'],
          recommendations: ['string'],
        },
        audioFeedback: {
          summary: 'string',
          observations: ['string'],
          recommendations: ['string'],
        },
        videoFeedback: {
          summary: 'string',
          observations: ['string'],
          recommendations: ['string'],
        },
        multimodalObservations: ['string'],
        questionFeedback: [{
          questionId: 'string',
          summary: 'string',
          strengths: ['string'],
          weaknesses: ['string'],
          recommendations: ['string'],
        }],
      },
      evaluation: compactEvaluation(evaluation),
      candidateProfile: candidateProfile || null,
      candidateTopics: candidateTopics || null,
    }),
  },
];

const generateReport = async ({ evaluation, candidateProfile, candidateTopics }) => {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not configured; using heuristic feedback report');
    return feedbackSummaryService.generateHeuristicReport({ evaluation });
  }

  const messages = buildMessages({ evaluation, candidateProfile, candidateTopics });
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      logger.info('Calling OpenAI for feedback report', { interviewId: evaluation.interviewId, attempt });
      const content = await openaiProvider.createJsonReport(messages);
      return parseReport(content);
    } catch (error) {
      lastError = error;
      logger.warn('OpenAI feedback generation failed', { interviewId: evaluation.interviewId, attempt, error: error.message });
    }
  }

  logger.warn('Using heuristic feedback report after OpenAI failures', {
    interviewId: evaluation.interviewId,
    error: lastError?.message,
  });
  return feedbackSummaryService.generateHeuristicReport({ evaluation });
};

module.exports = {
  generateReport,
};

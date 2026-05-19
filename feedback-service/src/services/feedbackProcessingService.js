const evaluationClient = require('../clients/evaluationClient');
const candidateClient = require('../clients/candidateClient');
const feedbackGenerationService = require('./feedbackGenerationService');
const feedbackJobRepository = require('../repositories/feedbackJobRepository');
const feedbackReportRepository = require('../repositories/feedbackReportRepository');
const logger = require('../utils/logger');

const validateEvaluation = (evaluation, expectedInterviewId) => {
  if (!evaluation?.interviewId) throw new Error('evaluation-service response is missing interviewId');
  if (evaluation.interviewId !== expectedInterviewId) throw new Error('evaluation-service returned a different interviewId');
  if (!evaluation.userId) throw new Error('evaluation-service response is missing userId');
  if (evaluation.overallScore === null || evaluation.overallScore === undefined) {
    throw new Error('evaluation-service response is incomplete: missing overallScore');
  }
  if (!Array.isArray(evaluation.questions)) {
    throw new Error('evaluation-service response is incomplete: questions must be an array');
  }
};

const tryGetCandidateContext = async (userId) => {
  const context = {
    profile: null,
    topics: null,
  };

  try {
    context.profile = await candidateClient.getProfile(userId);
    logger.info('Candidate profile fetched', { userId });
  } catch (error) {
    logger.warn('candidate-service profile fetch failed; continuing with evaluation data only', { userId, error: error.message });
  }

  try {
    context.topics = await candidateClient.getTopics(userId);
    logger.info('Candidate topics fetched', { userId });
  } catch (error) {
    logger.warn('candidate-service topics fetch failed; continuing with evaluation data only', { userId, error: error.message });
  }

  return context;
};

const findQuestionFeedback = (generatedReport, questionId) => {
  const feedback = generatedReport.questionFeedback || [];
  return feedback.find((item) => item.questionId === questionId) || {};
};

const buildQuestionDetails = ({ evaluation, generatedReport }) => (evaluation.questions || []).map((question) => {
  const questionFeedback = findQuestionFeedback(generatedReport, question.questionId);
  return {
    questionId: question.questionId,
    order: question.order,
    skillType: question.skillType,
    questionText: question.questionText,
    candidateSubtopicId: question.candidateSubtopicId || null,
    score: question.finalScore,
    summary: questionFeedback.summary || '',
    strengths: questionFeedback.strengths || question.strengths || [],
    weaknesses: questionFeedback.weaknesses || question.weaknesses || [],
    recommendations: questionFeedback.recommendations || question.recommendations || [],
    semanticNotes: question.semanticEvaluation?.justification || question.rawSemanticEvaluation?.justification || null,
    audioNotes: question.audioAnalysis?.confidenceIndicators?.speechRate || null,
    videoNotes: question.videoAnalysis?.rawData?.message || null,
    codeNotes: question.codeEvaluation?.compilationStatus || question.rawCodeEvaluation?.compilationStatus || null,
  };
});

const processFeedback = async ({ feedbackJobId, interviewId, userId, evaluationId }) => {
  const job = await feedbackJobRepository.markProcessing(feedbackJobId);
  logger.info('Feedback job started', { feedbackJobId, interviewId });

  try {
    const evaluation = await evaluationClient.getInterviewEvaluation(interviewId);
    validateEvaluation(evaluation, interviewId);
    logger.info('Evaluation data fetched for feedback', { interviewId, questions: evaluation.questions.length });

    const report = await feedbackReportRepository.upsertGenerating({
      feedbackJobId,
      interviewId,
      userId: evaluation.userId || userId,
      evaluationId,
    });

    const candidateContext = await tryGetCandidateContext(evaluation.userId || userId);
    const generatedReport = await feedbackGenerationService.generateReport({
      evaluation,
      candidateProfile: candidateContext.profile,
      candidateTopics: candidateContext.topics,
    });

    const questionDetails = buildQuestionDetails({ evaluation, generatedReport });

    const updatedReport = await feedbackReportRepository.markReady(report.id, {
      userId: evaluation.userId || userId,
      evaluationId: evaluationId || null,
      overallScore: evaluation.overallScore,
      technicalScore: evaluation.technicalScore,
      softSkillsScore: evaluation.softSkillsScore,
      codeScore: evaluation.codeScore,
      audioScore: evaluation.audioScore,
      videoScore: evaluation.videoScore,
      executiveSummary: generatedReport.executiveSummary,
      generalLevel: generatedReport.generalLevel,
      strengths: generatedReport.mainStrengths || [],
      improvementAreas: generatedReport.mainImprovementAreas || [],
      recommendations: generatedReport.actionableRecommendations || [],
      technicalFeedback: generatedReport.technicalFeedback || {},
      softSkillsFeedback: generatedReport.softSkillsFeedback || {},
      codeFeedback: generatedReport.codeFeedback || {},
      audioFeedback: generatedReport.audioFeedback || {},
      videoFeedback: generatedReport.videoFeedback || {},
      multimodalObservations: generatedReport.multimodalObservations || [],
      questionFeedback: generatedReport.questionFeedback || [],
      rawEvaluationData: evaluation,
      generatedReport: {
        ...generatedReport,
        scores: {
          semantic: evaluation.semanticScore,
        },
      },
    });

    await feedbackReportRepository.replaceQuestionDetails({
      feedbackReportId: report.id,
      interviewId,
      details: questionDetails,
    });

    await feedbackJobRepository.markCompleted(job.id);
    logger.info('Feedback job completed', { feedbackJobId, interviewId, reportId: updatedReport.id });

    return updatedReport;
  } catch (error) {
    await feedbackJobRepository.markFailed(job.id, error.message);
    await feedbackReportRepository.markFailedByInterviewId(interviewId, error.message).catch((reportError) => {
      logger.warn('Could not mark feedback report as failed', { interviewId, error: reportError.message });
    });
    logger.error('Feedback job failed', { feedbackJobId, interviewId, error: error.message, stack: error.stack });
    throw error;
  }
};

module.exports = {
  processFeedback,
};

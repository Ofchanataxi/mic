const evaluationJobService = require('../services/evaluationJobService');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorMiddleware');

const health = (req, res) => {
  res.json({
    service: 'evaluation-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};

const processInterview = asyncHandler(async (req, res) => {
  const { interviewId, userId } = req.body || {};
  if (!interviewId || typeof interviewId !== 'string') {
    throw new AppError('interviewId is required', 400);
  }
  if (!userId || typeof userId !== 'string') {
    throw new AppError('userId is required', 400);
  }

  const result = await evaluationJobService.processInterview({ interviewId, userId });
  res.status(202).json({
    evaluationJobId: result.job.id,
    interviewId: result.job.interviewId,
    status: result.job.status,
    message: result.message,
  });
});

const getJobStatus = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const job = await evaluationJobService.getJobStatus(interviewId);
  res.json({
    interviewId: job.interviewId,
    status: job.status,
    attempts: job.attempts,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  });
});

const mapQuestion = (question) => ({
  id: question.id,
  questionId: question.questionId,
  order: question.order,
  candidateTopicId: question.candidateTopicId,
  candidateSubtopicId: question.candidateSubtopicId,
  skillType: question.skillType,
  status: question.status,
  questionText: question.questionText,
  answerText: question.answerText,
  transcription: question.transcription,
  codeSubmission: question.codeSubmission,
  startTimeMs: question.startTimeMs,
  endTimeMs: question.endTimeMs,
  durationMs: question.durationMs,
  semanticScore: question.semanticScore,
  audioScore: question.audioScore,
  videoScore: question.videoScore,
  codeScore: question.codeScore,
  finalScore: question.finalScore,
  strengths: question.strengths || [],
  weaknesses: question.weaknesses || [],
  recommendations: question.recommendations || [],
  errorMessage: question.errorMessage,
  semanticEvaluation: question.semanticEvaluationResult,
  audioAnalysis: question.audioAnalysisResult,
  videoAnalysis: question.videoAnalysisResult,
  codeEvaluation: question.codeEvaluationResult,
});

const getInterviewEvaluation = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const evaluation = await evaluationJobService.getInterviewEvaluation(interviewId);
  res.json({
    interviewId: evaluation.interviewId,
    userId: evaluation.userId,
    overallScore: evaluation.overallScore,
    technicalScore: evaluation.technicalScore,
    softSkillsScore: evaluation.softSkillsScore,
    codeScore: evaluation.codeScore,
    audioScore: evaluation.audioScore,
    videoScore: evaluation.videoScore,
    semanticScore: evaluation.semanticScore,
    summary: evaluation.summary || {},
    questions: evaluation.questionEvaluations.map(mapQuestion),
  });
});

const getInterviewQuestions = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const questions = await evaluationJobService.getQuestionEvaluations(interviewId);
  res.json({
    interviewId,
    questions: questions.map(mapQuestion),
  });
});

const retryInterview = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const job = await evaluationJobService.retryInterview({ interviewId });
  res.status(202).json({
    evaluationJobId: job.id,
    interviewId: job.interviewId,
    status: job.status,
    message: 'Evaluation retry enqueued.',
  });
});

module.exports = {
  health,
  processInterview,
  getJobStatus,
  getInterviewEvaluation,
  getInterviewQuestions,
  retryInterview,
};

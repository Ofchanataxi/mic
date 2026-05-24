const feedbackJobService = require('../services/feedbackJobService');
const feedbackReportService = require('../services/feedbackReportService');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middlewares/errorMiddleware');

const health = (req, res) => {
  res.json({
    service: 'feedback-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};

const validateGenerationBody = (body) => {
  const { interviewId, userId, evaluationId } = body || {};
  if (!interviewId || typeof interviewId !== 'string') throw new AppError('interviewId is required', 400);
  if (!userId || typeof userId !== 'string') throw new AppError('userId is required', 400);
  if (evaluationId !== undefined && evaluationId !== null && typeof evaluationId !== 'string') {
    throw new AppError('evaluationId must be a string when provided', 400);
  }
  return { interviewId, userId, evaluationId };
};

const requestGeneration = asyncHandler(async (req, res) => {
  const payload = validateGenerationBody(req.body);
  const result = await feedbackJobService.requestFeedbackGeneration(payload);
  res.status(202).json({
    feedbackJobId: result.job.id,
    interviewId: result.job.interviewId,
    status: result.job.status,
    message: result.message,
  });
});

const getJobStatus = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const job = await feedbackJobService.getJobStatus(interviewId);
  res.json({
    interviewId: job.interviewId,
    status: job.status,
    attempts: job.attempts,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  });
});

const getInterviewReport = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const report = await feedbackReportService.findReportForInterview(interviewId);
  res.json(report);
});

const listUserReports = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const reports = await feedbackReportService.listUserReports(userId);
  res.json({ userId, reports });
});

const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const report = await feedbackReportService.findReportById(reportId);
  res.json(report);
});

const retryInterview = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const job = await feedbackJobService.retryFeedback({ interviewId });
  res.status(202).json({
    feedbackJobId: job.id,
    interviewId: job.interviewId,
    status: job.status,
    message: 'Feedback retry enqueued.',
  });
});

module.exports = {
  health,
  requestGeneration,
  getJobStatus,
  getInterviewReport,
  listUserReports,
  getReportById,
  retryInterview,
};

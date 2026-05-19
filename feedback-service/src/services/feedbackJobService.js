const feedbackJobRepository = require('../repositories/feedbackJobRepository');
const feedbackReportRepository = require('../repositories/feedbackReportRepository');
const { enqueueFeedbackJob } = require('../workers/queues/feedbackQueue');
const env = require('../config/env');
const { AppError } = require('../middlewares/errorMiddleware');

const requestFeedbackGeneration = async ({ interviewId, userId, evaluationId }) => {
  let job = await feedbackJobRepository.findByInterviewId(interviewId);

  if (!job) {
    job = await feedbackJobRepository.create({ interviewId, userId, evaluationId });
  } else {
    job = await feedbackJobRepository.updateMetadata(job.id, { userId, evaluationId });
  }

  if (job.status === 'COMPLETED') {
    return {
      job,
      message: 'Feedback report already completed; no new job was enqueued.',
    };
  }

  if (job.status === 'PROCESSING') {
    return {
      job,
      message: 'Feedback report is already processing.',
    };
  }

  const wasFailed = job.status === 'FAILED';
  if (wasFailed) {
    job = await feedbackJobRepository.markPendingForRetry(job.id);
  }

  await enqueueFeedbackJob({
    feedbackJobId: job.id,
    interviewId,
    userId,
    evaluationId,
    force: wasFailed,
  });

  return {
    job: { ...job, status: 'PENDING' },
    message: 'Feedback job enqueued.',
  };
};

const retryFeedback = async ({ interviewId }) => {
  const job = await feedbackJobRepository.findByInterviewId(interviewId);
  if (!job) throw new AppError('Feedback job not found', 404);

  if (job.status === 'COMPLETED' && !env.allowReadyReportRegeneration) {
    throw new AppError('Ready reports cannot be regenerated unless ALLOW_READY_REPORT_REGENERATION=true', 409);
  }

  if (job.status !== 'FAILED' && !(job.status === 'COMPLETED' && env.allowReadyReportRegeneration)) {
    throw new AppError('Only failed feedback jobs can be retried in the current configuration', 409);
  }

  const pending = await feedbackJobRepository.markPendingForRetry(job.id);
  await enqueueFeedbackJob({
    feedbackJobId: pending.id,
    interviewId: pending.interviewId,
    userId: pending.userId,
    evaluationId: pending.evaluationId,
    force: true,
  });

  return pending;
};

const getJobStatus = async (interviewId) => {
  const job = await feedbackJobRepository.findByInterviewId(interviewId);
  if (!job) throw new AppError('Feedback job not found', 404);
  return job;
};

const getReportForInterview = async (interviewId) => {
  const report = await feedbackReportRepository.findByInterviewId(interviewId);
  if (!report) throw new AppError('Feedback report not found', 404);
  return report;
};

module.exports = {
  requestFeedbackGeneration,
  retryFeedback,
  getJobStatus,
  getReportForInterview,
};

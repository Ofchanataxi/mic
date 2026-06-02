const evaluationJobRepository = require('../repositories/evaluationJobRepository');
const interviewEvaluationRepository = require('../repositories/interviewEvaluationRepository');
const questionEvaluationRepository = require('../repositories/questionEvaluationRepository');
const { enqueueEvaluationJob } = require('../workers/queues/evaluationQueue');
const interviewClient = require('../clients/interviewClient');
const env = require('../config/env');
const { AppError } = require('../middlewares/errorMiddleware');

const processInterview = async ({ interviewId, userId }) => {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const interviewData = await interviewClient.getEvaluationData(interviewId);
    if (!interviewData?.userId) {
      throw new AppError('interview-service response is missing userId', 502);
    }
    resolvedUserId = interviewData.userId;
  }

  let job = await evaluationJobRepository.findByInterviewId(interviewId);

  if (!job) {
    job = await evaluationJobRepository.create({ interviewId, userId: resolvedUserId });
  }

  if (job.status === 'COMPLETED') {
    return {
      job,
      message: 'Evaluation already completed; no new job was enqueued.',
    };
  }

  if (job.status === 'PROCESSING') {
    return {
      job,
      message: 'Evaluation is already processing.',
    };
  }

  const wasFailed = job.status === 'FAILED';
  if (wasFailed) {
    job = await evaluationJobRepository.markPendingForRetry(job.id);
  }

  await enqueueEvaluationJob({
    evaluationJobId: job.id,
    interviewId,
    userId: resolvedUserId,
    force: wasFailed,
  });

  return {
    job: { ...job, status: 'PENDING' },
    message: 'Evaluation job enqueued.',
  };
};

const retryInterview = async ({ interviewId }) => {
  const job = await evaluationJobRepository.findByInterviewId(interviewId);
  if (!job) throw new AppError('Evaluation job not found', 404);

  const interviewEvaluation = await interviewEvaluationRepository.findByInterviewId(interviewId);
  const canRetryPartialEvaluation = ['PARTIAL', 'FAILED'].includes(interviewEvaluation?.status);

  if (job.status === 'COMPLETED' && !env.allowCompletedReprocess && !canRetryPartialEvaluation) {
    throw new AppError('Completed evaluations cannot be reprocessed unless ALLOW_COMPLETED_REPROCESS=true', 409);
  }

  if (
    job.status !== 'FAILED'
    && !(job.status === 'COMPLETED' && (env.allowCompletedReprocess || canRetryPartialEvaluation))
  ) {
    throw new AppError('Only failed or partial evaluations can be retried in the current configuration', 409);
  }

  const pending = await evaluationJobRepository.markPendingForRetry(job.id);
  await enqueueEvaluationJob({
    evaluationJobId: pending.id,
    interviewId: pending.interviewId,
    userId: pending.userId,
    force: true,
  });

  return pending;
};

const getJobStatus = async (interviewId) => {
  const job = await evaluationJobRepository.findByInterviewId(interviewId);
  if (!job) throw new AppError('Evaluation job not found', 404);
  return job;
};

const getInterviewEvaluation = async (interviewId) => {
  const evaluation = await interviewEvaluationRepository.findByInterviewId(interviewId);
  if (!evaluation) throw new AppError('Interview evaluation not found', 404);
  return evaluation;
};

const getQuestionEvaluations = async (interviewId) => {
  const evaluation = await getInterviewEvaluation(interviewId);
  return questionEvaluationRepository.listByInterviewEvaluationId(evaluation.id);
};

module.exports = {
  processInterview,
  retryInterview,
  getJobStatus,
  getInterviewEvaluation,
  getQuestionEvaluations,
};

const { Queue } = require('bullmq');
const env = require('../../config/env');
const { createRedisConnection } = require('../../config/redis');
const logger = require('../../utils/logger');

const evaluationQueue = new Queue(env.evaluationQueueName, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: env.maxEvaluationAttempts,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

const enqueueEvaluationJob = async ({ evaluationJobId, interviewId, userId, force = false }) => {
  const existing = await evaluationQueue.getJob(interviewId);
  if (existing) {
    const state = await existing.getState();
    if (force || ['failed', 'completed'].includes(state)) {
      await existing.remove();
    } else {
      logger.info('Evaluation job already exists in queue', { interviewId, state });
      return existing;
    }
  }

  const job = await evaluationQueue.add('process-interview-evaluation', {
    evaluationJobId,
    interviewId,
    userId,
  }, {
    jobId: interviewId,
  });

  logger.info('Evaluation job enqueued', { evaluationJobId, interviewId, bullJobId: job.id });
  return job;
};

module.exports = {
  evaluationQueue,
  enqueueEvaluationJob,
};

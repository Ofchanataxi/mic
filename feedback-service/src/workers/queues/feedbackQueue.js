const { Queue } = require('bullmq');
const env = require('../../config/env');
const { createRedisConnection } = require('../../config/redis');
const logger = require('../../utils/logger');

const feedbackQueue = new Queue(env.feedbackQueueName, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: env.maxFeedbackAttempts,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

const enqueueFeedbackJob = async ({ feedbackJobId, interviewId, userId, evaluationId, force = false }) => {
  const existing = await feedbackQueue.getJob(interviewId);
  if (existing) {
    const state = await existing.getState();
    if (force || ['failed', 'completed'].includes(state)) {
      await existing.remove();
    } else {
      logger.info('Feedback job already exists in queue', { interviewId, state });
      return existing;
    }
  }

  const job = await feedbackQueue.add('generate-feedback-report', {
    feedbackJobId,
    interviewId,
    userId,
    evaluationId,
  }, {
    jobId: interviewId,
  });

  logger.info('Feedback job enqueued', { feedbackJobId, interviewId, bullJobId: job.id });
  return job;
};

module.exports = {
  feedbackQueue,
  enqueueFeedbackJob,
};

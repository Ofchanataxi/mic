require('dotenv').config();

const { Worker } = require('bullmq');
const env = require('../../config/env');
const { createRedisConnection } = require('../../config/redis');
const { handleFeedbackJob } = require('../handlers/feedbackJobHandler');
const logger = require('../../utils/logger');
const prisma = require('../../config/prisma');

const worker = new Worker(env.feedbackQueueName, handleFeedbackJob, {
  connection: createRedisConnection(),
  concurrency: 1,
});

worker.on('ready', () => {
  logger.info('Feedback worker ready', { queue: env.feedbackQueueName });
});

worker.on('active', (job) => {
  logger.info('Feedback worker picked job', { jobId: job.id, interviewId: job.data.interviewId });
});

worker.on('completed', (job) => {
  logger.info('Feedback worker completed job', { jobId: job.id, interviewId: job.data.interviewId });
});

worker.on('failed', (job, error) => {
  logger.error('Feedback worker failed job', {
    jobId: job?.id,
    interviewId: job?.data?.interviewId,
    error: error.message,
  });
});

const shutdown = async () => {
  logger.info('Shutting down feedback worker');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

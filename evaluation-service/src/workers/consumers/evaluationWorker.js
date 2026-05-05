require('dotenv').config();

const { Worker } = require('bullmq');
const env = require('../../config/env');
const { createRedisConnection } = require('../../config/redis');
const { handleEvaluationJob } = require('../handlers/evaluationJobHandler');
const logger = require('../../utils/logger');
const prisma = require('../../config/prisma');

const worker = new Worker(env.evaluationQueueName, handleEvaluationJob, {
  connection: createRedisConnection(),
  concurrency: 1,
});

worker.on('ready', () => {
  logger.info('Evaluation worker ready', { queue: env.evaluationQueueName });
});

worker.on('active', (job) => {
  logger.info('Evaluation worker picked job', { jobId: job.id, interviewId: job.data.interviewId });
});

worker.on('completed', (job) => {
  logger.info('Evaluation worker completed job', { jobId: job.id, interviewId: job.data.interviewId });
});

worker.on('failed', (job, error) => {
  logger.error('Evaluation worker failed job', {
    jobId: job?.id,
    interviewId: job?.data?.interviewId,
    error: error.message,
  });
});

const shutdown = async () => {
  logger.info('Shutting down evaluation worker');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

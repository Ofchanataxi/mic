require('dotenv').config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
};

const env = {
  port: toNumber(process.env.PORT, 3004),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  feedbackQueueName: process.env.FEEDBACK_QUEUE_NAME || 'feedback-jobs',
  maxFeedbackAttempts: toNumber(process.env.MAX_FEEDBACK_ATTEMPTS, 3),
  evaluationServiceUrl: process.env.EVALUATION_SERVICE_URL || 'http://localhost:3002',
  candidateServiceUrl: process.env.CANDIDATE_SERVICE_URL || 'http://localhost:3001',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  allowReadyReportRegeneration: toBoolean(process.env.ALLOW_READY_REPORT_REGENERATION, false),
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
};

module.exports = env;

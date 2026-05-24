require('dotenv').config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const splitCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const env = {
  port: toNumber(process.env.PORT, 8080),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtIssuer: process.env.JWT_ISSUER || '',
  jwtAudience: process.env.JWT_AUDIENCE || '',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3005',
  mediaServiceUrl: process.env.MEDIA_SERVICE_URL || 'http://localhost:3000',
  candidateServiceUrl: process.env.CANDIDATE_SERVICE_URL || 'http://localhost:3001',
  interviewServiceUrl: process.env.INTERVIEW_SERVICE_URL || 'http://localhost:3002',
  evaluationServiceUrl: process.env.EVALUATION_SERVICE_URL || 'http://localhost:3003',
  feedbackServiceUrl: process.env.FEEDBACK_SERVICE_URL || 'http://localhost:3004',
  corsOrigins: splitCsv(process.env.CORS_ORIGIN, ['http://localhost:5173', 'http://localhost:3000']),
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000),
  rateLimitMaxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 300),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '10mb',
  defaultProxyTimeoutMs: toNumber(process.env.DEFAULT_PROXY_TIMEOUT_MS, 120000),
  mediaProxyTimeoutMs: toNumber(process.env.MEDIA_PROXY_TIMEOUT_MS, 300000),
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = env;

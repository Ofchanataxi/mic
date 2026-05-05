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
  port: toNumber(process.env.PORT, 3002),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  evaluationQueueName: process.env.EVALUATION_QUEUE_NAME || 'evaluation-jobs',
  maxEvaluationAttempts: toNumber(process.env.MAX_EVALUATION_ATTEMPTS, 3),
  interviewServiceUrl: process.env.INTERVIEW_SERVICE_URL || 'http://localhost:3003',
  mediaServiceUrl: process.env.MEDIA_SERVICE_URL || 'http://localhost:3000',
  candidateServiceUrl: process.env.CANDIDATE_SERVICE_URL || 'http://localhost:3001',
  feedbackServiceUrl: process.env.FEEDBACK_SERVICE_URL || 'http://localhost:3004',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiTranscriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
  judge0ApiKey: process.env.JUDGE0_API_KEY || '',
  judge0ApiUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  judge0ApiHost: process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
  tempProcessingDir: process.env.TEMP_PROCESSING_DIR || './tmp/evaluation',
  allowCompletedReprocess: toBoolean(process.env.ALLOW_COMPLETED_REPROCESS, false),
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  scoreWeights: {
    technicalSemantic: toNumber(process.env.TECHNICAL_SEMANTIC_WEIGHT, 0.8),
    technicalAudio: toNumber(process.env.TECHNICAL_AUDIO_WEIGHT, 0.2),
    technicalVideo: toNumber(process.env.TECHNICAL_VIDEO_WEIGHT, 0),
    softSemantic: toNumber(process.env.SOFT_SEMANTIC_WEIGHT, 0.7),
    softAudio: toNumber(process.env.SOFT_AUDIO_WEIGHT, 0.3),
    softVideo: toNumber(process.env.SOFT_VIDEO_WEIGHT, 0),
    codeCode: toNumber(process.env.CODE_CODE_WEIGHT, 0.8),
    codeSemantic: toNumber(process.env.CODE_SEMANTIC_WEIGHT, 0.2),
  },
};

module.exports = env;

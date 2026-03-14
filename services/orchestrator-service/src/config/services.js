export const servicesConfig = {
  useMocks: process.env.USE_MOCKS !== 'false',
  timeoutMs: Number(process.env.HTTP_TIMEOUT_MS ?? 8000),
  publishFeedback: process.env.PUBLISH_FEEDBACK !== 'false',
  eventToken: process.env.ORCHESTRATOR_EVENT_TOKEN ?? 'dev-token',
  enableDb: process.env.ENABLE_DB !== 'false',
  audioBaseUrl: process.env.AUDIO_SERVICE_URL ?? 'http://audio-analysis-service:3008',
  videoBaseUrl: process.env.VIDEO_SERVICE_URL ?? 'http://video-analysis-service:3009',
  contentBaseUrl: process.env.CONTENT_SERVICE_URL ?? 'http://content-evaluation-service:3010',
  codeBaseUrl: process.env.CODE_SERVICE_URL ?? 'http://code-evaluation-service:3011',
  feedbackBaseUrl: process.env.FEEDBACK_SERVICE_URL ?? 'http://feedback-service:3012',
};

export const dbConfig = {
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? '1234',
  database: process.env.POSTGRES_DB ?? 'mic_orchestrator',
  max: Number(process.env.POSTGRES_POOL_MAX ?? 10),
};

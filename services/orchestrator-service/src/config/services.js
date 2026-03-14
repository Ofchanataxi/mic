export const servicesConfig = {
  useMocks: process.env.USE_MOCKS !== 'false',
  timeoutMs: Number(process.env.HTTP_TIMEOUT_MS ?? 8000),
  audioBaseUrl: process.env.AUDIO_SERVICE_URL ?? 'http://audio-analysis-service:3008',
  videoBaseUrl: process.env.VIDEO_SERVICE_URL ?? 'http://video-analysis-service:3009',
  contentBaseUrl: process.env.CONTENT_SERVICE_URL ?? 'http://content-evaluation-service:3010',
  codeBaseUrl: process.env.CODE_SERVICE_URL ?? 'http://code-evaluation-service:3011',
};

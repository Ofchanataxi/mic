import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validateAnalyzeRequest } from './utils/validation.js';
import { analyzeSegment } from './domain/analyzeSegment.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'audio-analysis-service',
    sttConfigured: Boolean(serviceConfig.sttModelPath),
  });
});

app.post('/audio/analyze', async (req, res) => {
  const validationError = validateAnalyzeRequest(req.body, serviceConfig.maxSegmentDurationSeconds);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { interviewId, videoUrl, segments } = req.body;

  const results = await Promise.all(
    segments.map((segment) =>
      analyzeSegment({
        interviewId,
        videoUrl,
        segment,
        noiseDb: serviceConfig.silenceNoiseDb,
        silenceMinSeconds: serviceConfig.silenceMinSeconds,
        tempDir: serviceConfig.tempDir,
        sttCommand: serviceConfig.sttCommand,
        sttArgsTemplate: serviceConfig.sttArgsTemplate,
        sttModelPath: serviceConfig.sttModelPath,
        sttLanguage: serviceConfig.sttLanguage,
        sttTimeoutMs: serviceConfig.sttTimeoutMs,
      }),
    ),
  );

  return res.json({
    interviewId,
    videoUrl,
    results,
  });
});

export default app;

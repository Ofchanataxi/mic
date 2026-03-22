import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validateAnalyzeRequest } from './utils/validation.js';
import { analyzeSegment } from './domain/analyzeSegment.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'video-analysis-service', eyeContactModelConfigured: false });
});

app.post('/video/analyze', async (req, res) => {
  const validationError = validateAnalyzeRequest(req.body, serviceConfig.maxSegmentDurationSeconds);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { interviewId, videoUrl, segments } = req.body;

  const results = await Promise.all(
    segments.map((segment) =>
      analyzeSegment({
        videoUrl,
        segment,
        fps: serviceConfig.frameFps,
      }),
    ),
  );

  return res.json({ interviewId, videoUrl, results });
});

export default app;

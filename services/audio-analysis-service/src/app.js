import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validateAnalyzeRequest } from './utils/validation.js';
import { analyzeSegment } from './domain/analyzeSegment.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'audio-analysis-service' });
});

app.post('/audio/analyze', (req, res) => {
  const validationError = validateAnalyzeRequest(req.body, serviceConfig.maxSegmentDurationSeconds);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const results = req.body.segments.map((segment) => analyzeSegment(segment));

  return res.json({
    interviewId: req.body.interviewId,
    videoUrl: req.body.videoUrl,
    results,
  });
});

export default app;

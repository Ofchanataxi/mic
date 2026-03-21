import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validateContentEvaluationRequest } from './utils/validation.js';
import { evaluateContent } from './domain/evaluateContent.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'content-evaluation-service',
    analysisMode: 'simulated-heuristic',
  });
});

app.post('/content/evaluate', (req, res) => {
  const validationError = validateContentEvaluationRequest(req.body, serviceConfig);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  return res.json({
    questionId: req.body.questionId,
    ...evaluateContent({
      questionText: req.body.questionText,
      transcript: req.body.transcript,
    }),
  });
});

export default app;

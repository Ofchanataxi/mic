import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validateCodeEvaluateRequest } from './utils/validation.js';
import { evaluateCode } from './domain/evaluateCode.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'code-evaluation-service',
    analysisMode: 'simulated-heuristic',
  });
});

app.post('/code/evaluate', (req, res) => {
  const validationError = validateCodeEvaluateRequest(req.body, serviceConfig.maxSourceLength);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const result = evaluateCode({
    sourceCode: req.body.sourceCode,
    language: req.body.language,
    maxEstimatedComplexity: serviceConfig.maxEstimatedComplexity,
  });

  return res.json({
    interviewId: req.body.interviewId,
    questionId: req.body.questionId,
    ...result,
  });
});

export default app;

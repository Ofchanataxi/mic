import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validateCreateInterviewRequest } from './utils/validation.js';
import { buildInterviewPlan } from './domain/buildInterviewPlan.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'interview-service' });
});

app.post('/interviews', (req, res) => {
  const error = validateCreateInterviewRequest(req.body);
  if (error) return res.status(400).json({ error });
  return res.status(201).json(buildInterviewPlan(req.body));
});

export default app;

import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validatePlanRequest } from './utils/validation.js';
import { generatePlan } from './domain/generatePlan.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'adaptability-service' });
});

app.post('/adaptability/generate-plan', (req, res) => {
  const error = validatePlanRequest(req.body);
  if (error) return res.status(400).json({ error });
  return res.json(generatePlan(req.body));
});

export default app;

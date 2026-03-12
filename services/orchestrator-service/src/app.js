import express from 'express';
import { servicesConfig } from './config/services.js';
import { orchestrateInterview } from './application/orchestrateInterview.js';

const app = express();
app.use(express.json());

const processedEvents = new Set();

function validateRequest(body) {
  if (!body.interviewId) return 'interviewId is required';
  if (body.segments && !Array.isArray(body.segments)) return 'segments must be an array';

  if (Array.isArray(body.segments)) {
    const invalid = body.segments.find((s) => !s.questionId);
    if (invalid) return 'every segment must include questionId';
  }

  return null;
}

function isValidEventToken(req) {
  const token = req.header('x-orchestrator-token');
  return token && token === servicesConfig.eventToken;
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'orchestrator-service',
    week: 3,
    publishFeedback: servicesConfig.publishFeedback,
  });
});

app.post('/orchestrator/evaluate-interview', async (req, res) => {
  const validationError = validateRequest(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const result = await orchestrateInterview(req.body);
  return res.json(result);
});

app.post('/orchestrator/events/interview-finished', async (req, res) => {
  if (!isValidEventToken(req)) {
    return res.status(401).json({ error: 'invalid orchestration token' });
  }

  const validationError = validateRequest(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const eventId = req.body.eventId ?? `interview-${req.body.interviewId}`;
  if (processedEvents.has(eventId)) {
    return res.status(200).json({ status: 'already_processed', eventId });
  }

  const result = await orchestrateInterview(req.body);
  processedEvents.add(eventId);

  return res.status(202).json({
    status: result.warnings.length ? 'processed_with_warnings' : 'processed',
    eventId,
    interviewId: req.body.interviewId,
    warnings: result.warnings,
    feedbackPublication: result.feedbackPublication,
  });
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3007);
  app.listen(port, () => {
    console.log(`orchestrator-service listening on ${port}`);
  });
}

export default app;

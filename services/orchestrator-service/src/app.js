import express from 'express';
import { collectAnalysis } from './application/collectAnalysis.js';
import { mergeByQuestion } from './domain/mergeAnalyses.js';
import { scoreInterview } from './domain/scoreInterview.js';
import { buildFeedbackReport } from './domain/buildFeedbackReport.js';

const app = express();
app.use(express.json());

function validateRequest(body) {
  if (!body.interviewId) return 'interviewId is required';
  if (body.segments && !Array.isArray(body.segments)) return 'segments must be an array';

  if (Array.isArray(body.segments)) {
    const invalid = body.segments.find((s) => !s.questionId);
    if (invalid) return 'every segment must include questionId';
  }

  return null;
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orchestrator-service' });
});

app.post('/orchestrator/evaluate-interview', async (req, res) => {
  const validationError = validateRequest(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { interviewId, videoUrl = null, segments = [] } = req.body;

  const rawAnalysis = await collectAnalysis({ interviewId, videoUrl, segments });
  const merged = mergeByQuestion(rawAnalysis);
  const scoring = scoreInterview(merged);
  const report = buildFeedbackReport({
    interviewId,
    questionResults: scoring.questionResults,
    globalScore: scoring.globalScore,
  });

  return res.json({
    interviewId,
    globalScore: scoring.globalScore,
    questionResults: scoring.questionResults,
    strengths: report.summary.strengths,
    improvementAreas: report.summary.improvementAreas,
    warnings: rawAnalysis.warnings,
    report,
  });
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3007);
  app.listen(port, () => {
    console.log(`orchestrator-service listening on ${port}`);
  });
}

export default app;

import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validateFeedbackReport } from './utils/validation.js';
import { getReport, saveReport } from './persistence/fileFeedbackRepository.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'feedback-service',
    storageDir: serviceConfig.storageDir,
    simulateEmail: serviceConfig.simulateEmail,
  });
});

app.post('/feedback/internal', async (req, res) => {
  const validationError = validateFeedbackReport(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const record = await saveReport({
    storageDir: serviceConfig.storageDir,
    report: req.body,
  });

  return res.status(202).json({
    interviewId: req.body.interviewId,
    status: 'PUBLISHED',
    storage: 'file',
    notification: serviceConfig.simulateEmail ? record.emailNotification : { simulated: false, status: 'disabled' },
  });
});

app.get('/feedback/:interviewId', async (req, res) => {
  try {
    const record = await getReport({
      storageDir: serviceConfig.storageDir,
      interviewId: req.params.interviewId,
    });

    return res.json(record.report);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Feedback report not found.' });
    }

    throw error;
  }
});

export default app;

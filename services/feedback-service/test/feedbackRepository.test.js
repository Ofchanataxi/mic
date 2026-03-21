import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { saveReport, getReport } from '../src/persistence/fileFeedbackRepository.js';
import { validateFeedbackReport } from '../src/utils/validation.js';

test('saveReport persists feedback and getReport reads it back', async () => {
  const storageDir = await mkdtemp(path.join(tmpdir(), 'feedback-service-'));

  try {
    const report = {
      interviewId: 'interview-123',
      summary: { globalScore: 0.75 },
      questionBreakdown: [],
    };

    const saved = await saveReport({ storageDir, report });
    const loaded = await getReport({ storageDir, interviewId: report.interviewId });

    assert.equal(saved.report.interviewId, report.interviewId);
    assert.equal(loaded.report.interviewId, report.interviewId);
    assert.equal(loaded.emailNotification.status, 'queued');
  } finally {
    await rm(storageDir, { recursive: true, force: true });
  }
});

test('validateFeedbackReport rejects malformed payloads', () => {
  assert.match(validateFeedbackReport(null), /required/i);
  assert.match(validateFeedbackReport({ interviewId: '1', summary: {} }), /questionBreakdown/i);
});

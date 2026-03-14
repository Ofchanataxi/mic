import test from 'node:test';
import assert from 'node:assert/strict';
import { createInMemoryPersistence } from '../src/persistence/inMemoryPersistence.js';

test('in-memory persistence supports idempotency and report storage', async () => {
  const persistence = createInMemoryPersistence();

  assert.equal(await persistence.isEventProcessed('evt-1'), false);
  await persistence.markEventProcessed({ eventId: 'evt-1', interviewId: 'i-1' });
  assert.equal(await persistence.isEventProcessed('evt-1'), true);

  await persistence.saveInterviewEvaluation({ interviewId: 'i-1', globalScore: 0.9, report: { ok: true } });
  const report = await persistence.getInterviewEvaluation('i-1');
  assert.equal(report.globalScore, 0.9);
});

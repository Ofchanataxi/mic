import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInterviewPlan } from '../src/domain/buildInterviewPlan.js';

test('buildInterviewPlan returns ordered questions and orchestration contract', () => {
  const plan = buildInterviewPlan({
    candidateId: 'candidate-1',
    profileId: 'profile-1',
    targetRole: 'BACKEND_MID',
    adaptabilityPlan: {
      domainsPriority: [{ domain: 'backend' }, { domain: 'databases' }, { domain: 'soft-skills' }],
    },
  });

  assert.equal(plan.status, 'CREATED');
  assert.ok(plan.questions.length >= 3);
  assert.equal(plan.orchestrationContract.segments.length, plan.questions.length);
});

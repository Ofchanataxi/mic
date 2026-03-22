import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from '../src/domain/generatePlan.js';

test('generatePlan prioritizes required domains', () => {
  const plan = generatePlan({ candidateId: 'candidate-demo', targetRole: 'BACKEND_MID', profileId: 'profile-1' });
  assert.ok(plan.domainsPriority.length >= 3);
  assert.ok(plan.domainsPriority.some((item) => item.domain === 'databases' && item.weight >= 0.8));
});

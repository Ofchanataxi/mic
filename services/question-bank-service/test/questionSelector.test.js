import test from 'node:test';
import assert from 'node:assert/strict';
import { findCodingExercise, findQuestions } from '../src/domain/questionSelector.js';

test('findQuestions filters by domain and type', () => {
  const results = findQuestions({ domain: 'backend', type: 'TECHNICAL' });
  assert.ok(results.length >= 1);
  assert.ok(results.every((item) => item.domain === 'backend'));
});

test('findCodingExercise returns exercise by id', () => {
  assert.equal(findCodingExercise('q-code-js-1')?.language, 'javascript');
});

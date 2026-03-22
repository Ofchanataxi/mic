import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCode } from '../src/domain/evaluateCode.js';
import { validateCodeEvaluateRequest } from '../src/utils/validation.js';

test('evaluateCode returns stronger result for structured implementation', () => {
  const result = evaluateCode({
    language: 'javascript',
    maxEstimatedComplexity: 100,
    sourceCode: `
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }

  throw new Error('No solution');
}

console.log(twoSum([2, 7, 11, 15], 9));
`,
  });

  assert.equal(result.analysisMode, 'simulated-heuristic');
  assert.equal(result.status, 'COMPLETED');
  assert.ok(result.score >= 45);
  assert.ok(result.passedTests >= 4);
});

test('evaluateCode flags clearly incomplete implementation', () => {
  const result = evaluateCode({
    language: 'python',
    maxEstimatedComplexity: 100,
    sourceCode: `
def solve(nums):
    pass
`,
  });

  assert.equal(result.status, 'FAILED');
  assert.match(result.compileError, /incomplete implementation/i);
  assert.ok(result.passedTests <= result.totalTests);
});

test('validateCodeEvaluateRequest rejects unsupported language and missing body', () => {
  assert.match(validateCodeEvaluateRequest(null, 1000), /required/i);
  assert.match(
    validateCodeEvaluateRequest(
      { interviewId: '1', questionId: '2', sourceCode: 'print(1)', language: 'ruby' },
      1000,
    ),
    /language must be one of/i,
  );
});

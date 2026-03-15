import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeByQuestion } from '../src/domain/mergeAnalyses.js';
import { scoreInterview } from '../src/domain/scoreInterview.js';
import { buildFeedbackReport } from '../src/domain/buildFeedbackReport.js';

test('merges sources by question and computes scores/report', () => {
  const merged = mergeByQuestion({
    semanticResults: [
      { questionId: 'q1', technicalScore: 0.8, clarityScore: 0.7, depthScore: 0.6, justification: 'OK' },
    ],
    audioResults: [{ questionId: 'q1', speechRate: 130, pauseRatio: 0.2, confidenceScore: 0.8 }],
    videoResults: [{ questionId: 'q1', eyeContactScore: 0.8, postureScore: 0.7, nervousMovementScore: 0.2 }],
    codeResults: [{ questionId: 'q1', passedTests: 8, totalTests: 10, score: 0.8, compileError: null }],
  });

  const { questionResults, globalScore } = scoreInterview(merged);
  assert.equal(questionResults.length, 1);
  assert.ok(globalScore > 0.7);

  const report = buildFeedbackReport({ interviewId: 'i1', questionResults, globalScore });
  assert.equal(report.interviewId, 'i1');
  assert.equal(report.questionBreakdown.length, 1);
});

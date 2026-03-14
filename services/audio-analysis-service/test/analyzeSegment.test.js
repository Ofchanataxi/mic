import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSegment } from '../src/domain/analyzeSegment.js';
import { validateAnalyzeRequest } from '../src/utils/validation.js';

test('analyzeSegment returns stable metrics for same segment input', () => {
  const input = { questionId: 'q1', start: 10, end: 40 };
  const r1 = analyzeSegment(input);
  const r2 = analyzeSegment(input);

  assert.deepEqual(r1, r2);
  assert.equal(r1.questionId, 'q1');
  assert.ok(r1.speechRate >= 110 && r1.speechRate <= 165);
  assert.ok(r1.pauseRatio >= 0.05 && r1.pauseRatio <= 0.6);
});

test('validateAnalyzeRequest validates required fields and ranges', () => {
  const ok = validateAnalyzeRequest(
    {
      interviewId: 'i1',
      videoUrl: 's3://video.mp4',
      segments: [{ questionId: 'q1', start: 1, end: 4 }],
    },
    120,
  );
  assert.equal(ok, null);

  const bad = validateAnalyzeRequest({ interviewId: 'i1', segments: [] }, 120);
  assert.equal(bad, 'videoUrl is required');
});

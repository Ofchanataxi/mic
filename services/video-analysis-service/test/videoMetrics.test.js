import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSignalStats, parseCropBoxes, buildVideoScores } from '../src/utils/ffmpegMetrics.js';
import { validateAnalyzeRequest } from '../src/utils/validation.js';

test('parseSignalStats extracts frame stats from ffmpeg metadata output', () => {
  const log = `
frame:0 lavfi.signalstats.YAVG=112.0
frame:0 lavfi.signalstats.SATAVG=55.0
frame:1 lavfi.signalstats.YAVG=120.0
frame:1 lavfi.signalstats.SATAVG=60.0
`;

  const parsed = parseSignalStats(log);
  assert.equal(parsed.frameCount, 2);
  assert.equal(parsed.yavgMean, 116);
});

test('parseCropBoxes computes motion index', () => {
  const log = `
[Parsed_cropdetect] crop=200:180:10:20
[Parsed_cropdetect] crop=200:180:14:24
[Parsed_cropdetect] crop=200:180:18:29
`;

  const parsed = parseCropBoxes(log);
  assert.equal(parsed.boxCount, 3);
  assert.ok(parsed.motionIndex > 0);
});

test('buildVideoScores derives posture and movement from real metrics', () => {
  const scores = buildVideoScores({
    signal: { yavgStdDev: 10 },
    crop: { motionIndex: 12 },
  });

  assert.equal(scores.eyeContactScore, null);
  assert.ok(scores.postureScore > 0.5);
  assert.ok(scores.nervousMovementScore >= 0);
});

test('validateAnalyzeRequest validates request fields', () => {
  const ok = validateAnalyzeRequest(
    {
      interviewId: 'i1',
      videoUrl: 'sample.mp4',
      segments: [{ questionId: 'q1', start: 0, end: 10 }],
    },
    180,
  );
  assert.equal(ok, null);

  const bad = validateAnalyzeRequest({ interviewId: 'i1', segments: [] }, 180);
  assert.equal(bad, 'videoUrl is required');
});

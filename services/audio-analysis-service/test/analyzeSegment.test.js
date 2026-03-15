import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSilenceDurations } from '../src/utils/ffmpegSilence.js';
import { computeSpeechRateWpm } from '../src/utils/audioMath.js';
import { validateAnalyzeRequest } from '../src/utils/validation.js';

test('parseSilenceDurations calculates cumulative silence from ffmpeg log', () => {
  const log = `
    [silencedetect] silence_start: 0.43
    [silencedetect] silence_end: 1.03 | silence_duration: 0.60
    [silencedetect] silence_start: 2.00
    [silencedetect] silence_end: 2.40 | silence_duration: 0.40
  `;

  const silence = parseSilenceDurations(log, 10);
  assert.equal(silence, 1);
});

test('computeSpeechRateWpm uses transcript when available', () => {
  const rate = computeSpeechRateWpm({
    transcript: 'hola este es un texto de siete palabras',
    durationSeconds: 21,
    speechDurationSeconds: 15,
  });

  assert.equal(rate, 23);
});

test('validateAnalyzeRequest validates required fields and ranges', () => {
  const ok = validateAnalyzeRequest(
    {
      interviewId: 'i1',
      videoUrl: 'sample.mp4',
      segments: [{ questionId: 'q1', start: 1, end: 4, transcript: 'hola mundo' }],
    },
    120,
  );
  assert.equal(ok, null);

  const bad = validateAnalyzeRequest({ interviewId: 'i1', segments: [] }, 120);
  assert.equal(bad, 'videoUrl is required');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { collectAnalysis } from '../src/application/collectAnalysis.js';
import { servicesConfig } from '../src/config/services.js';

test('collectAnalysis uses mock provider when USE_MOCKS=true', async () => {
  servicesConfig.useMocks = true;

  const result = await collectAnalysis({ interviewId: 'interview-demo' });
  assert.equal(Array.isArray(result.semanticResults), true);
  assert.equal(result.warnings.length, 0);
});

test('collectAnalysis tolerates partial failures in external services', async () => {
  servicesConfig.useMocks = false;
  servicesConfig.timeoutMs = 500;
  servicesConfig.audioBaseUrl = 'http://audio';
  servicesConfig.videoBaseUrl = 'http://video';
  servicesConfig.contentBaseUrl = 'http://content';
  servicesConfig.codeBaseUrl = 'http://code';

  global.fetch = async (url) => {
    if (url.includes('/audio/analyze')) {
      return { ok: true, json: async () => ({ results: [{ questionId: 'q1', confidenceScore: 0.7 }] }) };
    }

    return { ok: false, status: 503, text: async () => 'service unavailable' };
  };

  const result = await collectAnalysis({
    interviewId: 'i2',
    videoUrl: 's3://x/video.mp4',
    segments: [{ questionId: 'q1', start: 0, end: 10, transcript: 'hola', questionText: 'cuentame' }],
  });

  assert.equal(result.audioResults.length, 1);
  assert.equal(result.videoResults.length, 0);
  assert.equal(result.semanticResults.length, 0);
  assert.equal(result.codeResults.length, 0);
  assert.ok(result.warnings.length >= 2);

  servicesConfig.useMocks = true;
});

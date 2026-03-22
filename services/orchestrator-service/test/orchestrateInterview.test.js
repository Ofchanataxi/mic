import test from 'node:test';
import assert from 'node:assert/strict';
import { orchestrateInterview } from '../src/application/orchestrateInterview.js';
import { servicesConfig } from '../src/config/services.js';

test('orchestrateInterview publishes feedback report when enabled', async () => {
  servicesConfig.useMocks = true;
  servicesConfig.publishFeedback = true;
  servicesConfig.feedbackBaseUrl = 'http://feedback';

  global.fetch = async (url) => {
    assert.equal(url, 'http://feedback/feedback/internal');
    return { ok: true, json: async () => ({ saved: true }) };
  };

  const result = await orchestrateInterview({ interviewId: 'interview-demo' });

  assert.equal(result.feedbackPublication.status, 'published');
  assert.equal(result.feedbackPublication.result.saved, true);
});

test('orchestrateInterview degrades when feedback publication fails', async () => {
  servicesConfig.useMocks = true;
  servicesConfig.publishFeedback = true;
  servicesConfig.feedbackBaseUrl = 'http://feedback';

  global.fetch = async () => ({ ok: false, status: 503, text: async () => 'down' });

  const result = await orchestrateInterview({ interviewId: 'interview-demo' });

  assert.equal(result.feedbackPublication.status, 'failed');
  assert.ok(result.warnings.some((w) => w.startsWith('feedback_publish_failed:')));
});

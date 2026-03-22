import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCandidateProfile } from '../src/domain/profileBuilder.js';

test('buildCandidateProfile detects domains and level from cv text', () => {
  const profile = buildCandidateProfile({
    userId: 'user-1',
    cvText: 'Backend developer with 3 years of experience using Node, Express, React, PostgreSQL, Docker and testing with Jest.',
  });

  assert.equal(profile.detectedExperienceLevel, 'MID');
  assert.ok(profile.detectedDomains.some((domain) => domain.domain === 'backend'));
  assert.ok(profile.detectedDomains.some((domain) => domain.domain === 'databases'));
});

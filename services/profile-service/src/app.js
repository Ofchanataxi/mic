import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { validateCreateProfileRequest } from './utils/validation.js';
import { buildCandidateProfile } from './domain/profileBuilder.js';
import { getProfile, saveProfile } from './store/profileStore.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'profile-service' });
});

app.post('/profiles/cv', (req, res) => {
  const error = validateCreateProfileRequest(req.body, serviceConfig.maxCvTextLength);
  if (error) return res.status(400).json({ error });

  const profile = saveProfile(buildCandidateProfile(req.body));
  return res.status(201).json({
    profileId: profile.id,
    status: 'COMPLETED',
    profile,
  });
});

app.get('/profiles/:profileId', (req, res) => {
  const profile = getProfile(req.params.profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });
  return res.json(profile);
});

export default app;

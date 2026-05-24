const express = require('express');
const axios = require('axios');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const services = {
  auth: env.authServiceUrl,
  media: env.mediaServiceUrl,
  candidate: env.candidateServiceUrl,
  interview: env.interviewServiceUrl,
  evaluation: env.evaluationServiceUrl,
  feedback: env.feedbackServiceUrl,
};

const checkService = async (baseUrl) => {
  if (!baseUrl) return 'not_configured';
  try {
    await axios.get(`${baseUrl}/health`, { timeout: 3000 });
    return 'ok';
  } catch (_) {
    return 'unavailable';
  }
};

const health = (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};

router.get('/health', health);
router.get('/api/v1/health', health);

router.get('/api/v1/health/services', asyncHandler(async (req, res) => {
  const entries = await Promise.all(
    Object.entries(services).map(async ([name, url]) => [name, await checkService(url)]),
  );

  res.json({
    gateway: 'ok',
    services: Object.fromEntries(entries),
  });
}));

module.exports = router;

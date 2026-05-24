const axios = require('axios');
const env = require('../config/env');

const client = axios.create({
  baseURL: env.candidateServiceUrl,
  timeout: 30000,
});

const sendPerformance = async ({ userId, interviewId, results, overall }) => {
  const response = await client.post(`/candidates/${encodeURIComponent(userId)}/performance`, {
    interviewId,
    results,
    overall,
  });
  return response.data;
};

module.exports = {
  sendPerformance,
};

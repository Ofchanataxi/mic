const axios = require('axios');
const env = require('../config/env');

const client = axios.create({
  baseURL: env.feedbackServiceUrl,
  timeout: 15000,
});

const notifyEvaluationReady = async ({ interviewId, userId, evaluationId, overallScore }) => {
  const response = await client.post('/feedback/evaluation-ready', {
    interviewId,
    userId,
    evaluationId,
    overallScore,
  });
  return response.data;
};

module.exports = {
  notifyEvaluationReady,
};

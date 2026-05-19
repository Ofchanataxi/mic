const axios = require('axios');
const env = require('../config/env');

const client = axios.create({
  baseURL: env.evaluationServiceUrl,
  timeout: 30000,
});

const getInterviewEvaluation = async (interviewId) => {
  const response = await client.get(`/evaluations/interviews/${encodeURIComponent(interviewId)}`);
  return response.data;
};

module.exports = {
  getInterviewEvaluation,
};

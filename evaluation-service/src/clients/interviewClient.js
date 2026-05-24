const axios = require('axios');
const env = require('../config/env');

const client = axios.create({
  baseURL: env.interviewServiceUrl,
  timeout: 30000,
});

const getEvaluationData = async (interviewId) => {
  const response = await client.get(`/interviews/${encodeURIComponent(interviewId)}/evaluation-payload`);
  return response.data;
};

module.exports = {
  getEvaluationData,
};

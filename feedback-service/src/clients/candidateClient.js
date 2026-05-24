const axios = require('axios');
const env = require('../config/env');

const client = axios.create({
  baseURL: env.candidateServiceUrl,
  timeout: 15000,
});

const getProfile = async (userId) => {
  const response = await client.get(`/candidates/profile/${encodeURIComponent(userId)}`);
  return response.data;
};

const getTopics = async (userId) => {
  const response = await client.get(`/candidates/${encodeURIComponent(userId)}/topics`);
  return response.data;
};

module.exports = {
  getProfile,
  getTopics,
};

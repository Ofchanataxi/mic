const axios = require('axios');
const env = require('../config/env');

const client = axios.create({
  baseURL: env.mediaServiceUrl,
  timeout: 30000,
});

const getMedia = async (mediaId) => {
  const response = await client.get(`/media/${encodeURIComponent(mediaId)}`);
  return response.data;
};

const getMediaAccess = async (mediaId) => {
  const response = await client.get(`/media/${encodeURIComponent(mediaId)}/access`);
  return response.data;
};

module.exports = {
  getMedia,
  getMediaAccess,
};

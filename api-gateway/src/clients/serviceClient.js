const axios = require('axios');
const env = require('../config/env');

const buildHeaders = (req) => {
  const headers = {
    'x-request-id': req.requestId,
  };

  if (env.internalServiceToken) {
    headers['x-internal-service-token'] = env.internalServiceToken;
  }

  if (req.headers.authorization) headers.authorization = req.headers.authorization;
  if (req.user?.userId) headers['x-user-id'] = req.user.userId;
  if (req.user?.role) headers['x-user-role'] = req.user.role;
  if (req.user?.email) headers['x-user-email'] = req.user.email;

  return headers;
};

const requestService = async (req, { baseURL, method = 'get', url, params, data, responseType }) => {
  const response = await axios.request({
    baseURL,
    method,
    url,
    params,
    data,
    responseType,
    timeout: env.defaultProxyTimeoutMs,
    headers: buildHeaders(req),
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    const message = response.data?.error?.message || response.data?.message || 'Upstream request failed';
    const error = new Error(message);
    error.statusCode = response.status;
    error.code = response.data?.error?.code || response.data?.code || 'UPSTREAM_ERROR';
    throw error;
  }

  return response.data;
};

module.exports = {
  requestService,
};

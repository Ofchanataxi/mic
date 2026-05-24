const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const env = require('../config/env');
const logger = require('../utils/logger');

const buildProxyHeaders = (req) => {
  const headers = {
    'x-request-id': req.requestId,
  };

  if (req.user?.userId) headers['x-user-id'] = req.user.userId;
  if (req.user?.role) headers['x-user-role'] = req.user.role;
  if (req.user?.email) headers['x-user-email'] = req.user.email;
  if (req.header('x-internal-service-token')) {
    headers['x-internal-service-token'] = req.header('x-internal-service-token');
  }

  return headers;
};

const mapProxyError = (error) => {
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || /timeout/i.test(error.message)) {
    return {
      statusCode: 504,
      code: 'UPSTREAM_TIMEOUT',
      message: 'Upstream service timeout',
    };
  }
  return {
    statusCode: 502,
    code: 'UPSTREAM_UNAVAILABLE',
    message: 'Upstream service unavailable',
  };
};

const createServiceProxy = ({
  serviceName,
  target,
  prefix,
  timeoutMs = env.defaultProxyTimeoutMs,
}) => createProxyMiddleware({
  target,
  changeOrigin: true,
  proxyTimeout: timeoutMs,
  timeout: timeoutMs,
  pathRewrite: {
    [`^${prefix}`]: prefix.replace('/api/v1', ''),
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      const headers = buildProxyHeaders(req);
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) proxyReq.setHeader(key, value);
      });
      fixRequestBody(proxyReq, req, res);
    },
    proxyRes: (proxyRes, req) => {
      logger.debug('Proxy response received', {
        requestId: req.requestId,
        serviceName,
        statusCode: proxyRes.statusCode,
      });
    },
    error: (error, req, res) => {
      const mapped = mapProxyError(error);
      logger.error('Proxy error', {
        requestId: req.requestId,
        serviceName,
        target,
        error: error.message,
        code: error.code,
      });

      if (!res.headersSent) {
        res.status(mapped.statusCode).json({
          error: {
            message: mapped.message,
            code: mapped.code,
            requestId: req.requestId,
          },
        });
      }
    },
  },
});

module.exports = {
  createServiceProxy,
};

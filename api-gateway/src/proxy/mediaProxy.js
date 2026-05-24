const env = require('../config/env');
const { createServiceProxy } = require('./proxyFactory');

module.exports = createServiceProxy({
  serviceName: 'media-service',
  target: env.mediaServiceUrl,
  prefix: '/api/v1/media',
  timeoutMs: env.mediaProxyTimeoutMs,
});

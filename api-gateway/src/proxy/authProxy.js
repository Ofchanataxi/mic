const env = require('../config/env');
const { createServiceProxy } = require('./proxyFactory');

module.exports = createServiceProxy({
  serviceName: 'auth-service',
  target: env.authServiceUrl,
  prefix: '/api/v1/auth',
});

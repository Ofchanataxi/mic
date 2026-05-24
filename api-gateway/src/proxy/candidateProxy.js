const env = require('../config/env');
const { createServiceProxy } = require('./proxyFactory');

module.exports = createServiceProxy({
  serviceName: 'candidate-service',
  target: env.candidateServiceUrl,
  prefix: '/api/v1/candidates',
});

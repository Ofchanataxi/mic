const env = require('../config/env');
const { createServiceProxy } = require('./proxyFactory');

module.exports = createServiceProxy({
  serviceName: 'evaluation-service',
  target: env.evaluationServiceUrl,
  prefix: '/api/v1/evaluations',
});

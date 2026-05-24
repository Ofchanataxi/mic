const env = require('../config/env');
const { createServiceProxy } = require('./proxyFactory');

module.exports = createServiceProxy({
  serviceName: 'interview-service',
  target: env.interviewServiceUrl,
  prefix: '/api/v1/interviews',
});

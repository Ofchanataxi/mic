const env = require('../config/env');
const { createServiceProxy } = require('./proxyFactory');

module.exports = createServiceProxy({
  serviceName: 'feedback-service',
  target: env.feedbackServiceUrl,
  prefix: '/api/v1/feedback',
});

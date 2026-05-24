const crypto = require('crypto');
const morgan = require('morgan');
const logger = require('../utils/logger');

const requestIdMiddleware = (req, res, next) => {
  const requestId = req.header('x-request-id') || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

morgan.token('request-id', (req) => req.requestId || '-');

const httpLogger = morgan(':method :url :status :response-time ms requestId=:request-id', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
  skip: (req) => req.path === '/health',
});

module.exports = {
  requestIdMiddleware,
  httpLogger,
};

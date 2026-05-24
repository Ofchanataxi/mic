const logger = require('../utils/logger');
const { sendError } = require('../utils/responseUtils');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  if (statusCode >= 500) {
    logger.error('Request failed', {
      requestId: req.requestId,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  sendError(res, statusCode, err.message || 'Internal server error', code, req.requestId);
};

module.exports = {
  AppError,
  errorMiddleware,
};

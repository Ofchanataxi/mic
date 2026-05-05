const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
  });
};

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    logger.error('Unhandled request error', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
    });
  }

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    details: err.details,
  });
};

module.exports = {
  AppError,
  notFoundMiddleware,
  errorMiddleware,
};

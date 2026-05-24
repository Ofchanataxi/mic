const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
};

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  if (statusCode >= 500) {
    logger.error('Unhandled request error', {
      path: req.originalUrl,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      code,
    },
  });
};

module.exports = {
  AppError,
  notFoundMiddleware,
  errorMiddleware,
};

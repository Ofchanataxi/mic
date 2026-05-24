const { AppError } = require('./errorMiddleware');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  }
  return next();
};

module.exports = {
  requireRole,
};

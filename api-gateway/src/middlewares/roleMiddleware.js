const { sendError } = require('../utils/responseUtils');

const normalize = (role) => String(role || '').toUpperCase();

const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (req.internalService) return next();

  const role = normalize(req.user?.role);
  const allowed = allowedRoles.map(normalize);

  if (!role) {
    return sendError(res, 401, 'Authenticated user is required', 'AUTH_REQUIRED', req.requestId);
  }

  if (role === 'ADMIN' || allowed.includes(role)) {
    return next();
  }

  return sendError(res, 403, 'Insufficient role for this route', 'FORBIDDEN', req.requestId);
};

const allowAuthenticated = requireRoles('CANDIDATE', 'ADMIN', 'SERVICE');

module.exports = {
  requireRoles,
  allowAuthenticated,
};

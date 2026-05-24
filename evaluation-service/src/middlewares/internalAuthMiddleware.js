const env = require('../config/env');

const internalAuthMiddleware = (req, res, next) => {
  if (!env.internalServiceToken) return next();

  const providedToken = req.header('x-internal-service-token');
  if (providedToken !== env.internalServiceToken) {
    return res.status(401).json({ error: 'Invalid internal service token' });
  }

  return next();
};

module.exports = internalAuthMiddleware;

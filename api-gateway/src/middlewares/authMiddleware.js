const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sendError } = require('../utils/responseUtils');

const normalizeRole = (decoded) => {
  if (decoded.role) return String(decoded.role).toUpperCase();
  if (Array.isArray(decoded.roles) && decoded.roles.length) return String(decoded.roles[0]).toUpperCase();
  return 'CANDIDATE';
};

const buildUser = (decoded) => {
  const userId = decoded.userId || decoded.id || decoded.sub;
  return {
    id: decoded.id || userId,
    userId,
    role: normalizeRole(decoded),
    email: decoded.email || null,
  };
};

const allowsQueryAccessToken = (req) => {
  const path = req.originalUrl.split('?')[0];
  return req.method === 'GET' && /^\/api\/v1\/media\/[^/]+\/file$/.test(path);
};

const markInternalService = (req, res, next) => {
  const provided = req.header('x-internal-service-token');
  req.internalService = Boolean(env.internalServiceToken && provided && provided === env.internalServiceToken);
  if (req.internalService) {
    req.user = {
      id: 'internal-service',
      userId: 'internal-service',
      role: 'SERVICE',
      email: null,
    };
  }
  next();
};

const authenticate = (req, res, next) => {
  if (req.internalService) return next();

  const header = req.header('authorization') || '';
  const [scheme, headerToken] = header.split(' ');
  const queryToken = allowsQueryAccessToken(req) && typeof req.query.accessToken === 'string'
    ? req.query.accessToken
    : '';
  const token = scheme === 'Bearer' && headerToken ? headerToken : queryToken;
  if (scheme !== 'Bearer' || !token) {
    if (!queryToken) {
      return sendError(res, 401, 'Authorization bearer token is required', 'AUTH_TOKEN_REQUIRED', req.requestId);
    }
  }

  if (!env.jwtSecret) {
    return sendError(res, 500, 'JWT_SECRET is not configured', 'JWT_SECRET_NOT_CONFIGURED', req.requestId);
  }

  try {
    const verifyOptions = {};
    if (env.jwtIssuer) verifyOptions.issuer = env.jwtIssuer;
    if (env.jwtAudience) verifyOptions.audience = env.jwtAudience;
    const decoded = jwt.verify(token, env.jwtSecret, verifyOptions);
    req.user = buildUser(decoded);
    return next();
  } catch (error) {
    const code = error.name === 'TokenExpiredError' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID';
    return sendError(res, 401, 'Invalid or expired token', code, req.requestId);
  }
};

const optionalAuthenticate = (req, res, next) => {
  if (req.internalService || req.user) return next();
  const header = req.header('authorization') || '';
  if (!header) return next();
  return authenticate(req, res, next);
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  markInternalService,
};

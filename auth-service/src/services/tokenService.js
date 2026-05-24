const jwt = require('jsonwebtoken');
const env = require('../config/env');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const { createOpaqueToken, sha256, parseDurationMs } = require('../utils/tokenUtils');

const assertJwtSecret = () => {
  if (!env.jwtSecret) throw new Error('JWT_SECRET is required');
};

const createAccessToken = (user) => {
  assertJwtSecret();
  return jwt.sign(
    {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      issuer: env.jwtIssuer || undefined,
      audience: env.jwtAudience || undefined,
    },
  );
};

const createRefreshToken = async (userId) => {
  const refreshToken = createOpaqueToken();
  const tokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwtRefreshExpiresIn));
  const storedToken = await refreshTokenRepository.create({ userId, tokenHash, expiresAt });
  return { refreshToken, storedToken };
};

const verifyAccessToken = (token) => {
  assertJwtSecret();
  const options = {};
  if (env.jwtIssuer) options.issuer = env.jwtIssuer;
  if (env.jwtAudience) options.audience = env.jwtAudience;
  return jwt.verify(token, env.jwtSecret, options);
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
};

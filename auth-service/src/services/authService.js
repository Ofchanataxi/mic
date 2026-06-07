const userRepository = require('../repositories/userRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const userService = require('./userService');
const tokenService = require('./tokenService');
const { comparePassword } = require('../utils/passwordUtils');
const { sha256 } = require('../utils/tokenUtils');
const { toPublicUser } = require('../dto/authDto');
const { AppError } = require('../middlewares/errorMiddleware');
const accountActionService = require('./accountActionService');

const validateActiveUser = (user) => {
  if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  if (user.status !== 'ACTIVE') throw new AppError('User is disabled', 403, 'USER_DISABLED');
};

const issueTokens = async (user) => {
  const accessToken = tokenService.createAccessToken(user);
  const { refreshToken } = await tokenService.createRefreshToken(user.id);
  return { accessToken, refreshToken };
};

const register = async ({ email, password, firstName, lastName }) => {
  const user = await userService.createUser({
    email,
    password,
    firstName,
    lastName,
    role: 'CANDIDATE',
  });
  await accountActionService.sendVerification(user);
  return {
    user: toPublicUser(user),
    message: 'Account created. Check your email to verify your account.',
  };
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  validateActiveUser(user);
  if (!user.emailVerifiedAt) {
    throw new AppError('Email verification is required', 403, 'EMAIL_NOT_VERIFIED');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const updatedUser = await userRepository.updateLastLogin(user.id);
  const tokens = await issueTokens(updatedUser);
  return { user: toPublicUser(updatedUser), ...tokens };
};

const refresh = async ({ refreshToken }) => {
  const tokenHash = sha256(refreshToken);
  const stored = await refreshTokenRepository.findByHash(tokenHash);
  if (!stored) throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  if (stored.revokedAt) throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  if (stored.expiresAt <= new Date()) throw new AppError('Refresh token expired', 401, 'TOKEN_EXPIRED');

  validateActiveUser(stored.user);

  const accessToken = tokenService.createAccessToken(stored.user);
  const next = await tokenService.createRefreshToken(stored.userId);
  await refreshTokenRepository.revoke(stored.id, next.storedToken.id);

  return {
    accessToken,
    refreshToken: next.refreshToken,
  };
};

const logout = async ({ refreshToken }) => {
  if (!refreshToken) return;
  const stored = await refreshTokenRepository.findByHash(sha256(refreshToken));
  if (stored && !stored.revokedAt) {
    await refreshTokenRepository.revoke(stored.id);
  }
};

const createAdminManagedUser = async ({ email, password, firstName, lastName, role }) => {
  const user = await userService.createUser({
    email,
    password,
    firstName,
    lastName,
    role,
    emailVerifiedAt: new Date(),
  });
  return toPublicUser(user);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  createAdminManagedUser,
};

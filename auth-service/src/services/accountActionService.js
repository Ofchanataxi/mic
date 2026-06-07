const userRepository = require('../repositories/userRepository');
const actionTokenRepository = require('../repositories/actionTokenRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const emailService = require('./emailService');
const { createOpaqueToken, sha256, parseDurationMs } = require('../utils/tokenUtils');
const { hashPassword } = require('../utils/passwordUtils');
const { AppError } = require('../middlewares/errorMiddleware');
const env = require('../config/env');
const logger = require('../utils/logger');

const createActionToken = async ({ userId, type, expiresIn }) => {
  await actionTokenRepository.invalidateActive(userId, type);
  const token = createOpaqueToken();
  await actionTokenRepository.create({
    userId,
    type,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + parseDurationMs(expiresIn)),
  });
  return token;
};

const sendVerification = async (user) => {
  if (user.emailVerifiedAt) return;
  const token = await createActionToken({
    userId: user.id,
    type: 'EMAIL_VERIFICATION',
    expiresIn: env.emailVerificationExpiresIn,
  });
  await emailService.sendVerificationEmail({ user, token });
};

const verifyEmail = async (token) => {
  const stored = await actionTokenRepository.findByHashAndType(sha256(token), 'EMAIL_VERIFICATION');
  if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
    throw new AppError('Verification link is invalid or expired', 400, 'INVALID_VERIFICATION_TOKEN');
  }
  await userRepository.markEmailVerified(stored.userId);
  await actionTokenRepository.markUsed(stored.id);
};

const resendVerification = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user || user.emailVerifiedAt || user.status !== 'ACTIVE') return;
  try {
    await sendVerification(user);
  } catch (error) {
    logger.error('Could not send verification email', { userId: user.id, message: error.message });
    throw error;
  }
};

const requestPasswordReset = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user || user.status !== 'ACTIVE') return;
  const token = await createActionToken({
    userId: user.id,
    type: 'PASSWORD_RESET',
    expiresIn: env.passwordResetExpiresIn,
  });
  await emailService.sendPasswordResetEmail({ user, token });
};

const resetPassword = async ({ token, password }) => {
  const stored = await actionTokenRepository.findByHashAndType(sha256(token), 'PASSWORD_RESET');
  if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
    throw new AppError('Password reset link is invalid or expired', 400, 'INVALID_PASSWORD_RESET_TOKEN');
  }

  const passwordHash = await hashPassword(password);
  await userRepository.updatePassword(stored.userId, passwordHash);
  await refreshTokenRepository.revokeAllForUser(stored.userId);
  await actionTokenRepository.markUsed(stored.id);
};

module.exports = {
  sendVerification,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
};

const authService = require('../services/authService');
const userService = require('../services/userService');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { toPublicUser } = require('../dto/authDto');
const { AppError } = require('../middlewares/errorMiddleware');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    throw new AppError('Valid email is required', 400, 'VALIDATION_ERROR');
  }
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
  }
};

const validateOptionalString = (value, field) => {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new AppError(`${field} must be a string`, 400, 'VALIDATION_ERROR');
  }
};

const validateCredentials = (body) => {
  validateEmail(body?.email);
  validatePassword(body?.password);
  validateOptionalString(body.firstName, 'firstName');
  validateOptionalString(body.lastName, 'lastName');
};

const health = asyncHandler(async (req, res) => {
  let db = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (_) {
    db = 'unavailable';
  }
  res.json({
    service: 'auth-service',
    status: 'ok',
    db,
    timestamp: new Date().toISOString(),
  });
});

const register = asyncHandler(async (req, res) => {
  validateCredentials(req.body || {});
  if (req.body.role && req.body.role !== 'CANDIDATE') {
    throw new AppError('Role cannot be assigned from public register endpoint', 400, 'VALIDATION_ERROR');
  }
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  validateEmail(req.body?.email);
  if (!req.body?.password) throw new AppError('Password is required', 400, 'VALIDATION_ERROR');
  const result = await authService.login(req.body);
  res.json(result);
});

const refresh = asyncHandler(async (req, res) => {
  if (!req.body?.refreshToken || typeof req.body.refreshToken !== 'string') {
    throw new AppError('refreshToken is required', 400, 'VALIDATION_ERROR');
  }
  const result = await authService.refresh({ refreshToken: req.body.refreshToken });
  res.json(result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout({ refreshToken: req.body?.refreshToken });
  res.json({ message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

const createAdminUser = asyncHandler(async (req, res) => {
  validateCredentials(req.body || {});
  const role = req.body.role || 'CANDIDATE';
  if (!['ADMIN', 'CANDIDATE'].includes(role)) {
    throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');
  }
  const user = await authService.createAdminManagedUser({ ...req.body, role });
  res.status(201).json({ user });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  res.json({ users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['ACTIVE', 'DISABLED'].includes(status)) {
    throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
  }
  const existing = await userRepository.findById(req.params.id);
  if (!existing) throw new AppError('User not found', 404, 'NOT_FOUND');
  const user = await userService.updateUserStatus(req.params.id, status);
  res.json({ user });
});

module.exports = {
  health,
  register,
  login,
  refresh,
  logout,
  me,
  createAdminUser,
  listUsers,
  updateUserStatus,
};

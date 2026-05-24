const tokenService = require('../services/tokenService');
const userRepository = require('../repositories/userRepository');
const { AppError } = require('./errorMiddleware');

const authenticate = async (req, res, next) => {
  try {
    const header = req.header('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Authorization bearer token is required', 401, 'UNAUTHORIZED');
    }

    const decoded = tokenService.verifyAccessToken(token);
    const userId = decoded.userId || decoded.id || decoded.sub;
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 401, 'UNAUTHORIZED');
    if (user.status !== 'ACTIVE') throw new AppError('User is disabled', 403, 'USER_DISABLED');

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401, 'UNAUTHORIZED'));
    }
    return next(error);
  }
};

module.exports = {
  authenticate,
};

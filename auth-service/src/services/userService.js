const userRepository = require('../repositories/userRepository');
const { hashPassword } = require('../utils/passwordUtils');
const { toPublicUser } = require('../dto/authDto');
const { AppError } = require('../middlewares/errorMiddleware');

const createUser = async ({
  email,
  password,
  firstName,
  lastName,
  role = 'CANDIDATE',
  emailVerifiedAt = null,
}) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new AppError('Email already exists', 409, 'EMAIL_ALREADY_EXISTS');

  const passwordHash = await hashPassword(password);
  const user = await userRepository.create({
    email,
    passwordHash,
    firstName: firstName || null,
    lastName: lastName || null,
    role,
    emailVerifiedAt,
  });

  return user;
};

const getPublicUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return toPublicUser(user);
};

const listUsers = async () => {
  const users = await userRepository.listUsers();
  return users.map(toPublicUser);
};

const updateUserStatus = async (id, status) => {
  const user = await userRepository.updateStatus(id, status);
  return toPublicUser(user);
};

module.exports = {
  createUser,
  getPublicUserById,
  listUsers,
  updateUserStatus,
};

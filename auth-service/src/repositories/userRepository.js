const prisma = require('../config/prisma');

const findByEmail = (email) => prisma.user.findUnique({ where: { email: email.toLowerCase() } });

const findById = (id) => prisma.user.findUnique({ where: { id } });

const create = (data) => prisma.user.create({
  data: {
    ...data,
    email: data.email.toLowerCase(),
  },
});

const updateLastLogin = (id) => prisma.user.update({
  where: { id },
  data: { lastLoginAt: new Date() },
});

const countAdmins = () => prisma.user.count({ where: { role: 'ADMIN' } });

const listUsers = () => prisma.user.findMany({
  orderBy: { createdAt: 'desc' },
});

const updateStatus = (id, status) => prisma.user.update({
  where: { id },
  data: { status },
});

const markEmailVerified = (id) => prisma.user.update({
  where: { id },
  data: { emailVerifiedAt: new Date() },
});

const updatePassword = (id, passwordHash) => prisma.user.update({
  where: { id },
  data: { passwordHash },
});

module.exports = {
  findByEmail,
  findById,
  create,
  updateLastLogin,
  countAdmins,
  listUsers,
  updateStatus,
  markEmailVerified,
  updatePassword,
};

const prisma = require('../config/prisma');

const invalidateActive = (userId, type) => prisma.actionToken.updateMany({
  where: {
    userId,
    type,
    usedAt: null,
  },
  data: { usedAt: new Date() },
});

const create = ({ userId, type, tokenHash, expiresAt }) => prisma.actionToken.create({
  data: { userId, type, tokenHash, expiresAt },
});

const findByHashAndType = (tokenHash, type) => prisma.actionToken.findFirst({
  where: { tokenHash, type },
  include: { user: true },
});

const markUsed = (id) => prisma.actionToken.update({
  where: { id },
  data: { usedAt: new Date() },
});

module.exports = {
  invalidateActive,
  create,
  findByHashAndType,
  markUsed,
};

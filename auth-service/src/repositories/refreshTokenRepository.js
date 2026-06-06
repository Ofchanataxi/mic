const prisma = require('../config/prisma');

const create = ({ userId, tokenHash, expiresAt }) => prisma.refreshToken.create({
  data: { userId, tokenHash, expiresAt },
});

const findByHash = (tokenHash) => prisma.refreshToken.findFirst({
  where: { tokenHash },
  include: { user: true },
});

const revoke = (id, replacedByTokenId = null) => prisma.refreshToken.update({
  where: { id },
  data: {
    revokedAt: new Date(),
    replacedByTokenId,
  },
});

const revokeAllForUser = (userId) => prisma.refreshToken.updateMany({
  where: { userId, revokedAt: null },
  data: { revokedAt: new Date() },
});

module.exports = {
  create,
  findByHash,
  revoke,
  revokeAllForUser,
};

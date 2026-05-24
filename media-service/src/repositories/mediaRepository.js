const { prisma } = require("../config/prisma");

class MediaRepository {
  create(data) {
    return prisma.media.create({ data });
  }

  findById(id) {
    return prisma.media.findUnique({ where: { id } });
  }

  updateById(id, data) {
    return prisma.media.update({
      where: { id },
      data
    });
  }
}

const mediaRepository = new MediaRepository();

module.exports = {
  mediaRepository
};

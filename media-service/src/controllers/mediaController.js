const { mediaService } = require("../services/mediaService");
const { safeRemoveFile } = require("../utils/file");

async function uploadMedia(req, res, next) {
  try {
    const result = await mediaService.uploadMedia({
      file: req.file,
      resourceType: req.body.resourceType,
      interviewId: req.body.interviewId,
      ownerId: req.body.ownerId
    });

    res.status(201).json(result);
  } catch (error) {
    await safeRemoveFile(req.file && req.file.path);
    next(error);
  }
}

async function getMediaById(req, res, next) {
  try {
    const media = await mediaService.getMediaById(req.params.id);
    res.status(200).json(media);
  } catch (error) {
    next(error);
  }
}

async function getMediaStatus(req, res, next) {
  try {
    const status = await mediaService.getMediaStatus(req.params.id);
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
}

async function getMediaAccess(req, res, next) {
  try {
    const access = await mediaService.getMediaAccess(req.params.id);
    res.status(200).json(access);
  } catch (error) {
    next(error);
  }
}

async function streamMediaFile(req, res, next) {
  try {
    await mediaService.streamMediaFile(req.params.id, res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadMedia,
  getMediaById,
  getMediaStatus,
  getMediaAccess,
  streamMediaFile
};

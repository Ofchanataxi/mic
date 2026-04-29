const path = require("path");
const { mediaRepository } = require("../repositories/mediaRepository");
const { mediaProcessingQueue } = require("../config/queue");
const { storageProvider } = require("../storage");
const { ApiError } = require("../utils/apiError");
const { ResourceType, MediaStatus } = require("../utils/constants");
const { validateUploadPayload, validateFileForResourceType } = require("../utils/validators");
const { safeRemoveFile } = require("../utils/file");
const { env } = require("../config/env");

class MediaService {
  async uploadMedia({ file, resourceType, interviewId, ownerId }) {
    validateUploadPayload({ file, resourceType, interviewId, ownerId });
    validateFileForResourceType({ file, resourceType });

    const media = await mediaRepository.create({
      resourceType,
      interviewId,
      ownerId,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: BigInt(file.size),
      status: MediaStatus.UPLOADED
    });

    if (resourceType === ResourceType.PDF) {
      try {
        const storageKey = storageProvider.buildStorageKey({
          mediaId: media.id,
          interviewId,
          resourceType,
          originalFilename: file.originalname
        });

        await storageProvider.uploadFile({
          sourcePath: file.path,
          destination: storageKey,
          contentType: file.mimetype
        });

        await mediaRepository.updateById(media.id, {
          storageKey,
          bucketName: storageProvider.getBucketName(),
          status: MediaStatus.READY
        });

        return {
          mediaId: media.id,
          status: MediaStatus.READY,
          message: "PDF uploaded successfully"
        };
      } catch (error) {
        await mediaRepository.updateById(media.id, {
          status: MediaStatus.FAILED,
          errorMessage: error.message
        });

        throw error;
      } finally {
        await safeRemoveFile(file.path);
      }
    }

    try {
      await mediaProcessingQueue.add(
        "process-video",
        {
          mediaId: media.id,
          inputPath: file.path,
          interviewId,
          originalFilename: file.originalname
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 100
        }
      );
    } catch (error) {
      await mediaRepository.updateById(media.id, {
        status: MediaStatus.FAILED,
        errorMessage: error.message
      });
      await safeRemoveFile(file.path);
      throw error;
    }

    return {
      mediaId: media.id,
      status: MediaStatus.UPLOADED,
      message: "Video uploaded and queued for processing"
    };
  }

  async getMediaById(id) {
    const media = await this.requireMedia(id);
    return this.serializeMedia(media);
  }

  async getMediaStatus(id) {
    const media = await this.requireMedia(id);

    return {
      mediaId: media.id,
      status: media.status,
      errorMessage: media.errorMessage
    };
  }

  async getMediaAccess(id) {
    const media = await this.requireMedia(id);

    if (media.status !== MediaStatus.READY || !media.storageKey) {
      throw new ApiError(409, "Media is not ready for access");
    }

    return {
      mediaId: media.id,
      status: media.status,
      accessUrl: `${env.serviceBaseUrl}/media/${media.id}/file`,
      resourceType: media.resourceType,
      mimeType: media.mimeType
    };
  }

  async streamMediaFile(id, res) {
    const media = await this.requireMedia(id);

    if (media.status !== MediaStatus.READY || !media.storageKey) {
      throw new ApiError(409, "Media is not ready for streaming");
    }

    res.setHeader("Content-Type", media.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(media.storageKey)}"`
    );

    await storageProvider.streamFile(media.storageKey, res);
  }

  async requireMedia(id) {
    const media = await mediaRepository.findById(id);

    if (!media) {
      throw new ApiError(404, "Media not found");
    }

    return media;
  }

  serializeMedia(media) {
    return {
      ...media,
      sizeBytes: media.sizeBytes.toString()
    };
  }
}

const mediaService = new MediaService();

module.exports = {
  mediaService
};

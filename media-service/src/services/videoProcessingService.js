const path = require("path");
const { mediaRepository } = require("../repositories/mediaRepository");
const { storageProvider } = require("../storage");
const { MediaStatus, ResourceType } = require("../utils/constants");
const { runFfmpegOptimization, probeMediaDuration } = require("../utils/ffmpeg");
const { safeRemoveFile, buildOutputFilePath } = require("../utils/file");

class VideoProcessingService {
  async processVideoJob({ mediaId, inputPath, interviewId, originalFilename }) {
    const media = await mediaRepository.findById(mediaId);

    if (!media) {
      throw new Error(`Media ${mediaId} not found`);
    }

    const outputPath = buildOutputFilePath(inputPath, `${mediaId}-optimized.mp4`);

    await mediaRepository.updateById(mediaId, {
      status: MediaStatus.PROCESSING,
      errorMessage: null
    });

    try {
      await runFfmpegOptimization({
        inputPath,
        outputPath
      });

      const durationMs = await probeMediaDuration(outputPath);
      const storageKey = storageProvider.buildStorageKey({
        mediaId,
        interviewId,
        resourceType: ResourceType.VIDEO,
        originalFilename
      });

      await storageProvider.uploadFile({
        sourcePath: outputPath,
        destination: storageKey,
        contentType: "video/mp4"
      });

      await mediaRepository.updateById(mediaId, {
        status: MediaStatus.READY,
        storageKey,
        bucketName: storageProvider.getBucketName(),
        mimeType: "video/mp4",
        durationMs,
        errorMessage: null
      });
    } catch (error) {
      await mediaRepository.updateById(mediaId, {
        status: MediaStatus.FAILED,
        errorMessage: error.message
      });

      throw error;
    } finally {
      await safeRemoveFile(inputPath);
      await safeRemoveFile(outputPath);
    }
  }
}

const videoProcessingService = new VideoProcessingService();

module.exports = {
  videoProcessingService
};

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs/promises');

const runFfmpeg = (command) => new Promise((resolve, reject) => {
  command.on('end', resolve).on('error', reject).run();
});

const ensureFfmpegAvailable = async () => new Promise((resolve, reject) => {
  ffmpeg.getAvailableFormats((error) => {
    if (error) return reject(new Error(`FFmpeg is not available: ${error.message}`));
    return resolve(true);
  });
});

const getMediaMetadata = async (videoPath) => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(videoPath, (error, metadata) => {
    if (error) return reject(error);
    return resolve(metadata);
  });
});

const extractAudioSegment = async ({ videoPath, outputPath, startTimeMs, endTimeMs }) => {
  const durationMs = endTimeMs - startTimeMs;
  if (durationMs <= 0) throw new Error('Invalid timestamp range for audio extraction');
  await fs.mkdir(require('path').dirname(outputPath), { recursive: true });

  await runFfmpeg(
    ffmpeg(videoPath)
      .setStartTime(startTimeMs / 1000)
      .duration(durationMs / 1000)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('96k')
      .audioChannels(1)
      .audioFrequency(16000)
      .output(outputPath),
  );

  return outputPath;
};

const optionallyExtractVideoSegment = async ({ videoPath, outputPath, startTimeMs, endTimeMs }) => {
  const durationMs = endTimeMs - startTimeMs;
  if (durationMs <= 0) throw new Error('Invalid timestamp range for video extraction');
  await fs.mkdir(require('path').dirname(outputPath), { recursive: true });

  await runFfmpeg(
    ffmpeg(videoPath)
      .setStartTime(startTimeMs / 1000)
      .duration(durationMs / 1000)
      .outputOptions(['-c copy'])
      .output(outputPath),
  );

  return outputPath;
};

const extractVideoFrames = async ({ videoPath, outputDir, count = 3 }) => {
  await fs.mkdir(outputDir, { recursive: true });

  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        count,
        folder: outputDir,
        filename: 'frame-%i.jpg',
        size: '640x?',
      });
  });

  const files = await fs.readdir(outputDir);
  return files
    .filter((file) => /^frame-\d+\.jpg$/i.test(file))
    .sort()
    .map((file) => require('path').join(outputDir, file));
};

module.exports = {
  ensureFfmpegAvailable,
  getMediaMetadata,
  extractAudioSegment,
  optionallyExtractVideoSegment,
  extractVideoFrames,
};

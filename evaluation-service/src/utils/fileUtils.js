const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('./logger');

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const removeDir = async (dirPath) => {
  if (!dirPath) return;
  await fs.rm(dirPath, { recursive: true, force: true });
};

const safeName = (value) => String(value).replace(/[^a-zA-Z0-9._-]/g, '-');

const getInterviewTempPaths = async (baseDir, interviewId) => {
  const root = path.resolve(baseDir, safeName(interviewId));
  const source = path.join(root, 'source');
  const segments = path.join(root, 'segments');
  const videoSegments = path.join(root, 'video-segments');
  await Promise.all([ensureDir(source), ensureDir(segments), ensureDir(videoSegments)]);
  return {
    root,
    source,
    segments,
    videoSegments,
    sourceVideo: path.join(source, 'video.mp4'),
  };
};

const downloadFile = async (url, outputPath) => {
  await ensureDir(path.dirname(outputPath));
  const response = await axios.get(url, { responseType: 'stream', timeout: 120000 });
  const tempOutput = `${outputPath}.${crypto.randomUUID()}.download`;
  const handle = await fs.open(tempOutput, 'w');
  try {
    await new Promise((resolve, reject) => {
      const stream = handle.createWriteStream();
      response.data.pipe(stream);
      response.data.on('error', reject);
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    await fs.rename(tempOutput, outputPath);
  } catch (error) {
    await fs.rm(tempOutput, { force: true }).catch((cleanupError) => {
      logger.warn('Failed to remove partial download', { tempOutput, error: cleanupError.message });
    });
    throw error;
  } finally {
    await handle.close().catch(() => {});
  }
};

module.exports = {
  ensureDir,
  removeDir,
  getInterviewTempPaths,
  downloadFile,
  safeName,
};

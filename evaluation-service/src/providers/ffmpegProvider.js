const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs/promises');
const { spawn } = require('child_process');

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

const detectAudioSilences = async ({
  audioPath,
  noiseThresholdDb = -35,
  minimumSilenceMs = 350,
}) => new Promise((resolve, reject) => {
  const args = [
    '-hide_banner',
    '-nostats',
    '-i',
    audioPath,
    '-af',
    `silencedetect=noise=${noiseThresholdDb}dB:d=${minimumSilenceMs / 1000}`,
    '-f',
    'null',
    process.platform === 'win32' ? 'NUL' : '/dev/null',
  ];
  const processHandle = spawn('ffmpeg', args, { windowsHide: true });
  let stderr = '';

  processHandle.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  processHandle.on('error', (error) => reject(new Error(`Could not analyze audio pauses: ${error.message}`)));
  processHandle.on('close', (code) => {
    if (code !== 0) {
      reject(new Error(`Could not analyze audio pauses. FFmpeg exited with code ${code}`));
      return;
    }

    const events = [];
    const eventPattern = /silence_(start|end):\s*([\d.]+)(?:\s*\|\s*silence_duration:\s*([\d.]+))?/g;
    let match;
    while ((match = eventPattern.exec(stderr)) !== null) {
      events.push({
        type: match[1],
        timeMs: Math.round(Number(match[2]) * 1000),
        durationMs: match[3] ? Math.round(Number(match[3]) * 1000) : null,
      });
    }

    const silences = [];
    let currentStartMs = null;
    events.forEach((event) => {
      if (event.type === 'start') {
        currentStartMs = event.timeMs;
      } else if (event.type === 'end') {
        const durationMs = event.durationMs ?? (
          currentStartMs === null ? null : Math.max(0, event.timeMs - currentStartMs)
        );
        if (durationMs !== null) {
          silences.push({
            startMs: currentStartMs ?? Math.max(0, event.timeMs - durationMs),
            endMs: event.timeMs,
            durationMs,
          });
        }
        currentStartMs = null;
      }
    });

    resolve(silences);
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
  detectAudioSilences,
  extractAudioSegment,
  optionallyExtractVideoSegment,
  extractVideoFrames,
};

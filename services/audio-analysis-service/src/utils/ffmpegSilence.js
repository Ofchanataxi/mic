import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function parseSilenceDurations(ffmpegOutput, maxDurationSeconds) {
  const starts = [...ffmpegOutput.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...ffmpegOutput.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => Number(m[1]));

  const pairs = [];
  for (let i = 0; i < Math.min(starts.length, ends.length); i += 1) {
    if (Number.isFinite(starts[i]) && Number.isFinite(ends[i]) && ends[i] > starts[i]) {
      pairs.push([starts[i], ends[i]]);
    }
  }

  const totalSilence = pairs.reduce((acc, [start, end]) => acc + (end - start), 0);
  return Math.max(0, Math.min(maxDurationSeconds, totalSilence));
}

export async function detectSilenceWithFfmpeg({ inputPath, startSeconds, durationSeconds, noiseDb, silenceMinSeconds }) {
  const args = [
    '-hide_banner',
    '-nostats',
    '-ss',
    String(startSeconds),
    '-t',
    String(durationSeconds),
    '-i',
    inputPath,
    '-af',
    `silencedetect=noise=${noiseDb}dB:d=${silenceMinSeconds}`,
    '-f',
    'null',
    '-',
  ];

  try {
    const { stderr } = await execFileAsync('ffmpeg', args, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
    return {
      silenceSeconds: parseSilenceDurations(stderr, durationSeconds),
      mode: 'ffmpeg',
      error: null,
    };
  } catch (error) {
    const stderr = error?.stderr ?? '';
    if (typeof stderr === 'string' && stderr.includes('silence_start')) {
      return {
        silenceSeconds: parseSilenceDurations(stderr, durationSeconds),
        mode: 'ffmpeg',
        error: null,
      };
    }

    return {
      silenceSeconds: null,
      mode: 'failed',
      error: 'ffmpeg_silence_detection_failed',
    };
  }
}

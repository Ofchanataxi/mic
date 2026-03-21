import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function average(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function parseSignalStats(stderrText) {
  const yavg = [...stderrText.matchAll(/lavfi\.signalstats\.YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
  const satavg = [...stderrText.matchAll(/lavfi\.signalstats\.SATAVG=([\d.]+)/g)].map((m) => Number(m[1]));

  return {
    frameCount: Math.max(yavg.length, satavg.length),
    yavgMean: average(yavg),
    yavgStdDev: stdDev(yavg),
    satavgMean: average(satavg),
    satavgStdDev: stdDev(satavg),
  };
}

export function parseCropBoxes(stderrText) {
  const boxes = [...stderrText.matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)].map((m) => ({
    w: Number(m[1]),
    h: Number(m[2]),
    x: Number(m[3]),
    y: Number(m[4]),
  }));

  if (boxes.length < 2) {
    return { boxCount: boxes.length, motionIndex: null };
  }

  const moves = [];
  for (let i = 1; i < boxes.length; i += 1) {
    const prev = boxes[i - 1];
    const curr = boxes[i];
    const delta = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    moves.push(delta);
  }

  const motion = average(moves);
  return { boxCount: boxes.length, motionIndex: motion };
}

export async function runSignalStats({ inputPath, start, duration, fps }) {
  const args = [
    '-hide_banner',
    '-nostats',
    '-ss',
    String(start),
    '-t',
    String(duration),
    '-i',
    inputPath,
    '-vf',
    `fps=${fps},signalstats,metadata=print:file=-`,
    '-f',
    'null',
    '-',
  ];

  const { stdout, stderr } = await execFileAsync('ffmpeg', args, { windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
  const output = stdout + '\n' + stderr;
  return parseSignalStats(output);
}

export async function runCropDetect({ inputPath, start, duration, fps }) {
  const args = [
    '-hide_banner',
    '-nostats',
    '-ss',
    String(start),
    '-t',
    String(duration),
    '-i',
    inputPath,
    '-vf',
    `fps=${fps},cropdetect=24:16:0,metadata=print:file=-`,
    '-f',
    'null',
    '-',
  ];

  const { stdout, stderr } = await execFileAsync('ffmpeg', args, { windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
  
  const output = stdout + '\n' + stderr;
  return parseCropBoxes(output);
}

export function buildVideoScores({ signal, crop }) {
  const motionIndex = crop.motionIndex;
  const nervousMovementScore = Number.isFinite(motionIndex)
    ? clamp(motionIndex / 80)
    : null;

  const postureScore = Number.isFinite(motionIndex)
    ? clamp(1 - motionIndex / 100)
    : null;

  return {
    eyeContactScore: null,
    postureScore,
    nervousMovementScore,
    attentionScore: Number.isFinite(signal.yavgStdDev) ? clamp(1 - signal.yavgStdDev / 40) : null,
  };
}

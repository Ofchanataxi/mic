import { buildVideoScores, runCropDetect, runSignalStats } from '../utils/ffmpegMetrics.js';

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function analyzeSegment({ videoUrl, segment, fps }) {
  const { questionId, start, end } = segment;
  const duration = Math.max(0, end - start);
  const warnings = [];

  let signal = { frameCount: 0, yavgMean: null, yavgStdDev: null, satavgMean: null, satavgStdDev: null };
  let crop = { boxCount: 0, motionIndex: null };

  try {
    signal = await runSignalStats({ inputPath: videoUrl, start, duration, fps });
  } catch {
    warnings.push('ffmpeg_signalstats_failed');
  }

  try {
    crop = await runCropDetect({ inputPath: videoUrl, start, duration, fps });
  } catch {
    warnings.push('ffmpeg_cropdetect_failed');
  }

  const scores = buildVideoScores({ signal, crop });

  if (scores.eyeContactScore === null) {
    warnings.push('eye_contact_model_not_configured');
  }

  return {
    questionId,
    eyeContactScore: round(scores.eyeContactScore),
    postureScore: round(scores.postureScore),
    nervousMovementScore: round(scores.nervousMovementScore),
    attentionScore: round(scores.attentionScore),
    frameCount: signal.frameCount,
    motionIndex: round(crop.motionIndex),
    durationSeconds: round(duration),
    analysisMode: warnings.length ? 'partial' : 'full',
    warnings,
  };
}

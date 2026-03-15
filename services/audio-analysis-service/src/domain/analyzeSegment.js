import {
  clamp,
  computeConfidenceScore,
  computeFluencyScore,
  computeSpeechRateWpm,
  round,
} from '../utils/audioMath.js';
import { detectSilenceWithFfmpeg } from '../utils/ffmpegSilence.js';

export async function analyzeSegment({ videoUrl, segment, noiseDb = -35, silenceMinSeconds = 0.25 }) {
  const { questionId, start, end, transcript = '' } = segment;
  const durationSeconds = Math.max(0, Number(end) - Number(start));

  const silenceResult = await detectSilenceWithFfmpeg({
    inputPath: videoUrl,
    startSeconds: start,
    durationSeconds,
    noiseDb,
    silenceMinSeconds,
  });

  const silenceSeconds = Math.min(durationSeconds, Math.max(0, silenceResult.silenceSeconds));
  const speechDurationSeconds = Math.max(0, durationSeconds - silenceSeconds);
  const pauseRatio = durationSeconds > 0 ? silenceSeconds / durationSeconds : 0;
  const speechRate = computeSpeechRateWpm({ transcript, durationSeconds, speechDurationSeconds });
  const confidenceScore = computeConfidenceScore({ pauseRatio, speechRate });
  const fluencyScore = computeFluencyScore({ pauseRatio, speechRate });

  return {
    questionId,
    speechRate,
    pauseRatio: round(clamp(pauseRatio, 0, 1)),
    confidenceScore: round(confidenceScore),
    fluencyScore: round(fluencyScore),
    durationSeconds: round(durationSeconds),
    speechDurationSeconds: round(speechDurationSeconds),
    silenceSeconds: round(silenceSeconds),
    transcription: transcript || null,
    analysisMode: silenceResult.mode,
    warning: silenceResult.error,
  };
}

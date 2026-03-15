import fs from 'node:fs/promises';
import path from 'node:path';
import {
  clamp,
  computeConfidenceScore,
  computeFluencyScore,
  computeSpeechRateWpm,
  round,
} from '../utils/audioMath.js';
import { detectSilenceWithFfmpeg } from '../utils/ffmpegSilence.js';
import { extractSegmentWav, transcribeAudioFile } from '../utils/transcription.js';

function buildTempFilePath({ tempDir, interviewId, questionId, start, end }) {
  const safeQuestion = String(questionId).replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.resolve(tempDir, `${interviewId}_${safeQuestion}_${start}_${end}.wav`);
}

export async function analyzeSegment({
  interviewId,
  videoUrl,
  segment,
  noiseDb = -35,
  silenceMinSeconds = 0.25,
  tempDir = './tmp',
  sttCommand,
  sttArgsTemplate,
  sttModelPath,
  sttLanguage,
  sttTimeoutMs,
}) {
  const { questionId, start, end } = segment;
  const durationSeconds = Math.max(0, Number(end) - Number(start));
  const warnings = [];

  const silenceResult = await detectSilenceWithFfmpeg({
    inputPath: videoUrl,
    startSeconds: start,
    durationSeconds,
    noiseDb,
    silenceMinSeconds,
  });

  if (silenceResult.error) warnings.push(silenceResult.error);

  const tempAudioPath = buildTempFilePath({ tempDir, interviewId, questionId, start, end });

  let transcript = null;
  try {
    await extractSegmentWav({
      inputPath: videoUrl,
      startSeconds: start,
      durationSeconds,
      outputPath: tempAudioPath,
    });

    const transcriptionResult = await transcribeAudioFile({
      audioPath: tempAudioPath,
      sttCommand,
      sttArgsTemplate,
      sttModelPath,
      sttLanguage,
      timeoutMs: sttTimeoutMs,
    });

    transcript = transcriptionResult.transcript;
    if (transcriptionResult.error) warnings.push(transcriptionResult.error);
  } catch {
    warnings.push('audio_segment_extraction_failed');
  } finally {
    await fs.rm(tempAudioPath, { force: true }).catch(() => {});
  }

  const silenceSeconds = Number.isFinite(silenceResult.silenceSeconds)
    ? Math.min(durationSeconds, Math.max(0, silenceResult.silenceSeconds))
    : null;

  const speechDurationSeconds = Number.isFinite(silenceSeconds)
    ? Math.max(0, durationSeconds - silenceSeconds)
    : null;

  const pauseRatio = Number.isFinite(silenceSeconds) && durationSeconds > 0 ? silenceSeconds / durationSeconds : null;
  const speechRate = computeSpeechRateWpm({ transcript, durationSeconds });
  const confidenceScore = computeConfidenceScore({ pauseRatio, speechRate });
  const fluencyScore = computeFluencyScore({ pauseRatio, speechRate });

  return {
    questionId,
    speechRate,
    pauseRatio: round(Number.isFinite(pauseRatio) ? clamp(pauseRatio, 0, 1) : pauseRatio),
    confidenceScore: round(confidenceScore),
    fluencyScore: round(fluencyScore),
    durationSeconds: round(durationSeconds),
    speechDurationSeconds: round(speechDurationSeconds),
    silenceSeconds: round(silenceSeconds),
    transcription: transcript,
    analysisMode: warnings.length ? 'partial' : 'full',
    warnings,
  };
}

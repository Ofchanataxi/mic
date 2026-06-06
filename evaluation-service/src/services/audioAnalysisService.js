const { clampScore } = require('../utils/scoreUtils');
const ffmpegProvider = require('../providers/ffmpegProvider');

const fillerPatterns = [
  /\beh+\b/gi,
  /\bem+\b/gi,
  /\bmmm+\b/gi,
  /\beste+\b/gi,
  /\bo sea\b/gi,
  /\bpues\b/gi,
  /\bdigamos\b/gi,
  /\bcomo que\b/gi,
];

const countWords = (text) => {
  if (!text) return 0;
  const matches = String(text).trim().match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
};

const countSentences = (text) => {
  if (!text) return 0;
  const matches = String(text).split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  return matches.length;
};

const countFillers = (text) => fillerPatterns.reduce((count, pattern) => {
  const matches = String(text || '').match(pattern);
  return count + (matches ? matches.length : 0);
}, 0);

const scoreByRange = ({ value, min, idealMin, idealMax, max }) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 0;
  const numeric = Number(value);
  if (numeric < min || numeric > max) return 20;
  if (numeric >= idealMin && numeric <= idealMax) return 100;
  if (numeric < idealMin) {
    return clampScore(45 + ((numeric - min) / Math.max(1, idealMin - min)) * 55);
  }
  return clampScore(45 + ((max - numeric) / Math.max(1, max - idealMax)) * 55);
};

const calculateLengthScore = ({ wordCount, durationMs }) => {
  const durationSeconds = durationMs ? durationMs / 1000 : 0;
  if (wordCount === 0) return 0;
  if (wordCount < 5) return 8;
  if (wordCount < 12) return 20;
  if (wordCount < 25) return 40;
  if (wordCount < 45 && durationSeconds >= 35) return 55;
  if (wordCount > 260) return 70;
  if (wordCount > 190) return 85;
  return 100;
};

const calculateDensityScore = ({ wordCount, durationMs }) => {
  const durationSeconds = durationMs ? durationMs / 1000 : 0;
  if (wordCount === 0) return 0;
  if (!durationSeconds) return 35;

  const wordsPerSecond = wordCount / durationSeconds;
  if (wordsPerSecond < 0.15) return 10;
  if (wordsPerSecond < 0.35) return 30;
  if (wordsPerSecond < 0.7) return 55;
  if (wordsPerSecond > 3.8) return 55;
  if (wordsPerSecond > 3.2) return 75;
  return 100;
};

const calculateFillerPenalty = ({ fillerCount, wordCount }) => {
  if (!wordCount) return 0;
  const fillerRatio = fillerCount / wordCount;
  if (fillerRatio >= 0.15) return 30;
  if (fillerRatio >= 0.1) return 20;
  if (fillerRatio >= 0.06) return 10;
  return 0;
};

const calculateStructureScore = ({ sentenceCount, wordCount }) => {
  if (!wordCount) return 0;
  if (wordCount < 12) return 20;
  if (sentenceCount <= 1 && wordCount > 50) return 55;
  if (sentenceCount <= 1) return 70;
  if (sentenceCount >= 2) return 100;
  return 75;
};

const calculatePauseScore = ({ pauseCount, averagePauseMs, pauseRatio, pausesPerMinute }) => {
  if (pauseCount === 0) return 82;

  let durationScore = 100;
  if (averagePauseMs > 3000) durationScore = 25;
  else if (averagePauseMs > 2200) durationScore = 50;
  else if (averagePauseMs > 1500) durationScore = 72;
  else if (averagePauseMs < 400) durationScore = 85;

  let ratioScore = 100;
  if (pauseRatio > 0.4) ratioScore = 25;
  else if (pauseRatio > 0.3) ratioScore = 50;
  else if (pauseRatio > 0.22) ratioScore = 72;
  else if (pauseRatio < 0.03) ratioScore = 85;

  let frequencyScore = 100;
  if (pausesPerMinute > 20) frequencyScore = 35;
  else if (pausesPerMinute > 14) frequencyScore = 60;
  else if (pausesPerMinute > 10) frequencyScore = 80;

  return clampScore(Number((
    durationScore * 0.45
    + ratioScore * 0.35
    + frequencyScore * 0.2
  ).toFixed(2)));
};

const calculateFluencyScore = ({
  wordCount,
  durationMs,
  speechRate,
  fillerCount,
  sentenceCount,
  pauseScore,
}) => {
  if (!wordCount) return 0;

  const lengthScore = calculateLengthScore({ wordCount, durationMs });
  const speechRateScore = scoreByRange({
    value: speechRate,
    min: 45,
    idealMin: 95,
    idealMax: 165,
    max: 230,
  });
  const densityScore = calculateDensityScore({ wordCount, durationMs });
  const structureScore = calculateStructureScore({ sentenceCount, wordCount });
  const fillerPenalty = calculateFillerPenalty({ fillerCount, wordCount });

  const score = (
    lengthScore * 0.25
    + speechRateScore * 0.25
    + densityScore * 0.15
    + structureScore * 0.1
    + pauseScore * 0.25
    - fillerPenalty
  );

  return clampScore(Number(score.toFixed(2)));
};

const classifyResponseLength = (wordCount) => {
  if (wordCount === 0) return 'sin respuesta oral detectada';
  if (wordCount < 12) return 'respuesta demasiado breve';
  if (wordCount < 35) return 'respuesta breve';
  if (wordCount > 220) return 'respuesta muy extensa';
  if (wordCount > 160) return 'respuesta extensa';
  return 'respuesta desarrollada';
};

const classifySpeechRate = (speechRate) => {
  if (speechRate === null) return 'ritmo no estimado';
  if (speechRate < 55) return 'ritmo de habla muy bajo';
  if (speechRate < 85) return 'ritmo de habla bajo';
  if (speechRate > 220) return 'ritmo de habla muy alto';
  if (speechRate > 180) return 'ritmo de habla alto';
  return 'ritmo de habla dentro de rango esperado';
};

const classifyPauses = ({ pauseCount, averagePauseMs, pausesPerMinute, pauseRatio }) => {
  if (pauseCount === 0) return 'no se detectaron pausas internas prolongadas';
  if (averagePauseMs > 2500 || pauseRatio > 0.35) return 'se detectaron pausas prolongadas que reducen la continuidad';
  if (pausesPerMinute > 14) return 'se detectaron pausas muy frecuentes';
  if (averagePauseMs > 1500 || pauseRatio > 0.22) return 'se detectaron varias pausas de duración elevada';
  return 'las pausas apoyan una comunicación natural y organizada';
};

const analyzeAudio = async ({ audioPath, transcription, durationMs }) => {
  const wordCount = countWords(transcription);
  const sentenceCount = countSentences(transcription);
  const fillerCount = countFillers(transcription);
  const durationMinutes = durationMs ? durationMs / 60000 : 0;
  const speechRate = durationMinutes > 0 ? Number((wordCount / durationMinutes).toFixed(2)) : null;
  const detectedSilences = audioPath
    ? await ffmpegProvider.detectAudioSilences({ audioPath })
    : [];
  const internalPauses = detectedSilences.filter((silence) => (
    silence.startMs > 250
    && silence.endMs < Math.max(0, durationMs - 250)
  ));
  const pauseCount = internalPauses.length;
  const totalPauseMs = internalPauses.reduce((total, pause) => total + pause.durationMs, 0);
  const averagePauseMs = pauseCount > 0 ? Number((totalPauseMs / pauseCount).toFixed(2)) : 0;
  const pauseRatio = durationMs > 0 ? totalPauseMs / durationMs : 0;
  const pausesPerMinute = durationMinutes > 0 ? pauseCount / durationMinutes : 0;
  const pauseScore = calculatePauseScore({
    pauseCount,
    averagePauseMs,
    pauseRatio,
    pausesPerMinute,
  });
  const fluencyScore = calculateFluencyScore({
    wordCount,
    durationMs,
    speechRate,
    fillerCount,
    sentenceCount,
    pauseScore,
  });

  const confidenceIndicators = {
    responseLength: classifyResponseLength(wordCount),
    speechRate: classifySpeechRate(speechRate),
    structure: sentenceCount >= 2 ? 'respuesta con separacion de ideas' : 'estructura oral limitada',
    fillerUsage: fillerCount > 0 ? `muletillas detectadas: ${fillerCount}` : 'sin muletillas evidentes en transcripcion',
    silenceHandling: wordCount === 0 ? 'segmento tratado como silencio o sin voz confiable' : 'voz transcrita y evaluada',
    pauseEstimation: classifyPauses({
      pauseCount,
      averagePauseMs,
      pausesPerMinute,
      pauseRatio,
    }),
  };

  return {
    durationMs,
    wordCount,
    speechRate,
    pauseCount,
    averagePauseMs,
    fluencyScore,
    confidenceIndicators,
    rawData: {
      status: 'STRICT_HEURISTIC_AUDIO_ANALYSIS',
      notes: 'Audio analysis combines speech rate, response development, structure, filler usage and pauses detected directly from the audio signal.',
      componentScores: {
        lengthScore: calculateLengthScore({ wordCount, durationMs }),
        speechRateScore: scoreByRange({
          value: speechRate,
          min: 45,
          idealMin: 95,
          idealMax: 165,
          max: 230,
        }),
        densityScore: calculateDensityScore({ wordCount, durationMs }),
        structureScore: calculateStructureScore({ sentenceCount, wordCount }),
        pauseScore,
        fillerPenalty: calculateFillerPenalty({ fillerCount, wordCount }),
      },
      sentenceCount,
      fillerCount,
      totalPauseMs,
      pauseRatio: Number(pauseRatio.toFixed(4)),
      pausesPerMinute: Number(pausesPerMinute.toFixed(2)),
      detectedSilences,
      internalPauses,
    },
  };
};

module.exports = {
  analyzeAudio,
};

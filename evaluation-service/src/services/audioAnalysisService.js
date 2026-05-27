const { clampScore } = require('../utils/scoreUtils');

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

const calculateFluencyScore = ({ wordCount, durationMs, speechRate, fillerCount, sentenceCount }) => {
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
    lengthScore * 0.35
    + speechRateScore * 0.3
    + densityScore * 0.2
    + structureScore * 0.15
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

const analyzeAudio = ({ transcription, durationMs }) => {
  const wordCount = countWords(transcription);
  const sentenceCount = countSentences(transcription);
  const fillerCount = countFillers(transcription);
  const durationMinutes = durationMs ? durationMs / 60000 : 0;
  const speechRate = durationMinutes > 0 ? Number((wordCount / durationMinutes).toFixed(2)) : null;
  const fluencyScore = calculateFluencyScore({
    wordCount,
    durationMs,
    speechRate,
    fillerCount,
    sentenceCount,
  });

  const confidenceIndicators = {
    responseLength: classifyResponseLength(wordCount),
    speechRate: classifySpeechRate(speechRate),
    structure: sentenceCount >= 2 ? 'respuesta con separacion de ideas' : 'estructura oral limitada',
    fillerUsage: fillerCount > 0 ? `muletillas detectadas: ${fillerCount}` : 'sin muletillas evidentes en transcripcion',
    silenceHandling: wordCount === 0 ? 'segmento tratado como silencio o sin voz confiable' : 'voz transcrita y evaluada',
    pauseEstimation: 'pausas no estimadas directamente en este MVP',
  };

  return {
    durationMs,
    wordCount,
    speechRate,
    pauseCount: null,
    averagePauseMs: null,
    fluencyScore,
    confidenceIndicators,
    rawData: {
      status: 'STRICT_HEURISTIC_AUDIO_ANALYSIS',
      notes: 'Audio analysis uses transcription length, answer density, speech-rate range, simple structure and filler-word heuristics.',
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
        fillerPenalty: calculateFillerPenalty({ fillerCount, wordCount }),
      },
      sentenceCount,
      fillerCount,
    },
  };
};

module.exports = {
  analyzeAudio,
};

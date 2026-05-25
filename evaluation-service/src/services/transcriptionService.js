const openaiProvider = require('../providers/openaiProvider');
const logger = require('../utils/logger');

const SILENCE_HALLUCINATIONS = [
  'gracias por ver el video',
  'gracias por ver el vídeo',
  'gracias por mirar el video',
  'gracias por mirar el vídeo',
  'subtitulos realizados por la comunidad',
  'subtítulos realizados por la comunidad',
  'thank you for watching',
  'thanks for watching',
];

const normalizeForComparison = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\p{N}\s]/gu, '')
  .replace(/\s+/g, ' ')
  .trim();

const isLikelySilenceHallucination = (text) => {
  const normalized = normalizeForComparison(text);
  if (!normalized) return false;
  return SILENCE_HALLUCINATIONS.some((phrase) => normalized === normalizeForComparison(phrase));
};

const transcribeSegment = async (audioPath) => {
  const text = await openaiProvider.transcribeAudio(audioPath);
  const normalized = (text || '').trim();
  if (!normalized) {
    logger.warn('OpenAI transcription returned empty text', { audioPath });
    return '';
  }
  if (isLikelySilenceHallucination(normalized)) {
    logger.warn('OpenAI transcription looked like a no-speech hallucination; treating segment as silence', {
      audioPath,
      transcription: normalized,
    });
    return '';
  }
  return normalized;
};

module.exports = {
  transcribeSegment,
};

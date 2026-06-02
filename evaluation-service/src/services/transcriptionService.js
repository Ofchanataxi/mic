const openaiProvider = require('../providers/openaiProvider');
const logger = require('../utils/logger');

const SILENCE_HALLUCINATIONS = [
  'gracias por ver el video',
  'gracias por mirar el video',
  'suscribete',
  'activa notificaciones',
  'subtitulos realizados por la comunidad',
  'subtitulos realizados por la comunidad de amara',
  'amara org',
  'amara.org',
  'thank you for watching',
  'thanks for watching',
  'like and subscribe',
  'subtitles by the amara org community',
  'subtitles made by the amara org community',
];

const normalizeForComparison = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\p{N}\s.]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const countWords = (value) => {
  const matches = normalizeForComparison(value).match(/\S+/g);
  return matches ? matches.length : 0;
};

const isLikelySilenceHallucination = (text) => {
  const normalized = normalizeForComparison(text);
  if (!normalized) return false;

  const matchedPhrases = SILENCE_HALLUCINATIONS
    .map(normalizeForComparison)
    .filter((phrase) => phrase && normalized.includes(phrase));

  if (!matchedPhrases.length) return false;
  if (matchedPhrases.some((phrase) => normalized === phrase)) return true;

  const wordCount = countWords(normalized);
  const matchedWords = matchedPhrases.reduce((sum, phrase) => sum + countWords(phrase), 0);
  const boilerplateRatio = wordCount > 0 ? matchedWords / wordCount : 0;

  return wordCount <= 35 || boilerplateRatio >= 0.45;
};

const removeBoilerplateLines = (text) => String(text || '')
  .split(/\r?\n+/)
  .map((line) => line.trim())
  .filter((line) => line && !isLikelySilenceHallucination(line))
  .join('\n')
  .trim();

const isTooShortToBeAnswer = (text) => {
  const normalized = normalizeForComparison(text);
  if (!normalized) return true;
  return countWords(normalized) <= 2 && normalized.length <= 18;
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

  const cleaned = removeBoilerplateLines(normalized);
  if (!cleaned || isLikelySilenceHallucination(cleaned) || isTooShortToBeAnswer(cleaned)) {
    logger.warn('OpenAI transcription did not contain a reliable spoken answer; treating segment as silence', {
      audioPath,
      transcription: normalized,
    });
    return '';
  }

  if (cleaned !== normalized) {
    logger.warn('Removed likely no-speech boilerplate from transcription', {
      audioPath,
      original: normalized,
      cleaned,
    });
  }

  return cleaned;
};

module.exports = {
  transcribeSegment,
};

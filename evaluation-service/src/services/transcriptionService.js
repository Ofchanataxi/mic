const openaiProvider = require('../providers/openaiProvider');
const logger = require('../utils/logger');

const transcribeSegment = async (audioPath) => {
  const text = await openaiProvider.transcribeAudio(audioPath);
  const normalized = (text || '').trim();
  if (!normalized) {
    logger.warn('OpenAI transcription returned empty text', { audioPath });
  }
  return normalized;
};

module.exports = {
  transcribeSegment,
};

const fs = require('fs');
const OpenAI = require('openai');
const env = require('../config/env');

let client;

const getOpenAIClient = () => {
  if (!env.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for OpenAI operations');
  }
  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
};

const transcribeAudio = async (audioPath) => {
  const openai = getOpenAIClient();
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: env.openaiTranscriptionModel,
    language: 'es',
  });
  return transcription.text || '';
};

const createJsonEvaluation = async (messages) => {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: env.openaiModel,
    messages,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });
  return completion.choices?.[0]?.message?.content || '{}';
};

module.exports = {
  transcribeAudio,
  createJsonEvaluation,
};

const fs = require('fs');
const fsPromises = require('fs/promises');
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
    prompt: 'Transcribe solo voz real de una entrevista tecnica en español. Si no hay voz clara, no inventes frases de cierre, subtitulos ni agradecimientos.',
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

const createJsonVisionEvaluation = async ({ systemPrompt, userPrompt, imagePaths }) => {
  const openai = getOpenAIClient();
  const imageContent = await Promise.all((imagePaths || []).map(async (imagePath) => {
    const bytes = await fsPromises.readFile(imagePath);
    return {
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${bytes.toString('base64')}`,
        detail: 'low',
      },
    };
  }));

  const completion = await openai.chat.completions.create({
    model: env.openaiModel,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          ...imageContent,
        ],
      },
    ],
  });

  return completion.choices?.[0]?.message?.content || '{}';
};

module.exports = {
  transcribeAudio,
  createJsonEvaluation,
  createJsonVisionEvaluation,
};

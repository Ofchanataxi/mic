const OpenAI = require('openai');
const env = require('../config/env');

let client;

const getClient = () => {
  if (!env.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for OpenAI feedback generation');
  }
  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
};

const createJsonReport = async (messages) => {
  const openai = getClient();
  const completion = await openai.chat.completions.create({
    model: env.openaiModel,
    messages,
    temperature: 0.25,
    response_format: { type: 'json_object' },
  });

  return completion.choices?.[0]?.message?.content || '{}';
};

module.exports = {
  createJsonReport,
};

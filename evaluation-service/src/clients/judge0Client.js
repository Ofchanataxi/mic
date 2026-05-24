const axios = require('axios');
const env = require('../config/env');

const languageIds = {
  javascript: 63,
  node: 63,
  python: 71,
  python3: 71,
  java: 62,
  cpp: 54,
  'c++': 54,
  c: 50,
  csharp: 51,
  'c#': 51,
  go: 60,
  ruby: 72,
  php: 68,
  typescript: 74,
};

const normalizeLanguage = (language) => String(language || '').trim().toLowerCase();

const getLanguageId = (language) => languageIds[normalizeLanguage(language)] || languageIds.javascript;

const isConfigured = () => Boolean(env.judge0ApiKey);

const submitCode = async ({ language, sourceCode, stdin, expectedOutput }) => {
  if (!isConfigured()) {
    throw new Error('JUDGE0_API_KEY is not configured');
  }

  const response = await axios.post(
    '/submissions',
    {
      language_id: getLanguageId(language),
      source_code: sourceCode,
      stdin: stdin || '',
      expected_output: expectedOutput || null,
    },
    {
      baseURL: env.judge0ApiUrl,
      timeout: 45000,
      params: {
        base64_encoded: 'false',
        wait: 'true',
      },
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': env.judge0ApiKey,
        'X-RapidAPI-Host': env.judge0ApiHost,
      },
    },
  );

  return response.data;
};

module.exports = {
  isConfigured,
  submitCode,
  getLanguageId,
};

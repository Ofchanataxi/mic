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

const encodeBase64 = (value) => Buffer.from(String(value || ''), 'utf8').toString('base64');

const decodeBase64 = (value) => {
  if (!value) return value;
  try {
    return Buffer.from(String(value), 'base64').toString('utf8');
  } catch (_) {
    return value;
  }
};

const decodeResult = (result) => ({
  ...result,
  stdout: decodeBase64(result.stdout),
  stderr: decodeBase64(result.stderr),
  compile_output: decodeBase64(result.compile_output),
  message: decodeBase64(result.message),
});

const submitCode = async ({ language, sourceCode, stdin, expectedOutput }) => {
  if (!isConfigured()) {
    throw new Error('JUDGE0_API_KEY is not configured');
  }

  const body = {
    language_id: getLanguageId(language),
    source_code: encodeBase64(sourceCode),
    stdin: encodeBase64(stdin || ''),
  };

  if (expectedOutput !== undefined && expectedOutput !== null && expectedOutput !== '') {
    body.expected_output = encodeBase64(expectedOutput);
  }

  const response = await axios.post(
    '/submissions',
    body,
    {
      baseURL: env.judge0ApiUrl,
      timeout: 45000,
      params: {
        base64_encoded: 'true',
        wait: 'true',
      },
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': env.judge0ApiKey,
        'X-RapidAPI-Host': env.judge0ApiHost,
      },
    },
  );

  return decodeResult(response.data);
};

module.exports = {
  isConfigured,
  submitCode,
  getLanguageId,
};

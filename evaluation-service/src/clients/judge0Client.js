const axios = require('axios');
const env = require('../config/env');
const { buildLanguageCatalog } = require('../services/judge0LanguageCatalog');

let languageCache = null;
let languageCacheExpiresAt = 0;
const providerHealth = new Map();

const parseProvidersJson = () => {
  if (!env.judge0ProvidersJson) return [];
  try {
    const parsed = JSON.parse(env.judge0ProvidersJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const getProviders = () => {
  const configured = parseProvidersJson()
    .filter((provider) => provider?.apiUrl)
    .map((provider, index) => ({
      name: provider.name || `judge0-${index + 1}`,
      apiUrl: String(provider.apiUrl).replace(/\/+$/, ''),
      apiKey: provider.apiKey || '',
      apiHost: provider.apiHost || '',
    }));

  if (configured.length > 0) return configured;

  const keys = env.judge0ApiKeys.length > 0
    ? env.judge0ApiKeys
    : (env.judge0ApiKey ? [env.judge0ApiKey] : []);

  return keys.map((apiKey, index) => ({
    name: `judge0-${index + 1}`,
    apiUrl: env.judge0ApiUrl.replace(/\/+$/, ''),
    apiKey,
    apiHost: env.judge0ApiHost,
  }));
};

const headersFor = (provider) => {
  const headers = { 'Content-Type': 'application/json' };
  if (provider.apiKey) headers['X-RapidAPI-Key'] = provider.apiKey;
  if (provider.apiHost) headers['X-RapidAPI-Host'] = provider.apiHost;
  return headers;
};

const providerKey = (provider) => `${provider.apiUrl}|${provider.apiHost}|${provider.name}`;

const getProviderHealth = (provider) => {
  const key = providerKey(provider);
  if (!providerHealth.has(key)) {
    providerHealth.set(key, { failures: 0, unavailableUntil: 0 });
  }
  return providerHealth.get(key);
};

const markProviderHealthy = (provider) => {
  providerHealth.set(providerKey(provider), { failures: 0, unavailableUntil: 0 });
};

const markProviderFailure = (provider) => {
  const health = getProviderHealth(provider);
  const failures = health.failures + 1;
  const threshold = Math.max(1, env.judge0ProviderFailureThreshold);
  providerHealth.set(providerKey(provider), {
    failures,
    unavailableUntil: failures >= threshold
      ? Date.now() + Math.max(1000, env.judge0ProviderCooldownMs)
      : 0,
  });
};

const isTransientError = (error) => {
  const status = error.response?.status;
  return !status || status === 408 || status === 429 || status >= 500;
};

const requestWithFailover = async (requestFactory) => {
  const providers = getProviders();
  if (providers.length === 0) throw new Error('No Judge0 provider is configured');

  let lastError;
  const availableProviders = providers.filter(
    (provider) => getProviderHealth(provider).unavailableUntil <= Date.now(),
  );
  const candidates = availableProviders.length > 0
    ? availableProviders
    : [providers.reduce((earliest, provider) => (
      getProviderHealth(provider).unavailableUntil < getProviderHealth(earliest).unavailableUntil
        ? provider
        : earliest
    ))];

  for (const provider of candidates) {
    try {
      const result = await requestFactory(provider);
      markProviderHealthy(provider);
      return result;
    } catch (error) {
      lastError = error;
      if (!isTransientError(error)) throw error;
      markProviderFailure(provider);
    }
  }

  throw lastError;
};

const normalizeLanguage = (language) => String(language || '').trim().toLowerCase();

const fallbackLanguageIds = {
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

const getLanguageId = (language) => {
  const numeric = Number.parseInt(language, 10);
  if (Number.isInteger(numeric) && numeric > 0) return numeric;
  const id = fallbackLanguageIds[normalizeLanguage(language)];
  if (!id) throw new Error(`Unsupported Judge0 language: ${language}`);
  return id;
};

const isConfigured = () => getProviders().length > 0;
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

const getLanguages = async () => {
  if (languageCache && Date.now() < languageCacheExpiresAt) return languageCache;

  const languages = await requestWithFailover(async (provider) => {
    const response = await axios.get('/languages', {
      baseURL: provider.apiUrl,
      timeout: 15000,
      headers: headersFor(provider),
    });
    return response.data;
  });

  languageCache = buildLanguageCatalog(languages);
  languageCacheExpiresAt = Date.now() + 60 * 60 * 1000;
  return languageCache;
};

const submitCode = async ({ language, sourceCode, stdin, expectedOutput }) => {
  const body = {
    language_id: getLanguageId(language),
    source_code: encodeBase64(sourceCode),
    stdin: encodeBase64(stdin || ''),
  };
  if (expectedOutput !== undefined && expectedOutput !== null && expectedOutput !== '') {
    body.expected_output = encodeBase64(expectedOutput);
  }

  const result = await requestWithFailover(async (provider) => {
    const response = await axios.post('/submissions', body, {
      baseURL: provider.apiUrl,
      timeout: 45000,
      params: { base64_encoded: 'true', wait: 'true' },
      headers: headersFor(provider),
    });
    return response.data;
  });

  return decodeResult(result);
};

module.exports = {
  isConfigured,
  submitCode,
  getLanguageId,
  getLanguages,
};

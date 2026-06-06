const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseInteger(name, fallback) {
  const value = process.env[name] ?? fallback;
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid integer`);
  }

  return parsed;
}

function parseFloatEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return parsed;
}

function parseBoolean(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInteger("PORT", "3002"),
  databaseUrl: requireEnv("DATABASE_URL"),
  candidateServiceUrl: requireEnv("CANDIDATE_SERVICE_URL", "http://localhost:3001").replace(/\/+$/, ""),
  evaluationServiceUrl: requireEnv("EVALUATION_SERVICE_URL", "http://localhost:3003").replace(/\/+$/, ""),
  enableEvaluationDispatch: parseBoolean("ENABLE_EVALUATION_DISPATCH", false),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiQuestionModel: requireEnv("OPENAI_QUESTION_MODEL", "gpt-4o-mini"),
  openAiEmbeddingModel: requireEnv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
  defaultQuestionCount: parseInteger("DEFAULT_QUESTION_COUNT", "8"),
  minQuestionCount: parseInteger("MIN_QUESTION_COUNT", "8"),
  maxQuestionCount: parseInteger("MAX_QUESTION_COUNT", "8"),
  minCodingQuestionsSmallInterview: parseInteger("MIN_CODING_QUESTIONS_SMALL_INTERVIEW", "2"),
  minCodingQuestionsLargeInterview: parseInteger("MIN_CODING_QUESTIONS_LARGE_INTERVIEW", "2"),
  questionGenerationMaxAttempts: parseInteger("QUESTION_GENERATION_MAX_ATTEMPTS", "3"),
  questionSimilarityThreshold: parseFloatEnv("QUESTION_SIMILARITY_THRESHOLD", "0.85"),
  httpClientTimeoutMs: parseInteger("HTTP_CLIENT_TIMEOUT_MS", "30000")
};

module.exports = {
  env
};

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

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInteger("PORT", "3001"),
  databaseUrl: requireEnv("DATABASE_URL"),
  mediaServiceUrl: requireEnv("MEDIA_SERVICE_URL", "http://localhost:3000").replace(/\/+$/, ""),
  openAiApiKey: requireEnv("OPENAI_API_KEY"),
  openAiModel: requireEnv("OPENAI_MODEL"),
  softSkillsLimit: parseInteger("SOFT_SKILLS_LIMIT", "5"),
  adaptiveWeakScoreThreshold: parseFloatEnv("ADAPTIVE_WEAK_SCORE_THRESHOLD", "60"),
  adaptiveCoverageRatio: parseFloatEnv("ADAPTIVE_COVERAGE_RATIO", "0.7"),
  adaptiveReinforcementRatio: parseFloatEnv("ADAPTIVE_REINFORCEMENT_RATIO", "0.3"),
  adaptiveSoftSkillsRatio: parseFloatEnv("ADAPTIVE_SOFT_SKILLS_RATIO", "0.3"),
  adaptiveMaxConsecutiveSameTopic: parseInteger("ADAPTIVE_MAX_CONSECUTIVE_SAME_TOPIC", "1")
};

module.exports = {
  env
};

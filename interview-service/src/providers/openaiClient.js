const OpenAI = require("openai");
const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");

function createOpenAiClient() {
  if (!env.openAiApiKey) {
    throw new ApiError(500, "OPENAI_API_KEY is required to generate interview questions");
  }

  return new OpenAI({
    apiKey: env.openAiApiKey
  });
}

module.exports = {
  createOpenAiClient
};

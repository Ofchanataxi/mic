const { env } = require("../config/env");
const { createOpenAiClient } = require("./openaiClient");

async function generateEmbedding(text) {
  const openai = createOpenAiClient();
  const response = await openai.embeddings.create({
    model: env.openAiEmbeddingModel,
    input: text
  });

  return {
    embedding: response.data[0].embedding,
    model: env.openAiEmbeddingModel
  };
}

module.exports = {
  generateEmbedding
};

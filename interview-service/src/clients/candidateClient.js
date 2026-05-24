const axios = require("axios");
const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");

const client = axios.create({
  baseURL: env.candidateServiceUrl,
  timeout: env.httpClientTimeoutMs
});

async function getAdaptiveStrategy({ userId, questionCount, targetRole, level }) {
  try {
    const response = await client.get(`/candidates/${encodeURIComponent(userId)}/adaptive-strategy`, {
      params: {
        questionCount,
        targetRole,
        level
      }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new ApiError(
        error.response.status,
        "candidate-service rejected adaptive strategy request",
        error.response.data
      );
    }

    throw new ApiError(502, "candidate-service is not reachable", {
      message: error.message
    });
  }
}

module.exports = {
  getAdaptiveStrategy
};

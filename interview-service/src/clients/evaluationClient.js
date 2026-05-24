const axios = require("axios");
const { env } = require("../config/env");

const client = axios.create({
  baseURL: env.evaluationServiceUrl,
  timeout: env.httpClientTimeoutMs
});

async function dispatchInterviewFinished(interviewId) {
  if (!env.enableEvaluationDispatch) {
    return {
      dispatched: false,
      skipped: true
    };
  }

  await client.post("/evaluations/interviews", {
    interviewId
  });

  return {
    dispatched: true,
    skipped: false
  };
}

module.exports = {
  dispatchInterviewFinished
};

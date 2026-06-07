import { httpClient } from './httpClient.js';

export const evaluationApi = {
  async getJudge0Languages() {
    const { data } = await httpClient.get('/evaluations/judge0/languages');
    return data.languages || [];
  },
  async getEvaluationJobStatus(interviewId) {
    const { data } = await httpClient.get(`/evaluations/jobs/${encodeURIComponent(interviewId)}/status`);
    return data;
  },
  async getEvaluationByInterview(interviewId) {
    const { data } = await httpClient.get(`/evaluations/interviews/${encodeURIComponent(interviewId)}`);
    return data;
  },
  async getEvaluationQuestions(interviewId) {
    const { data } = await httpClient.get(`/evaluations/interviews/${encodeURIComponent(interviewId)}/questions`);
    return data;
  },
};

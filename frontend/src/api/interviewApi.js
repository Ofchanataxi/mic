import { httpClient } from './httpClient.js';

export const interviewApi = {
  async createInterview(payload) {
    const { data } = await httpClient.post('/interviews', payload);
    return data;
  },
  async getInterview(interviewId) {
    const { data } = await httpClient.get(`/interviews/${encodeURIComponent(interviewId)}`);
    return data;
  },
  async startInterview(interviewId) {
    const { data } = await httpClient.post(`/interviews/${encodeURIComponent(interviewId)}/start`);
    return data;
  },
  async finishInterview(interviewId, payload) {
    const { data } = await httpClient.post(`/interviews/${encodeURIComponent(interviewId)}/finish`, payload);
    return data;
  },
};

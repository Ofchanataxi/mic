import { httpClient } from './httpClient.js';

export const feedbackApi = {
  async getMyReports() {
    const { data } = await httpClient.get('/me/reports');
    return data;
  },
  async getMyHistory() {
    const { data } = await httpClient.get('/me/history');
    return data;
  },
  async getFeedbackByInterview(interviewId) {
    const { data } = await httpClient.get(`/feedback/interviews/${encodeURIComponent(interviewId)}`);
    return data;
  },
  async getReportById(reportId) {
    const { data } = await httpClient.get(`/feedback/reports/${encodeURIComponent(reportId)}`);
    return data;
  },
  async getFeedbackReport(reportId) {
    return this.getReportById(reportId);
  },
  async getFeedbackJobStatus(interviewId) {
    const { data } = await httpClient.get(`/feedback/jobs/${encodeURIComponent(interviewId)}/status`);
    return data;
  },
};

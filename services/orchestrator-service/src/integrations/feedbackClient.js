import { postJson } from '../utils/httpClient.js';

export async function publishFeedbackReport({ baseUrl, timeoutMs, report }) {
  return postJson(`${baseUrl}/feedback/internal`, report, timeoutMs);
}

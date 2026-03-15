import { postJson } from '../utils/httpClient.js';

export async function analyzeAudio({ baseUrl, timeoutMs, interviewId, videoUrl, segments }) {
  return postJson(`${baseUrl}/audio/analyze`, { interviewId, videoUrl, segments }, timeoutMs);
}

export async function analyzeVideo({ baseUrl, timeoutMs, interviewId, videoUrl, segments }) {
  return postJson(`${baseUrl}/video/analyze`, { interviewId, videoUrl, segments }, timeoutMs);
}

export async function evaluateContentBatch({ baseUrl, timeoutMs, segments }) {
  const tasks = segments.map(async (segment) => {
    const response = await postJson(
      `${baseUrl}/content/evaluate`,
      {
        questionId: segment.questionId,
        transcript: segment.transcript ?? '',
        questionText: segment.questionText ?? '',
      },
      timeoutMs,
    );

    return { questionId: segment.questionId, ...response };
  });

  return Promise.all(tasks);
}

export async function evaluateCodeBatch({ baseUrl, timeoutMs, interviewId, codeItems }) {
  const tasks = codeItems.map(async (item) => {
    const response = await postJson(
      `${baseUrl}/code/evaluate`,
      {
        interviewId,
        questionId: item.questionId,
        sourceCode: item.sourceCode,
        language: item.language ?? 'javascript',
      },
      timeoutMs,
    );

    return { questionId: item.questionId, ...response };
  });

  return Promise.all(tasks);
}

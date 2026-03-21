import { servicesConfig } from '../config/services.js';
import { fetchInterviewAnalysis } from '../integrations/mockProviders.js';
import {
  analyzeAudio,
  analyzeVideo,
  evaluateContentBatch,
  evaluateCodeBatch,
} from '../integrations/serviceClients.js';

function withDefaultResults() {
  return {
    semanticResults: [],
    audioResults: [],
    videoResults: [],
    codeResults: [],
    warnings: [],
  };
}

export async function collectAnalysis({ interviewId, videoUrl, segments = [] }) {
  if (servicesConfig.useMocks) {
    return { ...(await fetchInterviewAnalysis(interviewId)), warnings: [] };
  }

  const response = withDefaultResults();
  const minimalSegments = segments.map((s) => ({ questionId: s.questionId, start: s.start, end: s.end }));
  const codeItems = segments.filter((s) => s.sourceCode);

  const [audio, video, content, code] = await Promise.allSettled([
    analyzeAudio({
      baseUrl: servicesConfig.audioBaseUrl,
      timeoutMs: servicesConfig.timeoutMs,
      interviewId,
      videoUrl,
      segments: minimalSegments,
    }),
    analyzeVideo({
      baseUrl: servicesConfig.videoBaseUrl,
      timeoutMs: servicesConfig.timeoutMs,
      interviewId,
      videoUrl,
      segments: minimalSegments,
    }),
    evaluateContentBatch({
      baseUrl: servicesConfig.contentBaseUrl,
      timeoutMs: servicesConfig.timeoutMs,
      segments,
    }),
    evaluateCodeBatch({
      baseUrl: servicesConfig.codeBaseUrl,
      timeoutMs: servicesConfig.timeoutMs,
      interviewId,
      codeItems,
    }),
  ]);

  if (audio.status === 'fulfilled') response.audioResults = audio.value.results ?? [];
  else response.warnings.push(`audio_analysis_failed: ${audio.reason.message}`);

  if (video.status === 'fulfilled') response.videoResults = video.value.results ?? [];
  else response.warnings.push(`video_analysis_failed: ${video.reason.message}`);

  if (content.status === 'fulfilled') response.semanticResults = content.value;
  else response.warnings.push(`content_analysis_failed: ${content.reason.message}`);

  if (code.status === 'fulfilled') response.codeResults = code.value;
  else response.warnings.push(`code_evaluation_failed: ${code.reason.message}`);

  return response;
}

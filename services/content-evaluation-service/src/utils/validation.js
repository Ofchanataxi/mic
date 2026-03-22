export function validateContentEvaluationRequest(payload, config) {
  if (!payload || typeof payload !== 'object') {
    return 'Request body is required.';
  }

  if (!payload.questionId || typeof payload.questionId !== 'string') {
    return 'questionId is required.';
  }

  if (typeof payload.questionText !== 'string' || payload.questionText.trim().length === 0) {
    return 'questionText is required.';
  }

  if (typeof payload.transcript !== 'string') {
    return 'transcript must be a string.';
  }

  if (payload.transcript.length > config.maxTranscriptLength) {
    return `transcript exceeds max length of ${config.maxTranscriptLength}.`;
  }

  if (payload.questionText.length > config.maxQuestionLength) {
    return `questionText exceeds max length of ${config.maxQuestionLength}.`;
  }

  return null;
}

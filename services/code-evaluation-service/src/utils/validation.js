const SUPPORTED_LANGUAGES = new Set(['javascript', 'typescript', 'python', 'java', 'cpp']);

export function validateCodeEvaluateRequest(payload, maxSourceLength) {
  if (!payload || typeof payload !== 'object') {
    return 'Request body is required.';
  }

  if (!payload.interviewId || typeof payload.interviewId !== 'string') {
    return 'interviewId is required.';
  }

  if (!payload.questionId || typeof payload.questionId !== 'string') {
    return 'questionId is required.';
  }

  if (!payload.sourceCode || typeof payload.sourceCode !== 'string') {
    return 'sourceCode is required.';
  }

  if (payload.sourceCode.length > maxSourceLength) {
    return `sourceCode exceeds max length of ${maxSourceLength}.`;
  }

  if (!payload.language || typeof payload.language !== 'string') {
    return 'language is required.';
  }

  if (!SUPPORTED_LANGUAGES.has(payload.language.toLowerCase())) {
    return `language must be one of: ${Array.from(SUPPORTED_LANGUAGES).join(', ')}.`;
  }

  return null;
}

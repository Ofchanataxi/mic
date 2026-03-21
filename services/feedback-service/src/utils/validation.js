export function validateFeedbackReport(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Request body is required.';
  }

  if (!payload.interviewId || typeof payload.interviewId !== 'string') {
    return 'interviewId is required.';
  }

  if (!payload.summary || typeof payload.summary !== 'object') {
    return 'summary is required.';
  }

  if (!Array.isArray(payload.questionBreakdown)) {
    return 'questionBreakdown must be an array.';
  }

  return null;
}

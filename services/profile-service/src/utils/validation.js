export function validateCreateProfileRequest(payload, maxCvTextLength) {
  if (!payload || typeof payload !== 'object') return 'Request body is required.';
  if (!payload.userId || typeof payload.userId !== 'string') return 'userId is required.';
  if (!payload.cvText || typeof payload.cvText !== 'string') return 'cvText is required.';
  if (payload.cvText.length > maxCvTextLength) return `cvText exceeds max length of ${maxCvTextLength}.`;
  return null;
}

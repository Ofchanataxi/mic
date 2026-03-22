export function validatePlanRequest(payload) {
  if (!payload || typeof payload !== 'object') return 'Request body is required.';
  if (!payload.candidateId || typeof payload.candidateId !== 'string') return 'candidateId is required.';
  if (!payload.targetRole || typeof payload.targetRole !== 'string') return 'targetRole is required.';
  if (!payload.profileId || typeof payload.profileId !== 'string') return 'profileId is required.';
  return null;
}

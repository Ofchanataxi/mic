export function validateAnalyzeRequest(body, maxSegmentDurationSeconds) {
  if (!body?.interviewId) return 'interviewId is required';
  if (!body?.videoUrl) return 'videoUrl is required';
  if (!Array.isArray(body?.segments)) return 'segments must be an array';

  for (const segment of body.segments) {
    if (!segment?.questionId) return 'each segment requires questionId';
    if (!Number.isFinite(segment?.start) || !Number.isFinite(segment?.end)) {
      return 'each segment requires numeric start and end';
    }
    if (segment.end <= segment.start) return `segment ${segment.questionId} has invalid range`;
    if (segment.end - segment.start > maxSegmentDurationSeconds) {
      return `segment ${segment.questionId} exceeds max duration`;
    }
  }

  return null;
}

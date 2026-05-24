const fs = require('fs/promises');

const analyzeVideoSegment = async ({ videoSegmentPath, startTimeMs, endTimeMs }) => {
  let exists = false;
  if (videoSegmentPath) {
    try {
      await fs.access(videoSegmentPath);
      exists = true;
    } catch (_) {
      exists = false;
    }
  }

  return {
    eyeContactScore: null,
    postureScore: null,
    attentionScore: null,
    observableBehavior: {
      segmentExists: exists,
      timestampRangeValid: Number.isFinite(startTimeMs) && Number.isFinite(endTimeMs) && endTimeMs > startTimeMs,
    },
    rawData: {
      status: 'VIDEO_MODEL_NOT_CONFIGURED',
      message: 'Video analysis provider is prepared but no real model is configured in this MVP.',
    },
  };
};

module.exports = {
  analyzeVideoSegment,
};

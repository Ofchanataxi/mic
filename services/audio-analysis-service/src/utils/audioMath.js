export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function countWords(text = '') {
  return (text.trim().match(/\S+/g) ?? []).length;
}

export function computeSpeechRateWpm({ transcript, durationSeconds, speechDurationSeconds }) {
  const duration = Math.max(durationSeconds, 0.001);
  const words = countWords(transcript);

  if (words > 0) {
    return Math.round((words / duration) * 60);
  }

  const speakingSeconds = Math.max(speechDurationSeconds ?? duration * 0.75, 0);
  return Math.round(95 + clamp(speakingSeconds / duration, 0, 1) * 70);
}

export function computeConfidenceScore({ pauseRatio, speechRate }) {
  const pauseQuality = 1 - Math.abs(pauseRatio - 0.2);
  const speechRateQuality = 1 - Math.abs(speechRate - 135) / 120;
  return clamp(0.45 + pauseQuality * 0.3 + speechRateQuality * 0.25);
}

export function computeFluencyScore({ pauseRatio, speechRate }) {
  const pauseComponent = 1 - pauseRatio;
  const rhythmComponent = 1 - Math.abs(speechRate - 135) / 160;
  return clamp(pauseComponent * 0.55 + rhythmComponent * 0.45);
}

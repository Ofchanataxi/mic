export const serviceConfig = {
  port: Number(process.env.PORT ?? 3008),
  maxSegmentDurationSeconds: Number(process.env.MAX_SEGMENT_DURATION_SECONDS ?? 1800),
  silenceNoiseDb: Number(process.env.SILENCE_NOISE_DB ?? -35),
  silenceMinSeconds: Number(process.env.SILENCE_MIN_SECONDS ?? 0.25),
};

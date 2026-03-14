export const serviceConfig = {
  port: Number(process.env.PORT ?? 3008),
  maxSegmentDurationSeconds: Number(process.env.MAX_SEGMENT_DURATION_SECONDS ?? 1800),
};

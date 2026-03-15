export const serviceConfig = {
  port: Number(process.env.PORT ?? 3009),
  maxSegmentDurationSeconds: Number(process.env.MAX_SEGMENT_DURATION_SECONDS ?? 1800),
  frameFps: Number(process.env.FRAME_FPS ?? 1),
  tempDir: process.env.TEMP_DIR ?? './tmp',
};

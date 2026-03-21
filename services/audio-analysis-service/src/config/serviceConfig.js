export const serviceConfig = {
  port: Number(process.env.PORT ?? 3008),
  maxSegmentDurationSeconds: Number(process.env.MAX_SEGMENT_DURATION_SECONDS ?? 1800),
  silenceNoiseDb: Number(process.env.SILENCE_NOISE_DB ?? -35),
  silenceMinSeconds: Number(process.env.SILENCE_MIN_SECONDS ?? 0.25),
  tempDir: process.env.TEMP_DIR ?? './tmp',
  sttCommand: process.env.STT_COMMAND ?? 'whisper-cli',
  sttArgsTemplate: process.env.STT_ARGS_TEMPLATE ?? '-m {model} -f {input} -l {lang} -np',
  sttModelPath: process.env.STT_MODEL_PATH ?? '',
  sttLanguage: process.env.STT_LANGUAGE ?? 'es',
  sttTimeoutMs: Number(process.env.STT_TIMEOUT_MS ?? 120000),
};

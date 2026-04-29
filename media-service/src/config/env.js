const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInteger(name, fallback) {
  const value = process.env[name] ?? fallback;
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid integer`);
  }

  return parsed;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInteger("PORT", "3000"),
  serviceBaseUrl: requireEnv("SERVICE_BASE_URL", `http://localhost:${process.env.PORT || 3000}`),
  databaseUrl: requireEnv("DATABASE_URL"),
  redisUrl: requireEnv("REDIS_URL"),
  gcsProjectId: requireEnv("GCS_PROJECT_ID"),
  gcsBucketName: requireEnv("GCS_BUCKET_NAME"),
  gcsEmulatorHost: process.env.GCS_EMULATOR_HOST || "",
  maxFileSizeMb: parseInteger("MAX_FILE_SIZE_MB", "250"),
  allowedVideoTypes: parseCsv(requireEnv("ALLOWED_VIDEO_TYPES", "video/mp4,video/webm,video/quicktime")),
  allowedPdfTypes: parseCsv(requireEnv("ALLOWED_PDF_TYPES", "application/pdf")),
  tempUploadDir: path.resolve(process.cwd(), requireEnv("TEMP_UPLOAD_DIR", "./tmp/uploads")),
  queueName: requireEnv("QUEUE_NAME", "media-processing"),
  ffmpegVideoCrf: parseInteger("FFMPEG_VIDEO_CRF", "28"),
  ffmpegVideoPreset: requireEnv("FFMPEG_VIDEO_PRESET", "veryfast"),
  outputVideoWidth: parseInteger("OUTPUT_VIDEO_WIDTH", "1280"),
  outputVideoMaxFps: parseInteger("OUTPUT_VIDEO_MAX_FPS", "30")
};

module.exports = {
  env
};

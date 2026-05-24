const { Worker } = require("bullmq");
const { env } = require("../../config/env");
const { redisConnection } = require("../../config/redis");
const { ensureStorageReady } = require("../../storage");
const { ensureDirectoryExists } = require("../../utils/file");
const { processVideoJobHandler } = require("../handlers/processVideoJobHandler");

async function bootstrapWorker() {
  ensureDirectoryExists(env.tempUploadDir);
  await ensureStorageReady();

  const worker = new Worker(env.queueName, processVideoJobHandler, {
    connection: redisConnection,
    concurrency: 2
  });

  worker.on("completed", (job) => {
    console.log(`Processed media job ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Failed media job ${job ? job.id : "unknown"}`, error);
  });

  console.log(`media-service worker listening on queue ${env.queueName}`);
}

bootstrapWorker().catch((error) => {
  console.error("Failed to start media-service worker", error);
  process.exit(1);
});

const { createApp } = require("./app");
const { env } = require("./config/env");
const { ensureDirectoryExists } = require("./utils/file");

async function bootstrap() {
  ensureDirectoryExists(env.tempUploadDir);
  const app = await createApp();

  app.listen(env.port, () => {
    console.log(`media-service listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start media-service", error);
  process.exit(1);
});

const { env } = require("../config/env");
const { GcsStorageProvider } = require("./gcsStorageProvider");

const storageProvider = new GcsStorageProvider(env);

async function ensureStorageReady() {
  await storageProvider.ensureBucketExists();
}

module.exports = {
  storageProvider,
  ensureStorageReady
};

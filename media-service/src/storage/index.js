const { GcsStorageProvider } = require("./gcsStorageProvider");

const storageProvider = new GcsStorageProvider();

async function ensureStorageReady() {
  await storageProvider.ensureBucketExists();
}

module.exports = {
  storageProvider,
  ensureStorageReady
};

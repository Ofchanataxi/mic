const path = require("path");
const { Storage } = require("@google-cloud/storage");
const { env } = require("../config/env");

if (env.gcsEmulatorHost) {
  process.env.STORAGE_EMULATOR_HOST = env.gcsEmulatorHost;
}

class GcsStorageProvider {
  constructor() {
    this.client = new Storage({
      projectId: env.gcsProjectId
    });
    this.bucket = this.client.bucket(env.gcsBucketName);
  }

  async ensureBucketExists() {
    const [exists] = await this.bucket.exists();

    if (!exists) {
      await this.bucket.create();
    }
  }

  buildStorageKey({ mediaId, interviewId, resourceType, originalFilename }) {
    const extension = resourceType === "VIDEO"
      ? ".mp4"
      : path.extname(originalFilename || "").toLowerCase() || ".pdf";
    const baseFolder = resourceType === "VIDEO" ? "videos" : "documents";

    return `${baseFolder}/${interviewId}/${mediaId}${extension}`;
  }

  async uploadFile({ sourcePath, destination, contentType }) {
    await this.bucket.upload(sourcePath, {
      destination,
      metadata: {
        contentType
      }
    });
  }

  async deleteFile(storageKey) {
    await this.bucket.file(storageKey).delete({ ignoreNotFound: true });
  }

  getBucketName() {
    return this.bucket.name;
  }

  async streamFile(storageKey, writableStream) {
    await new Promise((resolve, reject) => {
      const readStream = this.bucket.file(storageKey).createReadStream();

      readStream.on("error", reject);
      writableStream.on("error", reject);
      writableStream.on("close", resolve);

      readStream.pipe(writableStream);
    });
  }
}

module.exports = {
  GcsStorageProvider
};

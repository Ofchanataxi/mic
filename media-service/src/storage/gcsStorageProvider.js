const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { Storage } = require("@google-cloud/storage");

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

class GcsStorageProvider {
  constructor(env) {
    this.projectId = env.gcsProjectId;
    this.bucketName = env.gcsBucketName;
    this.baseUrl = env.gcsEmulatorHost ? trimTrailingSlash(env.gcsEmulatorHost) : "";
    this.storage = this.baseUrl ? null : new Storage({ projectId: this.projectId });
  }

  async ensureBucketExists() {
    if (!this.baseUrl) {
      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.exists();

      if (!exists) {
        await this.storage.createBucket(this.bucketName);
      }

      return;
    }

    const bucketUrl = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(this.bucketName)}`;
    const response = await fetch(bucketUrl);

    if (response.ok) {
      return;
    }

    if (response.status !== 404) {
      throw await this.buildRequestError(response, "Failed to check bucket existence");
    }

    const createBucketUrl = `${this.baseUrl}/storage/v1/b?project=${encodeURIComponent(this.projectId)}`;
    const createResponse = await fetch(createBucketUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: this.bucketName
      })
    });

    if (!createResponse.ok) {
      throw await this.buildRequestError(createResponse, "Failed to create bucket");
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
    if (!this.baseUrl) {
      await this.storage.bucket(this.bucketName).upload(sourcePath, {
        destination,
        metadata: {
          contentType
        }
      });

      return;
    }

    const buffer = await fs.promises.readFile(sourcePath);
    const uploadUrl = `${this.baseUrl}/upload/storage/v1/b/${encodeURIComponent(this.bucketName)}/o?uploadType=media&name=${encodeURIComponent(destination)}`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType
      },
      body: buffer
    });

    if (!response.ok) {
      throw await this.buildRequestError(response, "Failed to upload file");
    }
  }

  async deleteFile(storageKey) {
    if (!this.baseUrl) {
      await this.storage.bucket(this.bucketName).file(storageKey).delete({
        ignoreNotFound: true
      });

      return;
    }

    const deleteUrl = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(this.bucketName)}/o/${encodeURIComponent(storageKey)}`;
    const response = await fetch(deleteUrl, {
      method: "DELETE"
    });

    if (response.ok || response.status === 404) {
      return;
    }

    throw await this.buildRequestError(response, "Failed to delete file");
  }

  getBucketName() {
    return this.bucketName;
  }

  async fileExists(storageKey) {
    if (!this.baseUrl) {
      const [exists] = await this.storage.bucket(this.bucketName).file(storageKey).exists();
      return exists;
    }

    const metadataUrl = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(this.bucketName)}/o/${encodeURIComponent(storageKey)}`;
    const response = await fetch(metadataUrl);

    if (response.ok) return true;
    if (response.status === 404) return false;
    throw await this.buildRequestError(response, "Failed to check file existence");
  }

  async streamFile(storageKey, writableStream) {
    if (!this.baseUrl) {
      await new Promise((resolve, reject) => {
        const readStream = this.storage.bucket(this.bucketName).file(storageKey).createReadStream();

        readStream.on("error", reject);
        writableStream.on("error", reject);
        writableStream.on("finish", resolve);
        readStream.pipe(writableStream);
      });

      return;
    }

    const fileUrl = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(this.bucketName)}/o/${encodeURIComponent(storageKey)}?alt=media`;
    const response = await fetch(fileUrl);

    if (!response.ok || !response.body) {
      throw await this.buildRequestError(response, "Failed to stream file");
    }

    await new Promise((resolve, reject) => {
      const readStream = Readable.fromWeb(response.body);

      readStream.on("error", reject);
      writableStream.on("error", reject);
      writableStream.on("finish", resolve);
      readStream.pipe(writableStream);
    });
  }

  async downloadFileBuffer(storageKey) {
    if (!this.baseUrl) {
      const [buffer] = await this.storage.bucket(this.bucketName).file(storageKey).download();
      return buffer;
    }

    const fileUrl = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(this.bucketName)}/o/${encodeURIComponent(storageKey)}?alt=media`;
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw await this.buildRequestError(response, "Failed to download file");
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async buildRequestError(response, defaultMessage) {
    let details = "";

    try {
      details = await response.text();
    } catch (error) {
      details = "";
    }

    return new Error(`${defaultMessage}. Status ${response.status}${details ? `: ${details}` : ""}`);
  }
}

module.exports = {
  GcsStorageProvider
};

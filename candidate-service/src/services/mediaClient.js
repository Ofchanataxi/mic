const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");

class MediaClient {
  async getMediaMetadata(mediaId) {
    return this.getJson(`/media/${mediaId}`);
  }

  async getMediaAccess(mediaId) {
    return this.getJson(`/media/${mediaId}/access`);
  }

  async downloadPdf(mediaId) {
    const access = await this.getMediaAccess(mediaId);
    const url = this.resolveAccessUrl(access.accessUrl, mediaId);
    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError(response.status, `Could not download media file: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || access.mimeType || "";

    if (!contentType.includes("application/pdf")) {
      throw new ApiError(400, "Media file is not a PDF");
    }

    return {
      mediaId,
      access,
      buffer: Buffer.from(await response.arrayBuffer()),
      mimeType: contentType
    };
  }

  async getJson(path) {
    const response = await fetch(`${env.mediaServiceUrl}${path}`);

    if (!response.ok) {
      let message = `Media service request failed: ${response.statusText}`;

      try {
        const body = await response.json();
        message = body.message || message;
      } catch (error) {
        // Keep the generic message when the upstream body is not JSON.
      }

      throw new ApiError(response.status, message);
    }

    return response.json();
  }

  resolveAccessUrl(accessUrl, mediaId) {
    if (!accessUrl) {
      return `${env.mediaServiceUrl}/media/${mediaId}/file`;
    }

    try {
      const parsed = new URL(accessUrl);
      const base = new URL(env.mediaServiceUrl);
      parsed.protocol = base.protocol;
      parsed.host = base.host;
      return parsed.toString();
    } catch (error) {
      return `${env.mediaServiceUrl}/media/${mediaId}/file`;
    }
  }
}

const mediaClient = new MediaClient();

module.exports = {
  mediaClient
};

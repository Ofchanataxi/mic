const { env } = require("../config/env");
const { ApiError } = require("./apiError");
const { ResourceType } = require("./constants");

function validateUploadPayload({ file, resourceType, interviewId, ownerId }) {
  if (!file) {
    throw new ApiError(400, "File is required");
  }

  if (!resourceType || !Object.values(ResourceType).includes(resourceType)) {
    throw new ApiError(400, "resourceType must be VIDEO or PDF");
  }

  if (!interviewId || !interviewId.trim()) {
    throw new ApiError(400, "interviewId is required");
  }

  if (!ownerId || !ownerId.trim()) {
    throw new ApiError(400, "ownerId is required");
  }
}

function validateFileForResourceType({ file, resourceType }) {
  if (resourceType === ResourceType.VIDEO && !env.allowedVideoTypes.includes(file.mimetype)) {
    throw new ApiError(400, `Video MIME type ${file.mimetype} is not allowed`);
  }

  if (resourceType === ResourceType.PDF && !env.allowedPdfTypes.includes(file.mimetype)) {
    throw new ApiError(400, `PDF MIME type ${file.mimetype} is not allowed`);
  }
}

module.exports = {
  validateUploadPayload,
  validateFileForResourceType
};

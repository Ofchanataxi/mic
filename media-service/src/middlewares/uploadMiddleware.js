const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const { env } = require("../config/env");
const { ensureDirectoryExists } = require("../utils/file");

ensureDirectoryExists(env.tempUploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.tempUploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024
  }
});

module.exports = {
  uploadMiddleware
};

const fs = require("fs");
const path = require("path");

function ensureDirectoryExists(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

async function safeRemoveFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Failed to remove file ${filePath}`, error);
    }
  }
}

function buildOutputFilePath(inputPath, filename) {
  return path.join(path.dirname(inputPath), filename);
}

module.exports = {
  ensureDirectoryExists,
  safeRemoveFile,
  buildOutputFilePath
};

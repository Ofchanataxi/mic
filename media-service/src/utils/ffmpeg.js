const { spawn } = require("child_process");
const { env } = require("../config/env");

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `${command} exited with code ${code}`));
        return;
      }

      resolve();
    });
  });
}

async function runFfmpegOptimization({ inputPath, outputPath }) {
  const scaleFilter = `scale='min(${env.outputVideoWidth},iw)':-2`;

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    scaleFilter,
    "-r",
    String(env.outputVideoMaxFps),
    "-c:v",
    "libx264",
    "-preset",
    env.ffmpegVideoPreset,
    "-crf",
    String(env.ffmpegVideoCrf),
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    outputPath
  ]);
}

async function probeMediaDuration(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `ffprobe exited with code ${code}`));
        return;
      }

      const durationSeconds = Number.parseFloat(stdout.trim());

      if (Number.isNaN(durationSeconds)) {
        resolve(null);
        return;
      }

      resolve(Math.round(durationSeconds * 1000));
    });
  });
}

module.exports = {
  runFfmpegOptimization,
  probeMediaDuration
};

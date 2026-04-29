const { videoProcessingService } = require("../../services/videoProcessingService");

async function processVideoJobHandler(job) {
  await videoProcessingService.processVideoJob(job.data);
}

module.exports = {
  processVideoJobHandler
};

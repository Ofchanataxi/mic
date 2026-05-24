const videoAnalysisProvider = require('../providers/videoAnalysisProvider');

const analyzeVideo = async (payload) => videoAnalysisProvider.analyzeVideoSegment(payload);

module.exports = {
  analyzeVideo,
};

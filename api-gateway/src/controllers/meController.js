const env = require('../config/env');
const { requestService } = require('../clients/serviceClient');

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const getUserId = (req) => req.user?.userId || req.user?.id;

const getMe = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const profile = await requestService(req, {
    baseURL: env.candidateServiceUrl,
    url: `/candidates/profile/${encodeURIComponent(userId)}`,
  });
  res.json(profile);
});

const getTopics = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const topics = await requestService(req, {
    baseURL: env.candidateServiceUrl,
    url: `/candidates/${encodeURIComponent(userId)}/topics`,
  });
  res.json(topics);
});

const getReports = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const reports = await requestService(req, {
    baseURL: env.feedbackServiceUrl,
    url: `/feedback/users/${encodeURIComponent(userId)}/reports`,
  });
  res.json(reports);
});

const listHistory = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const [interviewData, reportData] = await Promise.all([
    requestService(req, {
      baseURL: env.interviewServiceUrl,
      url: '/interviews',
      params: { userId },
    }),
    requestService(req, {
      baseURL: env.feedbackServiceUrl,
      url: `/feedback/users/${encodeURIComponent(userId)}/reports`,
    }).catch(() => ({ reports: [] })),
  ]);

  const reports = Array.isArray(reportData.reports) ? reportData.reports : [];
  const reportByInterviewId = new Map(reports.map((report) => [report.interviewId, report]));
  const interviews = Array.isArray(interviewData.interviews) ? interviewData.interviews : [];

  res.json({
    userId,
    items: interviews.map((interview) => {
      const report = reportByInterviewId.get(interview.interviewId);
      return {
        interviewId: interview.interviewId,
        createdAt: interview.createdAt,
        targetRole: interview.targetRole,
        level: interview.level,
        interviewStatus: interview.status,
        evaluationStatus: interview.evaluationStatus,
        feedbackStatus: report?.status || null,
        globalScore: report?.overallScore ?? null,
        videoMediaId: interview.videoMediaId,
        feedbackReportId: report?.reportId || null,
      };
    }),
  });
});

module.exports = {
  getMe,
  getProfile,
  getTopics,
  getReports,
  listHistory,
};

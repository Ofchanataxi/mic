const env = require('../config/env');
const { requestService } = require('../clients/serviceClient');

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const getUserId = (req) => req.user?.userId || req.user?.id;

const getMe = asyncHandler(async (req, res) => {
  const authData = await requestService(req, {
    baseURL: env.authServiceUrl,
    url: '/auth/me',
  });
  res.json(authData);
});

const getProfile = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const profile = await requestService(req, {
    baseURL: env.candidateServiceUrl,
    url: `/candidates/profile/${encodeURIComponent(userId)}`,
  });
  res.json(profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const profile = await requestService(req, {
    baseURL: env.candidateServiceUrl,
    url: `/candidates/profile/${encodeURIComponent(userId)}`,
    method: 'PATCH',
    data: req.body || {},
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

const ABANDONED_INTERVIEW_GRACE_MS = 5 * 60 * 1000;

const isStaleActiveInterview = (interview) => {
  if (interview.status !== 'IN_PROGRESS') return false;
  const lastUpdate = new Date(interview.updatedAt || interview.startedAt || interview.createdAt).getTime();
  return Number.isFinite(lastUpdate) && Date.now() - lastUpdate > ABANDONED_INTERVIEW_GRACE_MS;
};

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
      const closedWithoutReport = interview.status === 'CANCELLED' || (isStaleActiveInterview(interview) && !report);
      return {
        interviewId: interview.interviewId,
        createdAt: interview.createdAt,
        targetRole: interview.targetRole,
        level: interview.level,
        interviewStatus: closedWithoutReport ? 'CANCELLED' : interview.status,
        evaluationStatus: interview.evaluationStatus,
        feedbackStatus: report?.status || null,
        globalScore: report?.overallScore ?? null,
        videoMediaId: interview.videoMediaId,
        feedbackReportId: report?.reportId || null,
        closedWithoutReport,
      };
    }),
  });
});

module.exports = {
  getMe,
  getProfile,
  updateProfile,
  getTopics,
  getReports,
  listHistory,
};

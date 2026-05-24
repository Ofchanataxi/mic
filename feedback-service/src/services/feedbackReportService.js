const feedbackReportRepository = require('../repositories/feedbackReportRepository');
const feedbackJobRepository = require('../repositories/feedbackJobRepository');
const { AppError } = require('../middlewares/errorMiddleware');
const { formatReport } = require('../dto/feedbackDto');

const findReportForInterview = async (interviewId) => {
  const report = await feedbackReportRepository.findByInterviewId(interviewId);
  if (!report) {
    const job = await feedbackJobRepository.findByInterviewId(interviewId);
    if (!job) throw new AppError('Feedback report not found', 404);
    return {
      interviewId,
      status: job.status === 'FAILED' ? 'FAILED' : 'GENERATING',
      report: null,
    };
  }
  if (report.status !== 'READY') {
    return {
      interviewId,
      status: report.status,
      report: null,
    };
  }
  return formatReport(report);
};

const findReportById = async (reportId) => {
  const report = await feedbackReportRepository.findById(reportId);
  if (!report) throw new AppError('Feedback report not found', 404);
  return report.status === 'READY'
    ? formatReport(report)
    : { interviewId: report.interviewId, status: report.status, report: null };
};

const listUserReports = async (userId) => {
  const reports = await feedbackReportRepository.listByUserId(userId);
  return reports.map((report) => ({
    reportId: report.id,
    interviewId: report.interviewId,
    status: report.status,
    overallScore: report.overallScore,
    generalLevel: report.generalLevel,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }));
};

module.exports = {
  findReportForInterview,
  findReportById,
  listUserReports,
};

import { collectAnalysis } from './collectAnalysis.js';
import { mergeByQuestion } from '../domain/mergeAnalyses.js';
import { scoreInterview } from '../domain/scoreInterview.js';
import { buildFeedbackReport } from '../domain/buildFeedbackReport.js';
import { servicesConfig } from '../config/services.js';
import { publishFeedbackReport } from '../integrations/feedbackClient.js';

export async function orchestrateInterview({ interviewId, videoUrl = null, segments = [] }) {
  const rawAnalysis = await collectAnalysis({ interviewId, videoUrl, segments });
  const merged = mergeByQuestion(rawAnalysis);
  const scoring = scoreInterview(merged);
  const report = buildFeedbackReport({
    interviewId,
    questionResults: scoring.questionResults,
    globalScore: scoring.globalScore,
  });

  const warnings = [...rawAnalysis.warnings];
  let feedbackPublication = { attempted: false, status: 'skipped' };

  if (servicesConfig.publishFeedback) {
    try {
      feedbackPublication = {
        attempted: true,
        status: 'published',
        result: await publishFeedbackReport({
          baseUrl: servicesConfig.feedbackBaseUrl,
          timeoutMs: servicesConfig.timeoutMs,
          report,
        }),
      };
    } catch (error) {
      warnings.push(`feedback_publish_failed: ${error.message}`);
      feedbackPublication = { attempted: true, status: 'failed' };
    }
  }

  return {
    interviewId,
    globalScore: scoring.globalScore,
    questionResults: scoring.questionResults,
    strengths: report.summary.strengths,
    improvementAreas: report.summary.improvementAreas,
    warnings,
    feedbackPublication,
    report,
  };
}

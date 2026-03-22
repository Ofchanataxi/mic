import { questionCatalog } from '../data/questionCatalog.js';
import { roleTemplates } from '../data/roleTemplates.js';

function pickFirst(questions, predicate, limit = 1) {
  return questions.filter(predicate).slice(0, limit);
}

export function buildInterviewPlan({ candidateId, profileId, targetRole, focus = 'BALANCED', adaptabilityPlan = null }) {
  const roleTemplate = roleTemplates[targetRole] ?? roleTemplates.BACKEND_MID;
  const prioritizedDomains = adaptabilityPlan?.domainsPriority?.map((item) => item.domain) ?? roleTemplate.requiredDomains;

  const technical = prioritizedDomains.flatMap((domain) =>
    pickFirst(questionCatalog, (question) => question.type === 'TECHNICAL' && question.domain === domain, 1),
  );
  const soft = pickFirst(questionCatalog, (question) => question.type === 'SOFT', focus === 'TECHNICAL' ? 1 : 2);
  const coding = pickFirst(questionCatalog, (question) => question.type === 'CODING' && prioritizedDomains.includes(question.domain), 1);

  const orderedQuestions = [...technical, ...soft, ...coding].map((question, index) => ({
    order: index + 1,
    questionId: question.id,
    questionText: question.text,
    type: question.type,
    domain: question.domain,
    subdomain: question.subdomain,
    expectedResponseType: question.type === 'CODING' ? 'code' : 'speech',
  }));

  return {
    interviewId: `interview-${candidateId}-${profileId}`,
    status: 'CREATED',
    targetRole,
    focus,
    weightsByDomain: prioritizedDomains.map((domain, index) => ({
      domain,
      weight: Number((Math.max(0.3, 0.8 - index * 0.12)).toFixed(2)),
    })),
    blocks: [
      { name: 'warmup', questionIds: orderedQuestions.slice(0, 1).map((item) => item.questionId) },
      { name: 'deep-dive', questionIds: orderedQuestions.slice(1, 3).map((item) => item.questionId) },
      { name: 'coding', questionIds: orderedQuestions.filter((item) => item.type === 'CODING').map((item) => item.questionId) },
    ],
    questions: orderedQuestions,
    orchestrationContract: {
      interviewId: `interview-${candidateId}-${profileId}`,
      segments: orderedQuestions.map((question) => ({
        questionId: question.questionId,
        questionText: question.questionText,
        expectedResponseType: question.expectedResponseType,
      })),
      rules: {
        adaptInRealtime: false,
        focus,
      },
    },
  };
}

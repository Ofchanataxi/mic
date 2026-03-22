import { roleTemplates } from '../data/roleTemplates.js';
import { getWeakDomains } from '../store/historyStore.js';

export function generatePlan({ candidateId, targetRole, profileId }) {
  const roleTemplate = roleTemplates[targetRole] ?? roleTemplates.BACKEND_MID;
  const weakDomains = getWeakDomains(candidateId);
  const domainsPriority = roleTemplate.requiredDomains.map((domain, index) => ({
    domain,
    weight: Number((weakDomains.includes(domain) ? 0.8 : Math.max(0.35, 0.65 - index * 0.08)).toFixed(2)),
  }));

  return {
    candidateId,
    profileId,
    targetRole,
    domainsPriority,
    excludedQuestionIds: [],
    strategy: {
      reinforceDomains: weakDomains,
      avoidRealtimeAdaptation: true,
    },
  };
}

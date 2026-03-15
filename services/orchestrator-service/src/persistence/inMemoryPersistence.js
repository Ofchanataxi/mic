export function createInMemoryPersistence() {
  const processed = new Set();
  const evaluations = new Map();

  return {
    async init() {},
    async isEventProcessed(eventId) {
      return processed.has(eventId);
    },
    async markEventProcessed({ eventId, interviewId }) {
      processed.add(eventId);
      return { eventId, interviewId };
    },
    async saveInterviewEvaluation(result) {
      evaluations.set(result.interviewId, result);
      return result;
    },
    async getInterviewEvaluation(interviewId) {
      return evaluations.get(interviewId) ?? null;
    },
  };
}

const mockDb = {
  'interview-demo': {
    semanticResults: [
      {
        questionId: 'q1',
        technicalScore: 0.82,
        clarityScore: 0.76,
        depthScore: 0.7,
        justification: 'Respuesta correcta con ejemplos concretos.',
      },
      {
        questionId: 'q2',
        technicalScore: 0.5,
        clarityScore: 0.55,
        depthScore: 0.45,
        justification: 'Faltó profundidad en trade-offs.',
      },
    ],
    audioResults: [
      { questionId: 'q1', speechRate: 125, pauseRatio: 0.21, confidenceScore: 0.7 },
      { questionId: 'q2', speechRate: 150, pauseRatio: 0.35, confidenceScore: 0.45 },
    ],
    videoResults: [
      { questionId: 'q1', eyeContactScore: 0.72, postureScore: 0.75, nervousMovementScore: 0.3 },
      { questionId: 'q2', eyeContactScore: 0.55, postureScore: 0.52, nervousMovementScore: 0.58 },
    ],
    codeResults: [{ questionId: 'q2', passedTests: 6, totalTests: 10, score: 0.6, compileError: null }],
  },
};

export async function fetchInterviewAnalysis(interviewId) {
  return mockDb[interviewId] ?? { semanticResults: [], audioResults: [], videoResults: [], codeResults: [] };
}

const sampleWeakDomains = {
  'candidate-demo': ['databases'],
};

export function getWeakDomains(candidateId) {
  return sampleWeakDomains[candidateId] ?? [];
}

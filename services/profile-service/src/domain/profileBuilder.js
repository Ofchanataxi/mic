const TECH_KEYWORDS = {
  backend: ['node', 'express', 'java', 'spring', 'api', 'microservice'],
  frontend: ['react', 'vue', 'angular', 'javascript', 'typescript', 'css'],
  databases: ['sql', 'postgres', 'mysql', 'mongodb', 'database', 'query'],
  testing: ['test', 'jest', 'cypress', 'qa'],
  devops: ['docker', 'kubernetes', 'ci/cd', 'github actions'],
};

function normalize(text) {
  return text.toLowerCase();
}

function countSkillMatches(cvText, keywords) {
  const text = normalize(cvText);
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function estimateExperienceYears(cvText) {
  const match = cvText.match(/(\d+)\+?\s*(años|anos|years)/i);
  return match ? Number(match[1]) : 1;
}

export function buildCandidateProfile({ userId, cvText, cvFileUrl = null }) {
  const detectedDomains = Object.entries(TECH_KEYWORDS)
    .map(([domain, keywords]) => ({ domain, score: countSkillMatches(cvText, keywords), keywords }))
    .filter((item) => item.score > 0)
    .map((item) => ({
      domain: item.domain,
      confidence: Number(Math.min(0.95, 0.35 + item.score * 0.12).toFixed(2)),
      matchedKeywords: item.keywords.filter((keyword) => normalize(cvText).includes(keyword)),
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const experienceYears = estimateExperienceYears(cvText);
  const level = experienceYears >= 5 ? 'SENIOR' : experienceYears >= 2 ? 'MID' : 'JUNIOR';

  return {
    id: `profile-${userId}`,
    userId,
    cvFileUrl,
    summary: `Perfil ${level} con foco en ${detectedDomains.slice(0, 2).map((d) => d.domain).join(' y ') || 'stack generalista'}.`,
    detectedDomains,
    experienceYears,
    detectedExperienceLevel: level,
    strengths: detectedDomains.slice(0, 3).map((d) => d.domain),
    improvementAreas: ['soft-skills', 'architecture'].filter((domain) => !detectedDomains.some((item) => item.domain === domain)),
    parsedData: {
      rawTextPreview: cvText.slice(0, 300),
      technologies: detectedDomains.flatMap((item) => item.matchedKeywords),
    },
  };
}

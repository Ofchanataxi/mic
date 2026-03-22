import { codingExercises, questionCatalog } from '../data/questionCatalog.js';

export function findQuestions(filters = {}) {
  return questionCatalog.filter((question) => {
    if (filters.domain && question.domain !== filters.domain) return false;
    if (filters.type && question.type !== filters.type) return false;
    if (filters.level && question.level !== filters.level.toUpperCase()) return false;
    return true;
  });
}

export function findCodingExercise(id) {
  return codingExercises.find((exercise) => exercise.id === id) ?? null;
}

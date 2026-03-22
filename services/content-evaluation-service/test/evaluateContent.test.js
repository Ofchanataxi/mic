import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateContent } from '../src/domain/evaluateContent.js';
import { validateContentEvaluationRequest } from '../src/utils/validation.js';

test('evaluateContent gives better scores to a structured technical answer', () => {
  const result = evaluateContent({
    questionText: '¿Qué es el polimorfismo en programación orientada a objetos?',
    transcript: 'El polimorfismo permite que una clase base exponga una interfaz común y que distintas clases implementen el mismo método de forma diferente. Por ejemplo, esto permite mantener extensibilidad, mejor mantenibilidad y un diseño con menos acoplamiento.',
  });

  assert.equal(result.analysisMode, 'simulated-heuristic');
  assert.ok(result.technicalScore >= 0.5);
  assert.ok(result.clarityScore >= 0.5);
  assert.ok(result.depthScore >= 0.45);
  assert.match(result.justification, /Fortalezas:/);
});

test('evaluateContent penalizes vague and uncertain answers', () => {
  const result = evaluateContent({
    questionText: '¿Qué es una transacción en SQL?',
    transcript: 'Creo que es algo de base de datos, tal vez para guardar cosas, no estoy seguro.',
  });

  assert.ok(result.technicalScore < 0.7);
  assert.ok(result.clarityScore < 0.5);
});

test('validateContentEvaluationRequest rejects invalid payloads', () => {
  assert.match(validateContentEvaluationRequest(null, { maxTranscriptLength: 10, maxQuestionLength: 10 }), /required/i);
  assert.match(
    validateContentEvaluationRequest({ questionId: 'q1', questionText: '', transcript: 'hola' }, { maxTranscriptLength: 100, maxQuestionLength: 100 }),
    /questionText is required/i,
  );
});

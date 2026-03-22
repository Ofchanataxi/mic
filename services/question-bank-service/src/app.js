import express from 'express';
import { serviceConfig } from './config/serviceConfig.js';
import { findCodingExercise, findQuestions } from './domain/questionSelector.js';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'question-bank-service' });
});

app.get('/questions', (req, res) => {
  return res.json(findQuestions(req.query));
});

app.get('/coding-exercises/:id', (req, res) => {
  const exercise = findCodingExercise(req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Coding exercise not found.' });
  return res.json(exercise);
});

export default app;

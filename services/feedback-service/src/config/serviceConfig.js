export const serviceConfig = {
  port: Number(process.env.PORT ?? 3012),
  storageDir: process.env.FEEDBACK_STORAGE_DIR ?? '.data/feedback-reports',
  simulateEmail: String(process.env.SIMULATE_EMAIL ?? 'true').toLowerCase() === 'true',
};

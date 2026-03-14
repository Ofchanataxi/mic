import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createPostgresPersistence(dbConfig) {
  const pool = new Pool(dbConfig);

  return {
    async init() {
      const schemaPath = path.resolve(__dirname, '../db/schema.sql');
      const sql = await fs.readFile(schemaPath, 'utf8');
      await pool.query(sql);
    },

    async isEventProcessed(eventId) {
      const result = await pool.query('SELECT 1 FROM processed_events WHERE event_id = $1', [eventId]);
      return result.rowCount > 0;
    },

    async markEventProcessed({ eventId, interviewId }) {
      await pool.query(
        `INSERT INTO processed_events(event_id, interview_id)
         VALUES ($1, $2)
         ON CONFLICT (event_id) DO NOTHING`,
        [eventId, interviewId],
      );
      return { eventId, interviewId };
    },

    async saveInterviewEvaluation(result) {
      await pool.query(
        `INSERT INTO interview_evaluations(interview_id, global_score, payload, warnings, feedback_publication, updated_at)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, NOW())
         ON CONFLICT (interview_id)
         DO UPDATE SET global_score = EXCLUDED.global_score,
                       payload = EXCLUDED.payload,
                       warnings = EXCLUDED.warnings,
                       feedback_publication = EXCLUDED.feedback_publication,
                       updated_at = NOW()`,
        [
          result.interviewId,
          result.globalScore,
          JSON.stringify(result),
          JSON.stringify(result.warnings ?? []),
          JSON.stringify(result.feedbackPublication ?? { status: 'unknown' }),
        ],
      );

      return result;
    },

    async getInterviewEvaluation(interviewId) {
      const dbRes = await pool.query('SELECT payload FROM interview_evaluations WHERE interview_id = $1', [interviewId]);
      if (dbRes.rowCount === 0) return null;
      return dbRes.rows[0].payload;
    },
  };
}

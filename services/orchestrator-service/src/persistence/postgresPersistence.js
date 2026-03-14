import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toSummary(result) {
  const technicalScores = result.questionResults.map((q) => q.semanticScore ?? 0);
  const communicationScores = result.questionResults.map((q) => ((q.audioScore ?? 0) + (q.videoScore ?? 0)) / 2);
  const codingScores = result.questionResults.map((q) => q.codeScore ?? 0);

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return {
    technicalScore: avg(technicalScores),
    softSkillsScore: avg(communicationScores),
    codingScore: avg(codingScores),
    communicationScore: avg(communicationScores),
    overallScore: result.globalScore ?? 0,
    strengths: result.strengths ?? [],
    weaknesses: result.improvementAreas ?? [],
    finalFeedback: JSON.stringify(result.report ?? {}),
  };
}

export function createPostgresPersistence(dbConfig) {
  const pool = new Pool(dbConfig);

  return {
    async init() {
      const schemaPath = path.resolve(__dirname, '../db/schema.sql');
      const sql = await fs.readFile(schemaPath, 'utf8');
      await pool.query(sql);
    },

    async isEventProcessed(eventId) {
      const result = await pool.query('SELECT 1 FROM orchestrator_processed_events WHERE event_id = $1', [eventId]);
      return result.rowCount > 0;
    },

    async markEventProcessed({ eventId, interviewId }) {
      await pool.query(
        `INSERT INTO orchestrator_processed_events(event_id, interview_id)
         VALUES ($1, $2::uuid)
         ON CONFLICT (event_id) DO NOTHING`,
        [eventId, interviewId],
      );
      return { eventId, interviewId };
    },

    async saveInterviewEvaluation(result) {
      const summary = toSummary(result);

      await pool.query(
        `INSERT INTO interview_summaries(
           id,
           interview_id,
           technical_score,
           soft_skills_score,
           coding_score,
           communication_score,
           overall_score,
           strengths,
           weaknesses,
           final_feedback,
           created_at
         ) VALUES (
           md5($1)::uuid,
           $1::uuid,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7::jsonb,
           $8::jsonb,
           $9,
           NOW()
         )
         ON CONFLICT (interview_id)
         DO UPDATE SET
           technical_score = EXCLUDED.technical_score,
           soft_skills_score = EXCLUDED.soft_skills_score,
           coding_score = EXCLUDED.coding_score,
           communication_score = EXCLUDED.communication_score,
           overall_score = EXCLUDED.overall_score,
           strengths = EXCLUDED.strengths,
           weaknesses = EXCLUDED.weaknesses,
           final_feedback = EXCLUDED.final_feedback`,
        [
          result.interviewId,
          summary.technicalScore,
          summary.softSkillsScore,
          summary.codingScore,
          summary.communicationScore,
          summary.overallScore,
          JSON.stringify(summary.strengths),
          JSON.stringify(summary.weaknesses),
          summary.finalFeedback,
        ],
      );

      return result;
    },

    async getInterviewEvaluation(interviewId) {
      const dbRes = await pool.query(
        `SELECT
           interview_id,
           technical_score,
           soft_skills_score,
           coding_score,
           communication_score,
           overall_score,
           strengths,
           weaknesses,
           final_feedback,
           created_at
         FROM interview_summaries
         WHERE interview_id = $1::uuid`,
        [interviewId],
      );

      if (dbRes.rowCount === 0) return null;

      const row = dbRes.rows[0];
      return {
        interviewId: row.interview_id,
        summary: {
          technicalScore: row.technical_score,
          softSkillsScore: row.soft_skills_score,
          codingScore: row.coding_score,
          communicationScore: row.communication_score,
          overallScore: row.overall_score,
          strengths: row.strengths ?? [],
          weaknesses: row.weaknesses ?? [],
          finalFeedback: row.final_feedback,
          createdAt: row.created_at,
        },
      };
    },
  };
}

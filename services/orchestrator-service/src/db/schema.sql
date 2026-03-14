CREATE TABLE IF NOT EXISTS processed_events (
  event_id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_evaluations (
  interview_id TEXT PRIMARY KEY,
  global_score NUMERIC(5,4) NOT NULL,
  payload JSONB NOT NULL,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback_publication JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

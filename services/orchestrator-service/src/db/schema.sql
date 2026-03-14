CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS subdomains (
  id UUID PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES domains(id),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  UNIQUE (domain_id, name)
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES domains(id),
  subdomain_id UUID NOT NULL REFERENCES subdomains(id),
  type VARCHAR(20) NOT NULL,
  difficulty VARCHAR(20),
  question_text TEXT NOT NULL,
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  cv_file_url TEXT NOT NULL,
  parsed_data JSONB,
  detected_experience_level VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  profile_id UUID NOT NULL REFERENCES candidate_profiles(id),
  role_target VARCHAR(100),
  level_target VARCHAR(50),
  status VARCHAR(20) NOT NULL,
  video_url TEXT,
  audio_url TEXT,
  total_duration_seconds INT,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  processing_completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  domain_id UUID NOT NULL REFERENCES domains(id),
  subdomain_id UUID NOT NULL REFERENCES subdomains(id),
  type VARCHAR(20) NOT NULL,
  order_number INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (interview_id, order_number)
);

CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY,
  interview_question_id UUID NOT NULL UNIQUE REFERENCES interview_questions(id),
  text_response TEXT,
  code_submitted TEXT,
  start_timestamp_seconds FLOAT NOT NULL,
  end_timestamp_seconds FLOAT NOT NULL,
  response_duration_seconds FLOAT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_evaluations (
  id UUID PRIMARY KEY,
  response_id UUID NOT NULL UNIQUE REFERENCES responses(id),
  language VARCHAR(50),
  passed_tests INT,
  total_tests INT,
  execution_time FLOAT,
  memory_usage FLOAT,
  score FLOAT,
  raw_result JSONB
);

CREATE TABLE IF NOT EXISTS audio_analysis (
  id UUID PRIMARY KEY,
  response_id UUID NOT NULL UNIQUE REFERENCES responses(id),
  transcription TEXT,
  fluency_score FLOAT,
  speech_rate FLOAT,
  pause_ratio FLOAT,
  prosody_metrics JSONB,
  raw_output JSONB
);

CREATE TABLE IF NOT EXISTS video_analysis (
  id UUID PRIMARY KEY,
  response_id UUID NOT NULL UNIQUE REFERENCES responses(id),
  eye_contact_score FLOAT,
  posture_score FLOAT,
  stress_indicator FLOAT,
  facial_metrics JSONB,
  raw_output JSONB
);

CREATE TABLE IF NOT EXISTS semantic_analysis (
  id UUID PRIMARY KEY,
  response_id UUID NOT NULL UNIQUE REFERENCES responses(id),
  relevance_score FLOAT,
  clarity_score FLOAT,
  depth_score FLOAT,
  structured_feedback TEXT,
  raw_output JSONB
);

CREATE TABLE IF NOT EXISTS multimodal_results (
  id UUID PRIMARY KEY,
  response_id UUID NOT NULL UNIQUE REFERENCES responses(id),
  confidence_index FLOAT,
  consistency_index FLOAT,
  overall_score FLOAT,
  detected_inconsistencies JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_summaries (
  id UUID PRIMARY KEY,
  interview_id UUID NOT NULL UNIQUE REFERENCES interviews(id),
  technical_score FLOAT,
  soft_skills_score FLOAT,
  coding_score FLOAT,
  communication_score FLOAT,
  overall_score FLOAT,
  strengths JSONB,
  weaknesses JSONB,
  final_feedback TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subdomain_performance_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  subdomain_id UUID NOT NULL REFERENCES subdomains(id),
  average_score FLOAT NOT NULL,
  interviews_count INT NOT NULL DEFAULT 0,
  usage_index INT NOT NULL DEFAULT 0,
  reinforce BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated TIMESTAMP NOT NULL,
  UNIQUE (user_id, subdomain_id)
);

CREATE TABLE IF NOT EXISTS domain_performance_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  domain_id UUID NOT NULL REFERENCES domains(id),
  average_score FLOAT NOT NULL,
  interviews_count INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL,
  UNIQUE (user_id, domain_id)
);

CREATE TABLE IF NOT EXISTS orchestrator_processed_events (
  event_id TEXT PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_responses_interview_question_id ON responses(interview_question_id);
CREATE INDEX IF NOT EXISTS idx_subdomain_perf_user_subdomain ON subdomain_performance_history(user_id, subdomain_id);
CREATE INDEX IF NOT EXISTS idx_questions_subdomain_difficulty_type ON questions(subdomain_id, difficulty, type);
CREATE INDEX IF NOT EXISTS idx_interview_questions_subdomain_id ON interview_questions(subdomain_id);

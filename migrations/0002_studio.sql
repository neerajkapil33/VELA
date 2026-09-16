CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  aspect TEXT NOT NULL,
  status TEXT NOT NULL,
  favorite INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  remote_url TEXT,
  video_url TEXT,
  source_id TEXT,
  job_id TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS generations_session_created_idx
  ON generations (session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS studio_jobs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  generation_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  request_id TEXT,
  error TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS studio_jobs_session_status_idx
  ON studio_jobs (session_id, status);

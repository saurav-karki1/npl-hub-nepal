-- ==============================================================================
-- NPL Hub Nepal — Multi-Provider AI Editorial System Schema
-- Migration: 20261031000000_editorial_jobs.sql
-- Description: Additive migration introducing the editorial_jobs table for the
--              multi-provider AI editorial pipeline.
--              Maintains persistent job state, stage transitions (1 to 7),
--              dossier extraction, telemetry, locking, and article references.
--              Fully additive and idempotent (IF NOT EXISTS).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Editorial Jobs Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.editorial_jobs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic             TEXT        NOT NULL,
  article_type      TEXT        NOT NULL
                                CHECK (article_type IN (
                                  'breaking_news',
                                  'tournament_news',
                                  'match_preview',
                                  'match_report',
                                  'match_analysis',
                                  'team_news',
                                  'player_news',
                                  'squad_analysis',
                                  'points_table_update',
                                  'official_announcement',
                                  'feature_story'
                                )),
  target_keyword    TEXT,
  current_stage     INTEGER     NOT NULL DEFAULT 1
                                CHECK (current_stage BETWEEN 1 AND 7),
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN (
                                  'pending',
                                  'running',
                                  'paused_insufficient_evidence',
                                  'paused_quota_limit',
                                  'failed',
                                  'completed'
                                )),
  worker_token      UUID,
  lock_acquired_at  TIMESTAMPTZ,
  pause_reason      TEXT,
  stage_data        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  telemetry         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  error_log         TEXT[]      NOT NULL DEFAULT '{}',
  article_id        TEXT        REFERENCES public.news_articles(id) ON DELETE SET NULL,
  created_by        TEXT        NOT NULL DEFAULT 'admin',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. Indexes for High-Efficiency Worker Polling & Admin Queries
-- ------------------------------------------------------------------------------

-- Worker polling for claimable jobs (status + stage)
CREATE INDEX IF NOT EXISTS idx_editorial_jobs_status_stage
  ON public.editorial_jobs(status, current_stage);

-- Lock management & stale-lock reclamation
CREATE INDEX IF NOT EXISTS idx_editorial_jobs_lock
  ON public.editorial_jobs(status, lock_acquired_at)
  WHERE status = 'running';

-- Admin UI listing ordered by creation time
CREATE INDEX IF NOT EXISTS idx_editorial_jobs_created_at
  ON public.editorial_jobs(created_at DESC);

-- Fast lookup by created article ID
CREATE INDEX IF NOT EXISTS idx_editorial_jobs_article_id
  ON public.editorial_jobs(article_id)
  WHERE article_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. Row Level Security
--    The editorial_jobs table is internal admin-only.
--    The service-role client used by API routes bypasses RLS automatically.
--    Public read/write access is intentionally NOT granted.
-- ------------------------------------------------------------------------------
ALTER TABLE public.editorial_jobs ENABLE ROW LEVEL SECURITY;

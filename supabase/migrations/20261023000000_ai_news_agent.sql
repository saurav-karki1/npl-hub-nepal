-- ==============================================================================
-- NPL Hub Nepal — AI News Agent Schema
-- Migration: 20261023000000_ai_news_agent.sql
-- Description: Additive migration for the AI news agent system.
--              Adds agent_config, agent_runs tables and ai_generated flag.
--              All operations are conditional (IF NOT EXISTS) — safe to re-run.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Add ai_generated flag to news_articles
--    Identifies articles written by the AI agent vs. manually authored ones.
--    Defaults to false — all existing rows receive the correct value silently.
-- ------------------------------------------------------------------------------
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false;

-- Index to efficiently query agent-generated drafts in the admin panel
CREATE INDEX IF NOT EXISTS idx_news_articles_ai_generated
  ON public.news_articles(ai_generated)
  WHERE ai_generated = true;

-- ------------------------------------------------------------------------------
-- 2. Agent Configuration Table
--    Singleton row (id = 'news-agent') holding the agent's runtime settings.
--    enabled=false by default — agent does nothing until explicitly turned on.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_config (
  id              TEXT        PRIMARY KEY DEFAULT 'news-agent',
  enabled         BOOLEAN     NOT NULL DEFAULT false,
  interval_hours  INTEGER     NOT NULL DEFAULT 2
                              CHECK (interval_hours BETWEEN 1 AND 24),
  sources         JSONB       NOT NULL DEFAULT '[]',
  -- auto_publish is permanently false in this milestone.
  -- The column exists for future use but the scan route never reads it as true.
  auto_publish    BOOLEAN     NOT NULL DEFAULT false,
  -- Overlap guard: set to NOW() when a scan starts, cleared when it finishes.
  -- If set and older than 15 minutes, it is considered stale and overwritten.
  running_since   TIMESTAMPTZ,
  last_run_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Agent Run Log Table
--    One row per scan attempt. Provides audit trail, error reporting, and
--    token usage monitoring visible in the /admin/agent page.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        TEXT        NOT NULL DEFAULT 'news-agent',
  status          TEXT        NOT NULL
                              CHECK (status IN ('success', 'partial', 'error')),
  sources_checked INTEGER     NOT NULL DEFAULT 0,
  items_found     INTEGER     NOT NULL DEFAULT 0,
  items_saved     INTEGER     NOT NULL DEFAULT 0,
  tokens_used     INTEGER,
  errors          TEXT[]      NOT NULL DEFAULT '{}',
  ran_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id
  ON public.agent_runs(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_runs_ran_at
  ON public.agent_runs(ran_at DESC);

-- ------------------------------------------------------------------------------
-- 4. Row Level Security
--    Both tables are admin-only. The service-role client used by all agent
--    and admin API routes bypasses RLS automatically — no explicit write
--    policy is needed. Public read access is intentionally NOT granted.
-- ------------------------------------------------------------------------------
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs   ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. Seed the singleton agent_config row (idempotent)
--    Inserts only if no row exists yet. On conflict, does nothing.
-- ------------------------------------------------------------------------------
INSERT INTO public.agent_config (id, enabled, interval_hours, sources, auto_publish)
VALUES (
  'news-agent',
  false,
  2,
  '[
    {
      "id": "google-news-npl",
      "name": "Google News — Nepal Premier League",
      "type": "google-news-rss",
      "query": "Nepal Premier League cricket",
      "enabled": true
    },
    {
      "id": "google-news-npl-2026",
      "name": "Google News — NPL 2026",
      "type": "google-news-rss",
      "query": "NPL cricket Nepal 2026",
      "enabled": true
    }
  ]'::jsonb,
  false
)
ON CONFLICT (id) DO NOTHING;

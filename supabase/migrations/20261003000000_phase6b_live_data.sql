-- ==============================================================================
-- NPL Hub Nepal — PostgreSQL Database Schema
-- Migration: 20261003000000_phase6b_live_data.sql
-- Description: Phase 6B Live Data Integration, Match Lifecycle & AI Commentary Tables
-- ==============================================================================

-- 1. Extend matches table with external cricket provider identifiers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'external_provider'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN external_provider TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'external_match_id'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN external_match_id TEXT;
  END IF;
END $$;

-- 2. Extend teams table with external cricket provider identifiers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'external_team_id'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN external_team_id TEXT;
  END IF;
END $$;

-- 3. Update status constraint on matches to include 'postponed' and 'abandoned'
DO $$
BEGIN
  ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
  ALTER TABLE public.matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('upcoming', 'completed', 'live', 'postponed', 'abandoned', 'tba'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 4. Create match_commentary table for verified AI-assisted commentary
CREATE TABLE IF NOT EXISTS public.match_commentary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  external_event_id TEXT,
  over_number NUMERIC(4,1) NOT NULL,
  ball_number INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL CHECK (event_type IN ('ball', 'boundary', 'wicket', 'over_summary', 'milestone', 'match_start', 'match_end')),
  headline TEXT,
  commentary_text TEXT NOT NULL,
  runs INTEGER NOT NULL DEFAULT 0,
  is_wicket BOOLEAN NOT NULL DEFAULT false,
  is_boundary BOOLEAN NOT NULL DEFAULT false,
  is_six BOOLEAN NOT NULL DEFAULT false,
  batter_name TEXT,
  bowler_name TEXT,
  provider TEXT NOT NULL DEFAULT 'gemini' CHECK (provider IN ('gemini', 'rule-based', 'manual', 'fallback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_match_commentary_event UNIQUE (match_id, external_event_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_external_id ON public.matches(external_match_id);
CREATE INDEX IF NOT EXISTS idx_matches_external_provider ON public.matches(external_provider);
CREATE INDEX IF NOT EXISTS idx_commentary_match_id ON public.match_commentary(match_id);
CREATE INDEX IF NOT EXISTS idx_commentary_created_at ON public.match_commentary(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commentary_over ON public.match_commentary(match_id, over_number DESC, ball_number DESC);

-- Enable RLS
ALTER TABLE public.match_commentary ENABLE ROW LEVEL SECURITY;

-- Public Read Policy
DROP POLICY IF EXISTS "Public read access for match_commentary" ON public.match_commentary;
CREATE POLICY "Public read access for match_commentary" 
  ON public.match_commentary FOR SELECT USING (true);

-- ==============================================================================
-- NPL Hub Nepal — PostgreSQL Database Schema Reference
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. SEASONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seasons (
  id TEXT PRIMARY KEY, -- e.g. 'season-2', 'season-3'
  name TEXT NOT NULL, -- e.g. 'NPL Season 3 (2026)'
  short_name TEXT NOT NULL, -- e.g. 'Season 3 — 2026'
  year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'pre-tournament', 'in-progress')),
  edition TEXT,
  dates_display TEXT,
  start_date DATE,
  end_date DATE,
  venue TEXT,
  venue_city TEXT,
  total_teams INTEGER NOT NULL DEFAULT 8,
  total_matches INTEGER NOT NULL DEFAULT 32,
  league_matches INTEGER NOT NULL DEFAULT 28,
  playoff_matches INTEGER NOT NULL DEFAULT 4,
  format TEXT NOT NULL DEFAULT 'T20 (20 Overs)',
  points_system TEXT,
  champion_team_id TEXT, -- FK attached after teams table
  runner_up_team_id TEXT, -- FK attached after teams table
  confidence TEXT CHECK (confidence IN ('High', 'Medium', 'Low')),
  confidence_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. TEAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY, -- Canonical slug, e.g. 'lumbini-lions'
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  brand_color TEXT NOT NULL,
  brand_bg TEXT NOT NULL,
  crest_bg TEXT NOT NULL,
  crest_text TEXT NOT NULL,
  logo_url TEXT,
  established TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add deferred foreign keys from seasons to teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seasons_champion_team'
  ) THEN
    ALTER TABLE public.seasons 
      ADD CONSTRAINT fk_seasons_champion_team 
      FOREIGN KEY (champion_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seasons_runner_up_team'
  ) THEN
    ALTER TABLE public.seasons 
      ADD CONSTRAINT fk_seasons_runner_up_team 
      FOREIGN KEY (runner_up_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. TEAM_SEASONS TABLE (Junction + Season-Specific Team State & Standings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_seasons (
  id TEXT PRIMARY KEY, -- e.g. 'season-3_lumbini-lions'
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  captain_name TEXT,
  captain_confidence TEXT CHECK (captain_confidence IN ('confirmed', 'reported')),
  captain_source TEXT,
  captain_confirmed_at TIMESTAMPTZ,
  coach TEXT,
  squad_status TEXT,
  standing_position INTEGER,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  no_result INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  net_run_rate NUMERIC(6,3),
  runs_scored INTEGER NOT NULL DEFAULT 0,
  overs_faced_decimal NUMERIC(5,1) NOT NULL DEFAULT 0,
  runs_conceded INTEGER NOT NULL DEFAULT 0,
  overs_bowled_decimal NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_team_season UNIQUE (season_id, team_id)
);

-- ------------------------------------------------------------------------------
-- 4. PLAYERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY, -- Canonical slug, e.g. 'sandeep-lamichhane'
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  nationality TEXT NOT NULL DEFAULT 'Nepali',
  date_of_birth DATE,
  birth_place TEXT,
  batting_style TEXT,
  bowling_style TEXT,
  profile_image TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. PLAYER_SEASONS TABLE (Junction + Season-Specific Roster & Roles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_seasons (
  id TEXT PRIMARY KEY, -- e.g. 'season-3_sandeep-lamichhane'
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Batter', 'Bowler', 'All-rounder', 'Wicketkeeper')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'reported', 'not-announced')),
  captain BOOLEAN NOT NULL DEFAULT false,
  marquee BOOLEAN NOT NULL DEFAULT false,
  player_number INTEGER,
  confidence TEXT NOT NULL DEFAULT 'confirmed' CHECK (confidence IN ('confirmed', 'reported', 'unknown')),
  source TEXT,
  source_url TEXT,
  source_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_player_season UNIQUE (season_id, player_id)
);

-- ------------------------------------------------------------------------------
-- 6. MATCHES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY, -- e.g. 'match-01'
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  match_number INTEGER NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('League', 'Qualifier 1', 'Eliminator', 'Qualifier 2', 'Final')),
  team1_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
  team1_placeholder TEXT,
  team2_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
  team2_placeholder TEXT,
  match_date DATE NOT NULL,
  formatted_date TEXT NOT NULL,
  bs_date TEXT NOT NULL,
  bs_date_nepali TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  match_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'completed', 'live', 'tba')),
  result TEXT,
  winner_team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
  winner_name TEXT,
  win_margin TEXT,
  win_type TEXT CHECK (win_type IN ('runs', 'wickets', 'super_over', 'no_result', 'abandoned')),
  result_statement TEXT,
  player_of_the_match TEXT,
  toss_winner_team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
  toss_decision TEXT CHECK (toss_decision IN ('bat', 'bowl')),
  scores JSONB,
  is_provisional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_match_team1_side CHECK (
    (team1_id IS NOT NULL AND team1_placeholder IS NULL) OR 
    (team1_id IS NULL AND team1_placeholder IS NOT NULL)
  ),
  CONSTRAINT chk_match_team2_side CHECK (
    (team2_id IS NOT NULL AND team2_placeholder IS NULL) OR 
    (team2_id IS NULL AND team2_placeholder IS NOT NULL)
  ),
  CONSTRAINT uq_season_match_number UNIQUE (season_id, match_number)
);

-- ------------------------------------------------------------------------------
-- 7. NEWS_ARTICLES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_articles (
  id TEXT PRIMARY KEY, -- e.g. 'npl-season-3-schedule-venues-announced'
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content JSONB NOT NULL, -- Array of paragraph strings
  category TEXT NOT NULL CHECK (category IN ('Tournament', 'Teams', 'Matches', 'Points Table', 'Announcements')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  featured BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  author TEXT NOT NULL,
  author_role TEXT NOT NULL,
  read_time TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 8. NEWS_TEAM_RELATIONS TABLE (Junction Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_team_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_news_team UNIQUE (article_id, team_id)
);

-- ------------------------------------------------------------------------------
-- 9. PLAYER_SEASON_STATS TABLE (Verified Historical Records & Aggregated Stats)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_season_stats (
  id TEXT PRIMARY KEY, -- e.g. 's2_rohit-paudel'
  player_season_id TEXT REFERENCES public.player_seasons(id) ON DELETE SET NULL,
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  player_slug TEXT,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  team_name TEXT NOT NULL,
  matches INTEGER,
  innings INTEGER,
  runs INTEGER,
  highest_score TEXT,
  average NUMERIC(6,2),
  strike_rate NUMERIC(6,2),
  wickets INTEGER,
  best_bowling TEXT,
  economy NUMERIC(5,2),
  fours INTEGER,
  sixes INTEGER,
  hundreds INTEGER,
  fifties INTEGER,
  catches INTEGER,
  wicketkeeper_dismissals INTEGER,
  confidence TEXT NOT NULL DEFAULT 'High' CHECK (confidence IN ('High', 'Medium', 'Low')),
  source_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_player_season_stats UNIQUE (season_id, player_name, team_id)
);

-- ------------------------------------------------------------------------------
-- 10. TOURNAMENT_AWARDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  award_type TEXT NOT NULL,
  award_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_player_slug TEXT,
  recipient_team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
  recipient_team_name TEXT NOT NULL,
  stat_metric TEXT,
  secondary_detail TEXT,
  confidence TEXT NOT NULL DEFAULT 'High' CHECK (confidence IN ('High', 'Medium', 'Low')),
  source_note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_seasons_status ON public.seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_year ON public.seasons(year);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(slug);
CREATE INDEX IF NOT EXISTS idx_team_seasons_season ON public.team_seasons(season_id);
CREATE INDEX IF NOT EXISTS idx_team_seasons_team ON public.team_seasons(team_id);
CREATE INDEX IF NOT EXISTS idx_players_slug ON public.players(slug);
CREATE INDEX IF NOT EXISTS idx_player_seasons_season ON public.player_seasons(season_id);
CREATE INDEX IF NOT EXISTS idx_player_seasons_player ON public.player_seasons(player_id);
CREATE INDEX IF NOT EXISTS idx_player_seasons_team ON public.player_seasons(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_season ON public.matches(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_slug ON public.matches(slug);
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_team1 ON public.matches(team1_id);
CREATE INDEX IF NOT EXISTS idx_matches_team2 ON public.matches(team2_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON public.news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON public.news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_team_relations_article ON public.news_team_relations(article_id);
CREATE INDEX IF NOT EXISTS idx_news_team_relations_team ON public.news_team_relations(team_id);
CREATE INDEX IF NOT EXISTS idx_player_season_stats_season ON public.player_season_stats(season_id);
CREATE INDEX IF NOT EXISTS idx_player_season_stats_player_slug ON public.player_season_stats(player_slug);
CREATE INDEX IF NOT EXISTS idx_player_season_stats_team ON public.player_season_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_awards_season ON public.tournament_awards(season_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_team_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_awards ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
DROP POLICY IF EXISTS "Public read access for seasons" ON public.seasons;
CREATE POLICY "Public read access for seasons" ON public.seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for teams" ON public.teams;
CREATE POLICY "Public read access for teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for team_seasons" ON public.team_seasons;
CREATE POLICY "Public read access for team_seasons" ON public.team_seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for players" ON public.players;
CREATE POLICY "Public read access for players" ON public.players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for player_seasons" ON public.player_seasons;
CREATE POLICY "Public read access for player_seasons" ON public.player_seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for matches" ON public.matches;
CREATE POLICY "Public read access for matches" ON public.matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for published news" ON public.news_articles;
CREATE POLICY "Public read access for published news" ON public.news_articles FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public read access for news_team_relations" ON public.news_team_relations;
CREATE POLICY "Public read access for news_team_relations" ON public.news_team_relations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for player_season_stats" ON public.player_season_stats;
CREATE POLICY "Public read access for player_season_stats" ON public.player_season_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for tournament_awards" ON public.tournament_awards;
CREATE POLICY "Public read access for tournament_awards" ON public.tournament_awards FOR SELECT USING (true);

/**
 * NPL Hub Nepal — Statistics Module Architecture & Types
 *
 * Multi-season statistics dataset contracts supporting:
 * - Season 2 (2025): Completed historical tournament with verified Perplexity/ESPN research
 * - Season 3 (2026): Pre-tournament state awaiting live match play
 * - Future seasons / Live Admin Panel integration
 *
 * STRICT INTEGRITY RULES:
 * - Unavailable metrics must remain `null`. Never convert missing stats to 0.
 * - Missing leaderboards must not be padded with speculative records.
 * - Historical final standings are authoritative and must never be recomputed from partial match sets.
 */

export type SeasonId = "season-2" | "season-3";
export type SeasonStatus = "completed" | "pre-tournament" | "in-progress";

export interface SeasonOption {
  id: SeasonId;
  name: string;
  shortName: string;
  year: number;
  status: "completed" | "pre-tournament";
  badgeText: string;
}

export interface TournamentSummary {
  seasonId: SeasonId;
  name: string;
  shortName: string;
  edition: string;
  dates: string;
  startDate: string;
  endDate: string;
  venue: string;
  venueCity: string;
  teamsCount: number;
  totalMatches: number;
  leagueMatches: number;
  playoffMatches: number;
  format: string;
  pointsSystem: string;
  champion: {
    teamId: string;
    teamName: string;
  } | null;
  runnerUp: {
    teamId: string;
    teamName: string;
  } | null;
  confidence: "High" | "Medium" | "Low";
  confidenceNote?: string;
}

export interface FinalStandingsRow {
  position: number;
  teamId: string;
  teamName: string;
  played: number | null;
  won: number | null;
  lost: number | null;
  tied: number | null;
  noResult: number | null;
  points: number | null;
  netRunRate: number | null;
  formattedNRR: string;
  qualification?: "Qualifier 1" | "Eliminator" | "Eliminated";
}

export interface TournamentAward {
  id: string;
  title: string;
  recipient: string;
  teamId: string;
  teamName: string;
  playerSlug?: string | null;
  detail: string;
  categoryNote?: string;
  confidence: "High" | "Medium" | "Low";
}

export interface LeaderboardItem {
  rank: number;
  playerName: string;
  playerSlug?: string | null;
  teamId: string;
  teamName: string;
  value: string | number;
  metricLabel: string;
  secondaryDetail?: string;
}

export interface Leaderboards {
  batting: Record<string, { title: string; metric: string; items: LeaderboardItem[] }>;
  bowling: Record<string, { title: string; metric: string; items: LeaderboardItem[] }>;
}

export interface PlayoffMatch {
  id: string;
  stage: "Qualifier 1" | "Eliminator" | "Qualifier 2" | "Final";
  date: string;
  formattedDate: string;
  team1: {
    id: string;
    name: string;
    score: string | null; // e.g. "155/8" or null if NOT FOUND
    overs: string | null; // e.g. "20" or null
  };
  team2: {
    id: string;
    name: string;
    score: string | null;
    overs: string | null;
  };
  rawScoreSummary: string | null; // e.g. "SPR 155/8 (20); BK 78 all out (14.1)"
  result: string; // e.g. "SPR won by 77 runs"
  winnerTeamId?: string;
  playerOfTheMatch: {
    name: string;
    playerSlug?: string | null;
    stats?: string;
  } | null;
  scorecardAvailable: boolean;
  notes?: string;
}

export interface VerifiedLeagueMatch {
  matchNumber: number;
  date: string;
  formattedDate: string;
  team1: {
    id: string;
    name: string;
    score: string;
    overs: string;
  };
  team2: {
    id: string;
    name: string;
    score: string;
    overs: string;
  };
  rawScoreSummary: string;
  result: string;
  winnerTeamId: string;
  playerOfTheMatch: null; // Explicitly NOT FOUND for all league matches
}

export interface PlayerSeasonStats {
  id: string;
  playerName: string;
  playerSlug?: string | null; // Linked to /players/[slug] if in players-data.ts
  teamId: string;
  teamName: string;
  matches: number | null;
  innings: number | null;
  runs: number | null;
  highestScore: string | number | null;
  average: number | null;
  strikeRate: number | null;
  wickets: number | null;
  bestBowling: string | null;
  economy: number | null;
  fours: number | null;
  sixes: number | null;
  hundreds: number | null;
  fifties: number | null;
  catches: number | null;
  wicketkeeperDismissals: number | null;
  confidence: "High" | "Medium" | "Low";
  sourceNote?: string;
}

export interface SourceReference {
  name: string;
  description: string;
  url?: string;
}

export interface DataIntegrityMetadata {
  verifiedLeagueMatchesCount: number;
  totalLeagueMatchesCount: number;
  authoritativePointsTableSource: string;
  integrityWarnings: string[];
  missingResearchItems: string[];
  sources: SourceReference[];
}

export interface SeasonStatsDataset {
  seasonId: SeasonId;
  seasonName: string;
  year: number;
  status: SeasonStatus;
  summary: TournamentSummary;
  standings: FinalStandingsRow[];
  awards: TournamentAward[];
  leaderboards: Leaderboards;
  playerStats: PlayerSeasonStats[];
  playoffs: PlayoffMatch[];
  verifiedLeagueMatches: VerifiedLeagueMatch[];
  integrity: DataIntegrityMetadata;
  preTournamentNotice?: {
    title: string;
    message: string;
    scheduledDates: string;
    venue: string;
    features: string[];
  };
}

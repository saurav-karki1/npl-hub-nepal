/**
 * NPL Hub Nepal — Statistics Repository
 *
 * Abstracted data access layer for multi-season statistics and historical records.
 * Primary source: Supabase database (`seasons`, `team_seasons`, `tournament_awards`, `player_season_stats`).
 * Fallback source: Centralized static data (`stats-registry.ts`).
 *
 * Admin write functions call the secure /api/admin/stats API route
 * (server-side, service-role key) — never Supabase directly from UI.
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getSeasonStats as getSeasonStatsData,
  isValidSeasonId as isValidSeasonIdData,
  AVAILABLE_SEASONS as AVAILABLE_SEASONS_DATA,
  resolveCanonicalPlayerSlug as resolveCanonicalPlayerSlugData,
  resolveCanonicalTeamSlug as resolveCanonicalTeamSlugData,
  getTeamMeta as getTeamMetaData,
  SeasonOption,
} from "@/lib/data/stats-registry";
import {
  SeasonId,
  SeasonStatus,
  SeasonStatsDataset,
  TournamentSummary,
  FinalStandingsRow,
  TournamentAward,
  LeaderboardItem,
  Leaderboards,
  PlayoffMatch,
  VerifiedLeagueMatch,
  PlayerSeasonStats,
  DataIntegrityMetadata,
} from "@/lib/data/stats-types";
import { TeamDetail } from "@/lib/data/teams-data";
import { getTeamBySlugSync } from "@/lib/repository/teams";

export type {
  SeasonId,
  SeasonStatus,
  SeasonStatsDataset,
  TournamentSummary,
  FinalStandingsRow,
  TournamentAward,
  LeaderboardItem,
  Leaderboards,
  PlayoffMatch,
  VerifiedLeagueMatch,
  PlayerSeasonStats,
  DataIntegrityMetadata,
  SeasonOption,
};

export const AVAILABLE_SEASONS = AVAILABLE_SEASONS_DATA;

/** Synchronous fallbacks for backwards compatibility */
export const getSeasonStatsSync = getSeasonStatsData;

// ---------------------------------------------------------------------------
// Admin-specific types (Phase 5G)
// ---------------------------------------------------------------------------

export type StatConfidence = "High" | "Medium" | "Low";

export interface AdminPlayerSeasonStatRow {
  id: string;
  player_season_id: string | null;
  season_id: string;
  player_name: string;
  player_slug: string | null;
  team_id: string;
  team_name: string;
  matches: number | null;
  innings: number | null;
  runs: number | null;
  highest_score: string | null;
  average: number | null;
  strike_rate: number | null;
  wickets: number | null;
  best_bowling: string | null;
  economy: number | null;
  fours: number | null;
  sixes: number | null;
  hundreds: number | null;
  fifties: number | null;
  catches: number | null;
  wicketkeeper_dismissals: number | null;
  confidence: StatConfidence;
  source_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminTournamentAwardRow {
  id: string;
  season_id: string;
  award_type: string;
  award_name: string;
  recipient_name: string;
  recipient_player_slug: string | null;
  recipient_team_id: string | null;
  recipient_team_name: string;
  stat_metric: string | null;
  secondary_detail: string | null;
  confidence: StatConfidence;
  source_note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UpdatePlayerSeasonStatInput {
  id: string;
  matches?: number | null;
  innings?: number | null;
  runs?: number | null;
  highest_score?: string | null;
  average?: number | null;
  strike_rate?: number | null;
  wickets?: number | null;
  best_bowling?: string | null;
  economy?: number | null;
  fours?: number | null;
  sixes?: number | null;
  hundreds?: number | null;
  fifties?: number | null;
  catches?: number | null;
  wicketkeeper_dismissals?: number | null;
  confidence?: StatConfidence;
  source_note?: string | null;
}

export interface UpdateTournamentAwardInput {
  id: string;
  award_name?: string;
  recipient_name?: string;
  recipient_player_slug?: string | null;
  recipient_team_id?: string | null;
  recipient_team_name?: string;
  stat_metric?: string | null;
  secondary_detail?: string | null;
  confidence?: StatConfidence;
  source_note?: string | null;
  sort_order?: number;
}

// ---------------------------------------------------------------------------
// Admin repository functions (Phase 5G)
// ---------------------------------------------------------------------------

/**
 * Fetch all player_season_stats and tournament_awards for the admin panel.
 * Optionally filter by seasonId.
 * Calls the secure /api/admin/stats route (service-role server-side).
 */
export async function getAllStatsAdmin(
  accessToken: string,
  seasonId?: string
): Promise<{
  stats: AdminPlayerSeasonStatRow[];
  awards: AdminTournamentAwardRow[];
  error: string | null;
}> {
  try {
    const url = seasonId
      ? `/api/admin/stats?season=${encodeURIComponent(seasonId)}`
      : "/api/admin/stats";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { stats: [], awards: [], error: json.error ?? "Failed to fetch statistics." };
    }
    return {
      stats: json.stats ?? [],
      awards: json.awards ?? [],
      error: null,
    };
  } catch {
    return { stats: [], awards: [], error: "Network error fetching statistics." };
  }
}

/**
 * Update an existing player_season_stats record.
 * Calls PUT /api/admin/stats with type='stat'.
 */
export async function updatePlayerSeasonStatAdmin(
  input: UpdatePlayerSeasonStatInput,
  accessToken: string
): Promise<{ stat: AdminPlayerSeasonStatRow | null; error: string | null }> {
  try {
    const res = await fetch("/api/admin/stats", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ...input, type: "stat" }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { stat: null, error: json.error ?? "Failed to update statistic." };
    }
    return { stat: json.stat ?? null, error: null };
  } catch {
    return { stat: null, error: "Network error updating statistic." };
  }
}

/**
 * Update an existing tournament_awards record.
 * Calls PUT /api/admin/stats with type='award'.
 */
export async function updateTournamentAwardAdmin(
  input: UpdateTournamentAwardInput,
  accessToken: string
): Promise<{ award: AdminTournamentAwardRow | null; error: string | null }> {
  try {
    const res = await fetch("/api/admin/stats", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ...input, type: "award" }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { award: null, error: json.error ?? "Failed to update award." };
    }
    return { award: json.award ?? null, error: null };
  } catch {
    return { award: null, error: "Network error updating award." };
  }
}

/**
 * Retrieve statistics dataset for a given season ("season-2" | "season-3") from Supabase (with static fallback)
 */
export async function getSeasonStats(seasonId: SeasonId = "season-2"): Promise<SeasonStatsDataset> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const staticFallbackDataset = getSeasonStatsData(seasonId);

      // 1. Fetch season metadata
      const { data: seasonRaw } = await client
        .from("seasons")
        .select("*")
        .eq("id", seasonId)
        .maybeSingle();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const seasonRow = seasonRaw as any;

      if (seasonRow) {
        // 2. Fetch team standings
        const { data: standingsRaw } = await client
          .from("team_seasons")
          .select("*, teams(*)")
          .eq("season_id", seasonId)
          .order("standing_position", { ascending: true, nullsFirst: false });

        // 3. Fetch awards if completed season
        const { data: awardRaw } = await client
          .from("tournament_awards")
          .select("*")
          .eq("season_id", seasonId)
          .order("sort_order", { ascending: true });

        // 4. Fetch player season stats
        const { data: statRaw } = await client
          .from("player_season_stats")
          .select("*")
          .eq("season_id", seasonId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const standingsRows = (standingsRaw || []) as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const awardRows = (awardRaw || []) as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statRows = (statRaw || []) as any[];

        const championTeam = seasonRow.champion_team_id
          ? getTeamBySlugSync(seasonRow.champion_team_id)
          : null;
        const runnerUpTeam = seasonRow.runner_up_team_id
          ? getTeamBySlugSync(seasonRow.runner_up_team_id)
          : null;

        const summary: TournamentSummary = {
          seasonId: seasonRow.id as SeasonId,
          name: seasonRow.name,
          shortName: seasonRow.short_name,
          edition: seasonRow.edition ?? "2025 Edition",
          dates: seasonRow.dates_display ?? "",
          startDate: seasonRow.start_date ?? "",
          endDate: seasonRow.end_date ?? "",
          venue: seasonRow.venue ?? "TU International Cricket Stadium",
          venueCity: seasonRow.venue_city ?? "Kirtipur, Kathmandu",
          teamsCount: seasonRow.total_teams,
          totalMatches: seasonRow.total_matches,
          leagueMatches: seasonRow.league_matches,
          playoffMatches: seasonRow.playoff_matches,
          format: seasonRow.format,
          pointsSystem: seasonRow.points_system ?? "Win: 2 pts, Tie/NR: 1 pt, Loss: 0 pts",
          champion: championTeam
            ? { teamId: championTeam.id, teamName: championTeam.name }
            : null,
          runnerUp: runnerUpTeam
            ? { teamId: runnerUpTeam.id, teamName: runnerUpTeam.name }
            : null,
          confidence: (seasonRow.confidence as "High" | "Medium" | "Low") ?? "High",
          confidenceNote: seasonRow.confidence_note ?? undefined,
        };

        const standings: FinalStandingsRow[] = standingsRows.map((row, idx) => {
          const teamObj = Array.isArray(row.teams) ? row.teams[0] : row.teams;
          const pos = row.standing_position ?? idx + 1;
          let qualification: FinalStandingsRow["qualification"];
          if (seasonId === "season-2") {
            if (pos === 1 || pos === 2) qualification = "Qualifier 1";
            else if (pos === 3 || pos === 4) qualification = "Eliminator";
            else qualification = "Eliminated";
          }
          return {
            position: pos,
            teamId: row.team_id,
            teamName: teamObj?.name ?? row.team_id,
            played: row.played,
            won: row.won,
            lost: row.lost,
            tied: null,
            noResult: row.no_result,
            points: row.points,
            netRunRate: row.net_run_rate,
            formattedNRR:
              row.net_run_rate !== null
                ? row.net_run_rate > 0
                  ? `+${row.net_run_rate.toFixed(3)}`
                  : row.net_run_rate.toFixed(3)
                : "—",
            qualification,
          };
        });

        const awards: TournamentAward[] = awardRows.map((row) => ({
          id: row.id,
          title: row.award_name,
          recipient: row.recipient_name,
          teamId: row.recipient_team_id ?? "",
          teamName: row.recipient_team_name,
          playerSlug: row.recipient_player_slug ?? undefined,
          detail: row.stat_metric ?? row.secondary_detail ?? "",
          confidence: row.confidence,
        }));

        const runsLeaderboard: LeaderboardItem[] = statRows
          .filter((r) => r.runs !== null)
          .sort((a, b) => (b.runs ?? 0) - (a.runs ?? 0))
          .map((r, idx) => ({
            rank: idx + 1,
            playerSlug: r.player_slug ?? undefined,
            playerName: r.player_name,
            teamId: r.team_id,
            teamName: r.team_name,
            value: r.runs ?? 0,
            metricLabel: "runs",
            secondaryDetail: r.highest_score ? `HS: ${r.highest_score}` : undefined,
          }));

        const wicketsLeaderboard: LeaderboardItem[] = statRows
          .filter((r) => r.wickets !== null)
          .sort((a, b) => (b.wickets ?? 0) - (a.wickets ?? 0))
          .map((r, idx) => ({
            rank: idx + 1,
            playerSlug: r.player_slug ?? undefined,
            playerName: r.player_name,
            teamId: r.team_id,
            teamName: r.team_name,
            value: r.wickets ?? 0,
            metricLabel: "wickets",
            secondaryDetail: r.best_bowling ? `BBI: ${r.best_bowling}` : undefined,
          }));

        const leaderboards: Leaderboards = {
          batting: {
            mostRuns: {
              title: "Most Runs",
              metric: "runs",
              items: runsLeaderboard.length > 0 ? runsLeaderboard : staticFallbackDataset.leaderboards.batting.mostRuns.items,
            },
          },
          bowling: {
            mostWickets: {
              title: "Most Wickets",
              metric: "wickets",
              items: wicketsLeaderboard.length > 0 ? wicketsLeaderboard : staticFallbackDataset.leaderboards.bowling.mostWickets.items,
            },
          },
        };

        const playerStatsList: PlayerSeasonStats[] = statRows.map((r) => ({
          id: r.id,
          playerName: r.player_name,
          playerSlug: r.player_slug ?? undefined,
          teamId: r.team_id,
          teamName: r.team_name,
          matches: r.matches,
          innings: r.innings,
          runs: r.runs,
          highestScore: r.highest_score ?? undefined,
          average: r.average ?? undefined,
          strikeRate: r.strike_rate ?? undefined,
          wickets: r.wickets,
          bestBowling: r.best_bowling ?? undefined,
          economy: r.economy ?? undefined,
          fours: r.fours ?? undefined,
          sixes: r.sixes ?? undefined,
          hundreds: r.hundreds ?? undefined,
          fifties: r.fifties ?? undefined,
          catches: r.catches ?? undefined,
          wicketkeeperDismissals: r.wicketkeeper_dismissals ?? undefined,
          confidence: r.confidence,
          sourceNote: r.source_note ?? undefined,
        }));

        return {
          seasonId,
          seasonName: seasonRow.name,
          year: seasonRow.year,
          status: seasonRow.status as SeasonStatus,
          summary,
          standings,
          awards,
          leaderboards,
          playerStats: playerStatsList.length > 0 ? playerStatsList : staticFallbackDataset.playerStats,
          playoffs: staticFallbackDataset.playoffs,
          verifiedLeagueMatches: staticFallbackDataset.verifiedLeagueMatches,
          integrity: staticFallbackDataset.integrity,
          preTournamentNotice: staticFallbackDataset.preTournamentNotice,
        };
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getSeasonStatsData(seasonId);
}

/**
 * Validate whether a string is a recognized SeasonId
 */
export function isValidSeasonId(id: string): id is SeasonId {
  return isValidSeasonIdData(id);
}

/**
 * Retrieve available tournament seasons for navigation / season picker
 */
export function getAvailableSeasons(): SeasonOption[] {
  return AVAILABLE_SEASONS_DATA;
}

/**
 * Cross-reference a player name to their canonical slug in players-data
 */
export function resolveCanonicalPlayerSlug(name: string): string | undefined {
  return resolveCanonicalPlayerSlugData(name);
}

/**
 * Resolve canonical franchise team slug from various historical name formats
 */
export function resolveCanonicalTeamSlug(teamRef: string): string {
  return resolveCanonicalTeamSlugData(teamRef);
}

/**
 * Resolve canonical franchise metadata for a team ID
 */
export function getTeamMeta(teamId: string): TeamDetail | undefined {
  return getTeamMetaData(teamId);
}

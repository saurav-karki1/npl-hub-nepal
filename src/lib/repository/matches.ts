/**
 * NPL Hub Nepal — Matches & Schedule Repository
 *
 * Abstracted data access layer for NPL fixtures, scorecards, standings, and tournament specs.
 * Primary source: Supabase database (`matches` & `seasons` tables).
 * Fallback source: Centralized static data (`schedule-data.ts`).
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  SCHEDULE_FIXTURES,
  ScheduleMatch,
  TournamentInfo,
  TOURNAMENT_INFO,
  MatchScoreDetails,
  MatchResultDetails,
  MatchTeamInfo,
  PlayoffPlaceholder,
  resolveMatchTeam,
  resolveMatchTeams,
  getMatchBySlug as getMatchBySlugData,
  getAdjacentMatches as getAdjacentMatchesData,
} from "@/lib/data/schedule-data";
import {
  StandingsData,
  StandingsRow,
  computeStandings as computeStandingsData,
  getStandings as getStandingsData,
} from "@/lib/data/standings";
import { TeamDetail } from "@/lib/data/teams-data";

export type {
  ScheduleMatch,
  TournamentInfo,
  MatchScoreDetails,
  MatchResultDetails,
  MatchTeamInfo,
  PlayoffPlaceholder,
  StandingsData,
  StandingsRow,
};

export { resolveMatchTeam, resolveMatchTeams, TOURNAMENT_INFO, SCHEDULE_FIXTURES };

/** Synchronous fallbacks for components requiring synchronous resolution */
export const getAllMatchesSync = (): ScheduleMatch[] => SCHEDULE_FIXTURES;
export const getMatchBySlugSync = getMatchBySlugData;
export const getAdjacentMatchesSync = getAdjacentMatchesData;
export const getMatchesByTeamSync = (teamId: string): ScheduleMatch[] =>
  SCHEDULE_FIXTURES.filter((m) => m.team1Id === teamId || m.team2Id === teamId);
export const getUpcomingMatchesSync = (limit?: number): ScheduleMatch[] => {
  const matches = SCHEDULE_FIXTURES.filter((m) => m.status === "upcoming" || m.status === "tba");
  return typeof limit === "number" ? matches.slice(0, limit) : matches;
};
export const getCompletedMatchesSync = (): ScheduleMatch[] =>
  SCHEDULE_FIXTURES.filter((m) => m.status === "completed");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseMatch(row: any): ScheduleMatch {
  const resultDetails: MatchResultDetails | undefined =
    row.winner_team_id || row.result_statement || row.winner_name
      ? {
          winnerId: row.winner_team_id ?? undefined,
          winnerName: row.winner_name ?? undefined,
          winMargin: row.win_margin ?? undefined,
          winType: row.win_type ?? undefined,
          statement: row.result_statement ?? undefined,
          playerOfTheMatch: row.player_of_the_match ?? undefined,
          tossWinner: row.toss_winner_team_id ?? undefined,
          tossDecision: row.toss_decision ?? undefined,
        }
      : undefined;

  return {
    id: row.id,
    matchNumber: row.match_number,
    stage: row.stage,
    team1Id: row.team1_id,
    team1Placeholder: row.team1_placeholder,
    team2Id: row.team2_id,
    team2Placeholder: row.team2_placeholder,
    date: row.match_date,
    formattedDate: row.formatted_date,
    bsDate: row.bs_date,
    bsDateNepali: row.bs_date_nepali,
    dayOfWeek: row.day_of_week,
    time: row.match_time,
    venue: row.venue,
    status: row.status,
    result: row.result ?? undefined,
    scores: row.scores ?? undefined,
    resultDetails,
    slug: row.slug,
    isProvisional: row.is_provisional ?? false,
  };
}

/**
 * Retrieve all 32 tournament fixtures from Supabase (with static fallback)
 */
export async function getAllMatches(): Promise<ScheduleMatch[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("matches")
        .select("*")
        .eq("season_id", "season-3")
        .order("match_number", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseMatch);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return SCHEDULE_FIXTURES;
}

/**
 * Retrieve a specific match by slug from Supabase (with static fallback)
 */
export async function getMatchBySlug(slug: string): Promise<ScheduleMatch | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("matches")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseMatch(data);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getMatchBySlugData(slug);
}

/**
 * Get adjacent fixtures for navigation (Previous Match / Next Match)
 */
export async function getAdjacentMatches(matchNumber: number): Promise<{
  prevMatch?: ScheduleMatch;
  nextMatch?: ScheduleMatch;
}> {
  const matches = await getAllMatches();
  const prevMatch = matches.find((m) => m.matchNumber === matchNumber - 1);
  const nextMatch = matches.find((m) => m.matchNumber === matchNumber + 1);
  return { prevMatch, nextMatch };
}

/**
 * Get all match slugs for Next.js generateStaticParams
 */
export async function getAllMatchSlugs(): Promise<{ slug: string }[]> {
  const matches = await getAllMatches();
  return matches.map((m) => ({ slug: m.slug }));
}

/**
 * Filter fixtures involving a given team ID
 */
export async function getMatchesByTeam(teamId: string): Promise<ScheduleMatch[]> {
  const matches = await getAllMatches();
  return matches.filter((m) => m.team1Id === teamId || m.team2Id === teamId);
}

/**
 * Retrieve upcoming scheduled fixtures
 */
export async function getUpcomingMatches(limit?: number): Promise<ScheduleMatch[]> {
  const matches = await getAllMatches();
  const upcoming = matches.filter((m) => m.status === "upcoming" || m.status === "tba");
  return typeof limit === "number" ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Retrieve completed match fixtures with scorecards/results
 */
export async function getCompletedMatches(): Promise<ScheduleMatch[]> {
  const matches = await getAllMatches();
  return matches.filter((m) => m.status === "completed");
}

/**
 * Retrieve the featured opening match for homepage hero highlights
 */
export async function getFeaturedUpcomingMatch(): Promise<ScheduleMatch | undefined> {
  const matches = await getAllMatches();
  return matches.find((m) => m.status === "upcoming") || matches[0];
}

/**
 * Retrieve tournament metadata factsheet from Supabase (with static fallback)
 */
export async function getTournamentInfo(): Promise<TournamentInfo> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data: rawData, error } = await client
        .from("seasons")
        .select("*")
        .eq("id", "season-3")
        .maybeSingle();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = rawData as any;

      if (!error && data) {
        return {
          name: data.name,
          season: `Season 3 / NPL ${data.year}`,
          edition: data.edition ?? "2026 Edition",
          format: data.format,
          country: "Nepal",
          organizer: "Cricket Association of Nepal (CAN)",
          totalTeams: data.total_teams,
          totalMatches: data.total_matches,
          primaryVenue: data.venue ?? "TU International Cricket Stadium, Kirtipur",
          status: data.status === "completed" ? "Completed" : data.status === "in-progress" ? "Live" : "Upcoming",
          projectedDates: data.dates_display ?? "28 November – 21 December 2026",
          isConfirmed: true,
        };
      }
    } catch {
      // Fall back to static metadata on error
    }
  }
  return TOURNAMENT_INFO;
}

/**
 * Retrieve current points table standings
 */
export function getStandings(): StandingsData {
  return getStandingsData();
}

/**
 * Dynamically recompute standings from custom fixtures/teams
 */
export function computeStandings(
  fixtures?: ScheduleMatch[],
  teams?: TeamDetail[]
): StandingsData {
  return computeStandingsData(fixtures, teams);
}

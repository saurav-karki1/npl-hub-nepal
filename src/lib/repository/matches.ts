/**
 * NPL Hub Nepal — Matches & Schedule Repository
 *
 * Abstracted data access layer for NPL fixtures, scorecards, standings, and tournament specs.
 * Public components consume this repository instead of direct static file imports.
 */

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
  getAllMatchSlugs as getAllMatchSlugsData,
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

/**
 * Retrieve all 32 tournament fixtures (28 preliminary league + 4 playoffs)
 */
export function getAllMatches(): ScheduleMatch[] {
  return SCHEDULE_FIXTURES;
}

/**
 * Retrieve a specific match by slug or match number
 */
export function getMatchBySlug(slug: string): ScheduleMatch | undefined {
  return getMatchBySlugData(slug);
}

/**
 * Get adjacent fixtures for navigation (Previous Match / Next Match)
 */
export function getAdjacentMatches(matchNumber: number): {
  prevMatch?: ScheduleMatch;
  nextMatch?: ScheduleMatch;
} {
  return getAdjacentMatchesData(matchNumber);
}

/**
 * Get all match slugs for Next.js generateStaticParams
 */
export function getAllMatchSlugs(): { slug: string }[] {
  return getAllMatchSlugsData();
}

/**
 * Filter fixtures involving a given team ID
 */
export function getMatchesByTeam(teamId: string): ScheduleMatch[] {
  return SCHEDULE_FIXTURES.filter(
    (m) => m.team1Id === teamId || m.team2Id === teamId
  );
}

/**
 * Retrieve upcoming scheduled fixtures
 */
export function getUpcomingMatches(limit?: number): ScheduleMatch[] {
  const matches = SCHEDULE_FIXTURES.filter((m) => m.status === "upcoming" || m.status === "tba");
  return typeof limit === "number" ? matches.slice(0, limit) : matches;
}

/**
 * Retrieve completed match fixtures with scorecards/results
 */
export function getCompletedMatches(): ScheduleMatch[] {
  return SCHEDULE_FIXTURES.filter((m) => m.status === "completed");
}

/**
 * Retrieve the featured opening match for homepage hero highlights
 */
export function getFeaturedUpcomingMatch(): ScheduleMatch | undefined {
  // Returns Match #1 (Opening Match) or first upcoming match
  return SCHEDULE_FIXTURES.find((m) => m.status === "upcoming") || SCHEDULE_FIXTURES[0];
}

/**
 * Retrieve tournament metadata factsheet
 */
export function getTournamentInfo(): TournamentInfo {
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

/**
 * NPL Hub Nepal — Statistics Repository
 *
 * Abstracted data access layer for multi-season statistics and historical records.
 * Public components consume this repository instead of direct static file imports.
 */

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

/**
 * Retrieve statistics dataset for a given season ("season-2" | "season-3")
 */
export function getSeasonStats(seasonId: SeasonId = "season-2"): SeasonStatsDataset {
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

export const AVAILABLE_SEASONS = AVAILABLE_SEASONS_DATA;

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

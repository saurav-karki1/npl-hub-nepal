/**
 * NPL Hub Nepal — Players Repository
 *
 * Abstracted data access layer for verified NPL players.
 * Public components consume this repository instead of direct static file imports.
 */

import {
  NPL_PLAYERS,
  Player,
  PlayerRole,
  PlayerStatus,
  PlayerConfidence,
  SeasonStats,
  getPlayerBySlug as getPlayerBySlugData,
  getPlayersByTeam as getPlayersByTeamData,
  getPlayersByRole as getPlayersByRoleData,
  getAllPlayers as getAllPlayersData,
  getAllPlayerSlugs as getAllPlayerSlugsData,
  getPlayerTeam as getPlayerTeamData,
} from "@/lib/data/players-data";
import { TeamDetail } from "@/lib/data/teams-data";

export type { Player, PlayerRole, PlayerStatus, PlayerConfidence, SeasonStats };
export { NPL_PLAYERS };

/**
 * Retrieve all verified NPL players
 */
export function getAllPlayers(): Player[] {
  return getAllPlayersData();
}

/**
 * Retrieve a player by their canonical slug identifier
 */
export function getPlayerBySlug(slug: string): Player | undefined {
  return getPlayerBySlugData(slug);
}

/**
 * Get all player slugs for Next.js generateStaticParams
 */
export function getAllPlayerSlugs(): { slug: string }[] {
  return getAllPlayerSlugsData();
}

/**
 * Get all players belonging to a specific team ID
 */
export function getPlayersByTeam(teamId: string): Player[] {
  return getPlayersByTeamData(teamId);
}

/**
 * Get all players with a specific cricket role
 */
export function getPlayersByRole(role: PlayerRole): Player[] {
  return getPlayersByRoleData(role);
}

/**
 * Resolve the canonical franchise team details for a given player
 */
export function getPlayerTeam(player: Player): TeamDetail | undefined {
  return getPlayerTeamData(player);
}

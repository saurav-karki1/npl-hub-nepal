/**
 * NPL Hub Nepal — Players Repository
 *
 * Abstracted data access layer for verified NPL players.
 * Primary source: Supabase database (`players` & `player_seasons` tables).
 * Fallback source: Centralized static data (`players-data.ts`).
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
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
} from "@/lib/data/players-data";
import { TeamDetail, getTeamBySlug } from "@/lib/repository/teams";

export type { Player, PlayerRole, PlayerStatus, PlayerConfidence, SeasonStats };
export { NPL_PLAYERS };

/** Synchronous fallbacks for backwards compatibility */
export const getAllPlayersSync = getAllPlayersData;
export const getPlayerBySlugSync = getPlayerBySlugData;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabasePlayer(row: any): Player {
  const ps = Array.isArray(row.player_seasons) ? row.player_seasons[0] : row.player_seasons;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    displayName: row.display_name ?? undefined,
    teamId: ps?.team_id ?? "",
    role: (ps?.role as PlayerRole) ?? "All-rounder",
    nationality: row.nationality ?? "Nepalese",
    battingStyle: row.batting_style ?? undefined,
    bowlingStyle: row.bowling_style ?? undefined,
    profileImage: row.profile_image ?? undefined,
    status: (ps?.status as PlayerStatus) ?? "confirmed",
    captain: ps?.captain ?? false,
    marquee: ps?.marquee ?? false,
    source: ps?.source ?? "Cricket Association of Nepal",
    sourceUrl: ps?.source_url ?? undefined,
    sourceDate: ps?.source_date ?? undefined,
    confidence: (ps?.confidence as PlayerConfidence) ?? "confirmed",
    bio: row.bio ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    birthPlace: row.birth_place ?? undefined,
    playerNumber: ps?.player_number ?? undefined,
  };
}

/**
 * Retrieve all verified NPL players from Supabase (with static fallback)
 */
export async function getAllPlayers(): Promise<Player[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("players")
        .select("*, player_seasons!inner(*)")
        .eq("player_seasons.season_id", "season-3");

      if (!error && data && data.length > 0) {
        return data.map(mapSupabasePlayer);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getAllPlayersData();
}

/**
 * Retrieve a player by their canonical slug identifier from Supabase (with static fallback)
 */
export async function getPlayerBySlug(slug: string): Promise<Player | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("players")
        .select("*, player_seasons!inner(*)")
        .eq("slug", slug)
        .eq("player_seasons.season_id", "season-3")
        .maybeSingle();

      if (!error && data) {
        return mapSupabasePlayer(data);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getPlayerBySlugData(slug);
}

/**
 * Get all player slugs for Next.js generateStaticParams
 */
export async function getAllPlayerSlugs(): Promise<{ slug: string }[]> {
  const players = await getAllPlayers();
  return players.map((p) => ({ slug: p.slug }));
}

/**
 * Get all players belonging to a specific team ID
 */
export async function getPlayersByTeam(teamId: string): Promise<Player[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("players")
        .select("*, player_seasons!inner(*)")
        .eq("player_seasons.season_id", "season-3")
        .eq("player_seasons.team_id", teamId);

      if (!error && data && data.length > 0) {
        return data.map(mapSupabasePlayer);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getPlayersByTeamData(teamId);
}

/**
 * Get all players with a specific cricket role
 */
export async function getPlayersByRole(role: PlayerRole): Promise<Player[]> {
  const players = await getAllPlayers();
  return players.filter((p) => p.role === role);
}

/**
 * Resolve the canonical franchise team details for a given player
 */
export async function getPlayerTeam(player: Player): Promise<TeamDetail | undefined> {
  return getTeamBySlug(player.teamId);
}

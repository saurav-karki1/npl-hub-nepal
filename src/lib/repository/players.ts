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

// ---------------------------------------------------------------------------
// Admin-specific types
// ---------------------------------------------------------------------------

export interface AdminPlayerSeasonRow {
  id: string;
  season_id: string;
  team_id: string;
  role: PlayerRole;
  status: PlayerStatus;
  captain: boolean;
  marquee: boolean;
  player_number: number | null;
  confidence: PlayerConfidence;
  source: string | null;
  source_url: string | null;
  source_date: string | null;
  teams?: {
    id: string;
    slug: string;
    name: string;
    short_name: string;
    initials: string;
    brand_color: string;
    crest_bg: string;
    crest_text: string;
  } | null;
}

export interface AdminPlayerRow {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  nationality: string;
  date_of_birth: string | null;
  birth_place: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  profile_image: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  player_seasons: AdminPlayerSeasonRow[];
}

export interface UpdatePlayerInput {
  playerId: string;
  seasonId: string;
  // Core player fields
  name?: string;
  displayName?: string | null;
  nationality?: string;
  dateOfBirth?: string | null;
  birthPlace?: string | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  // Season association fields
  teamId?: string;
  role?: PlayerRole;
  status?: PlayerStatus;
  captain?: boolean;
  marquee?: boolean;
  playerNumber?: number | null;
  confidence?: PlayerConfidence;
  source?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | null;
}

/** Get all players (with season data and team info) for the admin panel via secure API route */
export async function getAllPlayersAdmin(
  accessToken: string
): Promise<{ players: AdminPlayerRow[] | null; error: string | null }> {
  try {
    const res = await fetch("/api/admin/players", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { players: null, error: json.error ?? "Failed to load players." };
    }
    return { players: json.players as AdminPlayerRow[], error: null };
  } catch {
    return { players: null, error: "Network error. Could not reach the admin API." };
  }
}

/** Update a player's core profile and/or season-specific role/team via secure API route */
export async function updatePlayerAdmin(
  input: UpdatePlayerInput,
  accessToken: string
): Promise<{ player: AdminPlayerRow | null; error: string | null }> {
  try {
    const res = await fetch("/api/admin/players", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) {
      return { player: null, error: json.error ?? "Update failed." };
    }
    return { player: json.player as AdminPlayerRow, error: null };
  } catch {
    return { player: null, error: "Network error. Could not reach the admin API." };
  }
}

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

/**
 * NPL Hub Nepal — Teams Repository
 *
 * Abstracted data access layer for NPL franchise teams.
 * Primary source: Supabase database (`teams` & `team_seasons` tables).
 * Fallback source: Centralized static data (`teams-data.ts`).
 *
 * Admin write functions call the secure /api/admin/teams API route
 * (server-side, service-role key) — never Supabase directly from UI.
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  NPL_TEAM_DETAILS,
  TeamDetail,
  CaptainConfidence,
  getTeamBySlug as getTeamBySlugData,
  getAllTeams as getAllTeamsData,
} from "@/lib/data/teams-data";

export type { TeamDetail, CaptainConfidence };
export { NPL_TEAM_DETAILS };

// ---------------------------------------------------------------------------
// Admin-specific types
// ---------------------------------------------------------------------------

export interface AdminTeamSeasonRow {
  id: string;
  season_id: string;
  captain_name: string | null;
  captain_confidence: "confirmed" | "reported" | null;
  captain_source: string | null;
  coach: string | null;
  squad_status: string | null;
  standing_position: number | null;
  played: number;
  won: number;
  lost: number;
  no_result: number;
  points: number;
}

export interface AdminTeamRow {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  initials: string;
  region: string;
  city: string;
  brand_color: string;
  brand_bg: string;
  crest_bg: string;
  crest_text: string;
  logo_url: string | null;
  established: string | null;
  description: string | null;
  updated_at: string;
  team_seasons: AdminTeamSeasonRow[];
}

export interface UpdateTeamInput {
  teamId: string;
  seasonId: string;
  // Core team fields
  name?: string;
  shortName?: string;
  initials?: string;
  region?: string;
  city?: string;
  brandColor?: string;
  brandBg?: string;
  crestBg?: string;
  crestText?: string;
  logoUrl?: string | null;
  established?: string;
  description?: string;
  // Season-specific fields
  captainName?: string;
  captainConfidence?: "confirmed" | "reported";
  captainSource?: string;
  coach?: string;
  squadStatus?: string;
}

/** Get all teams (with all season data) for the admin panel via secure API route */
export async function getAllTeamsAdmin(
  accessToken: string
): Promise<{ teams: AdminTeamRow[] | null; error: string | null }> {
  try {
    const res = await fetch("/api/admin/teams", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { teams: null, error: json.error ?? "Failed to load teams." };
    }
    return { teams: json.teams as AdminTeamRow[], error: null };
  } catch {
    return { teams: null, error: "Network error. Could not reach the admin API." };
  }
}

/** Update a team's core fields and/or season-specific fields via secure API route */
export async function updateTeamAdmin(
  input: UpdateTeamInput,
  accessToken: string
): Promise<{ team: AdminTeamRow | null; error: string | null }> {
  try {
    const res = await fetch("/api/admin/teams", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) {
      return { team: null, error: json.error ?? "Update failed." };
    }
    return { team: json.team as AdminTeamRow, error: null };
  } catch {
    return { team: null, error: "Network error. Could not reach the admin API." };
  }
}

/** Synchronous fallbacks for components that require synchronous resolution */
export const getAllTeamsSync = getAllTeamsData;
export const getTeamBySlugSync = getTeamBySlugData;
export const getTeamByIdSync = getTeamBySlugData;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseTeam(row: any): TeamDetail {
  const ts = Array.isArray(row.team_seasons) ? row.team_seasons[0] : row.team_seasons;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    initials: row.initials,
    region: row.region,
    city: row.city,
    brandColor: row.brand_color,
    brandBg: row.brand_bg,
    crestBg: row.crest_bg,
    crestText: row.crest_text,
    logoUrl: row.logo_url ?? undefined,
    captain: ts?.captain_name ?? "To be announced",
    captainConfidence: (ts?.captain_confidence as CaptainConfidence) ?? "reported",
    captainSource: ts?.captain_source ?? "Unconfirmed",
    captainConfirmedAt: ts?.captain_confirmed_at ?? null,
    coach: ts?.coach ?? "Not yet available",
    squadStatus: ts?.squad_status ?? "Squad to be announced",
    established: row.established ?? "2024",
    description: row.description ?? "",
  };
}

/**
 * Retrieve all 8 official NPL franchise teams from Supabase (with static fallback)
 */
export async function getAllTeams(): Promise<TeamDetail[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("teams")
        .select("*, team_seasons!inner(*)")
        .eq("team_seasons.season_id", "season-3");

      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseTeam);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getAllTeamsData();
}

/**
 * Retrieve a franchise team by its canonical slug or ID from Supabase (with static fallback)
 */
export async function getTeamBySlug(slug: string): Promise<TeamDetail | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("teams")
        .select("*, team_seasons!inner(*)")
        .eq("slug", slug)
        .eq("team_seasons.season_id", "season-3")
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseTeam(data);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getTeamBySlugData(slug);
}

/**
 * Alias for getTeamBySlug
 */
export async function getTeamById(id: string): Promise<TeamDetail | undefined> {
  return getTeamBySlug(id);
}

/**
 * Get all team slugs for Next.js generateStaticParams
 */
export async function getAllTeamSlugs(): Promise<{ slug: string }[]> {
  const teams = await getAllTeams();
  return teams.map((t) => ({ slug: t.slug }));
}

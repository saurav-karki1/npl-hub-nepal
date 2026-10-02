/**
 * NPL Hub Nepal — Teams Repository
 *
 * Abstracted data access layer for NPL franchise teams.
 * Primary source: Supabase database (`teams` & `team_seasons` tables).
 * Fallback source: Centralized static data (`teams-data.ts`).
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

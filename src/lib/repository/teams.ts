/**
 * NPL Hub Nepal — Teams Repository
 *
 * Abstracted data access layer for NPL franchise teams.
 * Public components consume this repository instead of direct static file imports.
 */

import {
  NPL_TEAM_DETAILS,
  TeamDetail,
  CaptainConfidence,
  getTeamBySlug as getTeamBySlugData,
  getAllTeams as getAllTeamsData,
} from "@/lib/data/teams-data";

export type { TeamDetail, CaptainConfidence };
export { NPL_TEAM_DETAILS };

/**
 * Retrieve all 8 official NPL franchise teams ordered for directories
 */
export function getAllTeams(): TeamDetail[] {
  return getAllTeamsData();
}

/**
 * Retrieve a franchise team by its canonical slug or ID (e.g. "lumbini-lions")
 */
export function getTeamBySlug(slug: string): TeamDetail | undefined {
  return getTeamBySlugData(slug);
}

/**
 * Alias for getTeamBySlug
 */
export function getTeamById(id: string): TeamDetail | undefined {
  return getTeamBySlugData(id);
}

/**
 * Get all team slugs for Next.js generateStaticParams
 */
export function getAllTeamSlugs(): { slug: string }[] {
  return NPL_TEAM_DETAILS.map((t) => ({ slug: t.slug }));
}

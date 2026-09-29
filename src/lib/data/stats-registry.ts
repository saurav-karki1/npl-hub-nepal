/**
 * NPL Hub Nepal — Statistics Registry & Multi-Season Loader
 *
 * Central registry for querying season statistics datasets.
 * Future live backend or Admin Panel will seamlessly plug into this interface.
 */

import { SeasonId, SeasonStatsDataset } from "./stats-types";
import { SEASON_2_STATS_DATASET } from "./stats-season2-data";
import { SEASON_3_STATS_DATASET } from "./stats-season3-data";
import { NPL_PLAYERS } from "./players-data";
import { TeamDetail, getTeamBySlug } from "./teams-data";

export interface SeasonOption {
  id: SeasonId;
  name: string;
  shortName: string;
  year: number;
  status: "completed" | "pre-tournament";
  badgeText: string;
}

export const AVAILABLE_SEASONS: SeasonOption[] = [
  {
    id: "season-2",
    name: "NPL Season 2 (2025)",
    shortName: "Season 2 — 2025",
    year: 2025,
    status: "completed",
    badgeText: "Verified Historical",
  },
  {
    id: "season-3",
    name: "NPL Season 3 (2026)",
    shortName: "Season 3 — 2026",
    year: 2026,
    status: "pre-tournament",
    badgeText: "Pre-Tournament",
  },
];

/** Lookup statistics dataset by season id */
export function getSeasonStats(seasonId: SeasonId = "season-2"): SeasonStatsDataset {
  switch (seasonId) {
    case "season-2":
      return SEASON_2_STATS_DATASET;
    case "season-3":
      return SEASON_3_STATS_DATASET;
    default:
      return SEASON_2_STATS_DATASET;
  }
}

/** Check if a given string is a valid season id */
export function isValidSeasonId(id: string): id is SeasonId {
  return id === "season-2" || id === "season-3";
}

/**
 * Resolves whether a player from a historical statistics dataset matches
 * a canonical player in `players-data.ts`.
 * Returns the player's canonical slug if found, or undefined.
 */
export function resolveCanonicalPlayerSlug(name: string): string | undefined {
  const normalized = name.trim().toLowerCase();

  // Known canonical aliases from PDF
  if (normalized === "rohit kumar paudel" || normalized === "rohit paudel") {
    return "rohit-paudel";
  }
  if (normalized === "sandeep lamichhane") {
    return "sandeep-lamichhane";
  }
  if (normalized === "sher malla") {
    return "sher-malla";
  }

  // General search across canonical players list
  const found = NPL_PLAYERS.find(
    (p) =>
      p.name.toLowerCase() === normalized ||
      (p.displayName && p.displayName.toLowerCase() === normalized)
  );

  return found?.slug;
}

/**
 * Resolves a team slug from various naming conventions, handling
 * historical franchise naming:
 * - Season 1: Kathmandu Gurkhas
 * - Season 2: Kathmandu Gorkhas (kathmandu-gorkhas)
 * - Season 3: Kathmandu Gorkhas (kathmandu-gorkhas)
 * - Sudur Paschim Royals / Sudurpaschim Royals -> sudurpaschim-royals
 */
export function resolveCanonicalTeamSlug(teamRef: string): string {
  const normalized = teamRef.trim().toLowerCase().replace(/[\s_]+/g, "-");

  if (normalized.includes("sudur-paschim") || normalized.includes("sudurpaschim")) {
    return "sudurpaschim-royals";
  }
  if (normalized.includes("kathmandu-gurkhas") || normalized.includes("kathmandu-gorkhas")) {
    return "kathmandu-gorkhas";
  }
  if (normalized.includes("biratnagar")) {
    return "biratnagar-kings";
  }
  if (normalized.includes("chitwan")) {
    return "chitwan-rhinos";
  }
  if (normalized.includes("janakpur")) {
    return "janakpur-bolts";
  }
  if (normalized.includes("karnali")) {
    return "karnali-yaks";
  }
  if (normalized.includes("lumbini")) {
    return "lumbini-lions";
  }
  if (normalized.includes("pokhara")) {
    return "pokhara-avengers";
  }

  // Exact slug match fallback
  const team = getTeamBySlug(teamRef);
  return team ? team.slug : teamRef;
}

/** Helper to get team metadata by team ID or slug */
export function getTeamMeta(teamId: string): TeamDetail | undefined {
  const canonicalSlug = resolveCanonicalTeamSlug(teamId);
  return getTeamBySlug(canonicalSlug);
}

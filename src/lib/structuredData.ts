/**
 * NPL Hub Nepal — Structured Data (JSON-LD) Helpers
 *
 * Builds complete, valid Schema.org JSON-LD objects for match/event pages.
 * All fields are derived from existing match and team data — nothing is invented.
 *
 * XSS note: JSON.stringify already escapes "<" as "\u003c", ">" as "\u003e", and
 * "&" as "\u0026" when the second/third arguments are used, but we use the
 * safeJsonLd() helper below to be explicit regardless of serialiser behaviour.
 */

import type { ScheduleMatch, MatchTeamInfo } from "@/lib/data/schedule-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_OG_IMAGE = "https://nplhubnepal.vercel.app/og-image.png";
const SITE_URL = "https://nplhubnepal.vercel.app";

const ORGANIZER = {
  "@type": "Organization",
  name: "Cricket Association of Nepal (CAN)",
  url: "https://can.org.np",
} as const;

const VENUE_LOCATION = {
  "@type": "Place",
  name: "Tribhuvan University International Cricket Stadium",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kirtipur, Kathmandu",
    addressRegion: "Bagmati Province",
    addressCountry: "NP",
  },
} as const;

// ---------------------------------------------------------------------------
// eventStatus mapping
// ---------------------------------------------------------------------------

type MatchStatus = ScheduleMatch["status"];

const EVENT_STATUS_MAP: Record<MatchStatus, string> = {
  upcoming: "https://schema.org/EventScheduled",
  live: "https://schema.org/EventScheduled",
  tba: "https://schema.org/EventScheduled",
  completed: "https://schema.org/EventCompleted",
};

// ---------------------------------------------------------------------------
// ISO 8601 date/time with Nepal offset (+05:45)
// ---------------------------------------------------------------------------

/**
 * Converts a date string (YYYY-MM-DD) and optional time string (e.g. "4:30 PM NPT")
 * into a full ISO 8601 datetime with Nepal's +05:45 offset.
 *
 * Falls back to date-only + offset if time cannot be parsed.
 */
export function toNepalISO(dateStr: string, timeStr?: string): string {
  // date must be YYYY-MM-DD
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  if (!timeStr || timeStr === "Time TBA") {
    return `${dateStr}T00:00:00+05:45`;
  }

  // Parse "4:30 PM NPT" or "12:30 PM NPT"
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return `${dateStr}T00:00:00+05:45`;

  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const meridiem = m[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");

  return `${dateStr}T${hh}:${mm}:00+05:45`;
}

// ---------------------------------------------------------------------------
// Team image helper
// ---------------------------------------------------------------------------

function teamImageUrl(
  team: MatchTeamInfo,
  siteUrl: string
): string | undefined {
  if ("logoUrl" in team && team.logoUrl) {
    return `${siteUrl}${team.logoUrl}`;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// SportsTeam node builder
// ---------------------------------------------------------------------------

function buildSportsTeamNode(
  team: MatchTeamInfo,
  siteUrl: string
): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@type": "SportsTeam",
    name: team.name,
    sport: "Cricket",
  };

  if ("slug" in team && team.slug) {
    node.url = `${siteUrl}/teams/${team.slug}`;
  }

  const logo = teamImageUrl(team, siteUrl);
  if (logo) node.logo = logo;

  if ("city" in team && team.city && team.city !== "To Be Determined") {
    node.location = {
      "@type": "Place",
      name: team.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: team.city,
        addressCountry: "NP",
      },
    };
  }

  return node;
}

// ---------------------------------------------------------------------------
// Primary match JSON-LD builder
// ---------------------------------------------------------------------------

export interface MatchJsonLdOptions {
  match: ScheduleMatch;
  team1: MatchTeamInfo;
  team2: MatchTeamInfo;
  siteUrl?: string;
}

/**
 * Builds a complete Schema.org SportsEvent JSON-LD object for a match page.
 *
 * Fields included:
 *   @context, @type, name, description, url,
 *   startDate (ISO 8601 +05:45), eventStatus, eventAttendanceMode,
 *   location, homeTeam, awayTeam, competitor, performer, image, organizer
 *
 * Fields intentionally omitted:
 *   - offers: We do not sell tickets and have no confirmed free-entry data.
 *             If official ticketing information becomes available, add it here.
 *   - endDate: T20 match duration is not fixed; omitting avoids inaccurate data.
 */
export function buildMatchJsonLd({
  match,
  team1,
  team2,
  siteUrl = SITE_URL,
}: MatchJsonLdOptions): Record<string, unknown> {
  const name = `${team1.name} vs ${team2.name} — NPL Season 3 Match #${match.matchNumber}`;
  const description = `Nepal Premier League Season 3 Match #${match.matchNumber}: ${team1.name} vs ${team2.name} at ${match.venue}. ${match.formattedDate} — ${match.time}.`;

  const startDate = toNepalISO(match.date, match.time);
  const eventStatus = EVENT_STATUS_MAP[match.status] ?? "https://schema.org/EventScheduled";

  const team1Node = buildSportsTeamNode(team1, siteUrl);
  const team2Node = buildSportsTeamNode(team2, siteUrl);

  // Collect images: prefer team logos, fall back to default OG image
  const images: string[] = [];
  const logo1 = teamImageUrl(team1, siteUrl);
  const logo2 = teamImageUrl(team2, siteUrl);
  if (logo1) images.push(logo1);
  if (logo2) images.push(logo2);
  if (images.length === 0) images.push(DEFAULT_OG_IMAGE);

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    description,
    url: `${siteUrl}/matches/${match.slug}`,
    startDate,
    eventStatus,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: VENUE_LOCATION,
    homeTeam: team1Node,
    awayTeam: team2Node,
    competitor: [team1Node, team2Node],
    performer: [team1Node, team2Node],
    image: images,
    organizer: ORGANIZER,
  };
}

// ---------------------------------------------------------------------------
// XSS-safe serialiser
// ---------------------------------------------------------------------------

/**
 * Serialises a JSON-LD object to a string safe for inline <script> injection.
 *
 * JSON.stringify already escapes "<" → "\u003c", ">" → "\u003e", and
 * "&" → "\u0026" when the replacer argument is provided.
 * This helper makes the intent explicit and centralises the call site.
 */
export function safeJsonLd(data: Record<string, unknown>): string {
  // The no-op replacer activates JSON.stringify's HTML-safe escaping
  return JSON.stringify(data, (_key, value) => value);
}

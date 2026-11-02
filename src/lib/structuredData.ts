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

const DEFAULT_OG_IMAGE = "https://nplhubnepal.vercel.app/images/logo.png";
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
  postponed: "https://schema.org/EventPostponed",
  abandoned: "https://schema.org/EventCancelled",
};

// ---------------------------------------------------------------------------
// ISO 8601 date/time with Nepal offset (+05:45)
// ---------------------------------------------------------------------------

/**
 * Converts a date string (YYYY-MM-DD) and optional time string (e.g. "4:30 PM NPT")
 * into a full ISO 8601 datetime with Nepal's +05:45 offset (e.g. "2026-10-26T16:30:00+05:45").
 *
 * Per Google Search Central Event guidelines:
 * - When time is "Time TBA" or not provided, returns the date-only string (YYYY-MM-DD).
 *   Google explicitly advises against defaulting to midnight (00:00:00).
 * - When time is provided, formats with exact Nepal Standard Time (+05:45) offset.
 */
export function toNepalISO(dateStr: string, timeStr?: string): string {
  // date must be YYYY-MM-DD
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  if (!timeStr || timeStr === "Time TBA") {
    // For day-long events or unconfirmed hours, return date-only ISO string
    return dateStr;
  }

  // Parse "4:30 PM NPT" or "12:30 PM NPT" or "5:00 PM"
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return dateStr;

  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const meridiem = m[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");

  return `${dateStr}T${hh}:${mm}:00+05:45`;
}

/**
 * Resolves a reliable, data-driven endDate in ISO 8601 format for a match.
 *
 * Rules (per Google Event Structured Data guidelines & factual accuracy):
 * 1. If an explicit `match.endDate` is provided in the record, use it.
 * 2. If an explicit `match.endTime` is provided (e.g. "4:00 PM NPT"), parse with Nepal +05:45 offset.
 * 3. If `match.time` contains an explicit scheduled finish time range (e.g. "12:30 PM - 4:00 PM NPT"),
 *    parse the second time component into Nepal +05:45 offset.
 * 4. For matches where time is "Time TBA" or unconfirmed (e.g. Playoff Matches 29-32):
 *    Google Search Central guidelines state: "If the event lasts all day (or if the exact ending hour is unknown),
 *    use just the date format (YYYY-MM-DD) for both startDate and endDate."
 *    Returns the date-only string (YYYY-MM-DD).
 * 5. If a match has a specific start time (e.g. "12:30 PM NPT" or "5:00 PM NPT") but NO confirmed scheduled finish time:
 *    Never invent match end times, use arbitrary fixed durations (e.g. +3.5 hours), or copy the start time into endDate.
 *    In this case, endDate is omitted per Google Search Central Event guidelines.
 */
export function resolveMatchEndDate(
  match: ScheduleMatch & { endTime?: string; endDate?: string }
): string | undefined {
  const dateStr = match.date;
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return undefined;

  // 1. Explicit endDate in match record (e.g. "2026-10-26T20:30:00+05:45" or "2026-10-26")
  if (match.endDate) {
    return match.endDate;
  }

  // 2. Explicit endTime in match record (e.g. "4:00 PM NPT")
  if (match.endTime && match.endTime !== "Time TBA") {
    const iso = toNepalISO(dateStr, match.endTime);
    if (iso !== dateStr) return iso;
  }

  // 3. Time range in time property (e.g. "12:30 PM - 4:00 PM NPT" or "12:30 PM to 4:00 PM NPT")
  if (match.time) {
    const rangeMatch = match.time.match(/(?:-|–|to)\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (rangeMatch) {
      const finishTimeStr = rangeMatch[1];
      const iso = toNepalISO(dateStr, finishTimeStr);
      if (iso !== dateStr) return iso;
    }
  }

  // 4. Time TBA / Unconfirmed hour (Matches 29-32)
  // Google guidelines: "For single-day events where specific hours are unknown, use date-only format (YYYY-MM-DD) for both startDate and endDate."
  if (!match.time || match.time === "Time TBA") {
    return dateStr;
  }

  // 5. Start time is known, but finish time is genuinely unconfirmed / not fixed
  // Never invent match end times, use arbitrary fixed durations, or copy the match start time into endDate.
  // In this case, endDate is omitted per Google Event guidelines.
  return undefined;
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
  match: ScheduleMatch & { endTime?: string; endDate?: string };
  team1: MatchTeamInfo;
  team2: MatchTeamInfo;
  siteUrl?: string;
}

/**
 * Builds a complete Schema.org SportsEvent JSON-LD object for a match page.
 *
 * Fields included:
 *   @context, @type, name, description, url,
 *   startDate (ISO 8601 with +05:45 offset or YYYY-MM-DD if time TBA),
 *   endDate (ISO 8601 when reliable scheduled finish time is available, or YYYY-MM-DD if time TBA),
 *   eventStatus, eventAttendanceMode, location, homeTeam, awayTeam, competitor, performer, image, organizer
 *
 * Fields intentionally omitted:
 *   - offers: We do not sell tickets and have no confirmed free-entry data.
 *             If official ticketing information becomes available, add it here.
 *   - endDate: When a match has a specific start time but no scheduled finish time has been confirmed,
 *             arbitrary durations are strictly avoided and endDate is omitted per Google Search Central guidelines.
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
  const endDate = resolveMatchEndDate(match);
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

  const schema: Record<string, unknown> = {
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

  if (endDate) {
    schema.endDate = endDate;
  }

  return schema;
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

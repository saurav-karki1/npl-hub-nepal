/**
 * NPL Hub Nepal — Match Countdown Engine
 *
 * Pure, side-effect-free functions for determining which match to count
 * down to and computing remaining time. No React imports — safe to use
 * in both client and server contexts (only the countdown component needs
 * to run it in a setInterval).
 *
 * Nepal Standard Time = UTC + 05:45 = UTC + 345 minutes.
 */

import type { ScheduleMatch } from "@/lib/data/schedule-data";

// ---------------------------------------------------------------------------
// Nepal time helpers
// ---------------------------------------------------------------------------

/** Nepal Standard Time offset from UTC in milliseconds (+05:45) */
export const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

/**
 * Returns the current wall-clock time in Nepal as a Date object whose
 * .getUTCFullYear() / .getUTCMonth() / etc. reflect local Nepal values.
 * We never rely on the visitor's system timezone.
 */
export function nowInNepal(nowMs: number = Date.now()): Date {
  return new Date(nowMs + NPT_OFFSET_MS);
}

/**
 * Parses a match's date + time into an absolute UTC millisecond timestamp.
 *
 * - `dateStr` is "YYYY-MM-DD" (ISO)
 * - `timeStr` is "4:30 PM NPT" or "12:30 PM NPT" or "Time TBA"
 *
 * Returns null if the time is TBA (cannot compute an absolute moment).
 */
export function parseMatchStartMs(
  dateStr: string,
  timeStr: string
): number | null {
  if (!timeStr || timeStr === "Time TBA") return null;

  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;

  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const meridiem = m[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  // Build an ISO string treated as Nepal local time, then convert to UTC
  const isoNepal = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:45`;
  const d = new Date(isoNepal);
  return isNaN(d.getTime()) ? null : d.getTime();
}

// ---------------------------------------------------------------------------
// Match state
// ---------------------------------------------------------------------------

/**
 * A T20 match is typically ~3–4 hours. We consider a match "live" for up to
 * 4 hours after its scheduled start, then move on to the next fixture.
 */
const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;

// Final stage check handled in resolveCountdownState

export type CountdownState =
  | { type: "season_complete" }              // after the final
  | { type: "live"; match: ScheduleMatch }   // match in progress
  | { type: "today"; match: ScheduleMatch; otherToday: ScheduleMatch[] } // match today
  | { type: "kickoff"; match: ScheduleMatch } // first match of the season
  | { type: "next"; match: ScheduleMatch }   // regular next match
  | { type: "tba"; match: ScheduleMatch }    // next match but time not known

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function computeTimeRemaining(targetMs: number, nowMs: number): TimeRemaining {
  const totalMs = Math.max(0, targetMs - nowMs);
  const totalSecs = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  return { days, hours, minutes, seconds, totalMs };
}

/**
 * Determines which match to focus on and what state to display.
 *
 * Logic (evaluated in order):
 * 1. If all matches are completed → season_complete
 * 2. Scan matches in order for the first one that hasn't ended (start + 4h in future):
 *    a. If its start time is still in the future → check today/kickoff/next/tba
 *    b. If its start time has passed but within 4h window → live
 */
export function resolveCountdownState(
  matches: ScheduleMatch[],
  nowMs: number = Date.now()
): CountdownState {
  const npt = nowInNepal(nowMs);
  const todayNPT = `${npt.getUTCFullYear()}-${String(npt.getUTCMonth() + 1).padStart(2, "0")}-${String(npt.getUTCDate()).padStart(2, "0")}`;

  // Find the "active" match: the first one that either hasn't started or is live
  let focusMatch: ScheduleMatch | null = null;
  let isLive = false;

  for (const match of matches) {
    const startMs = parseMatchStartMs(match.date, match.time);

    if (startMs === null) {
      // TBA — treat as future if date hasn't passed midnight NPT
      const matchDateEnd = new Date(`${match.date}T23:59:59+05:45`).getTime();
      if (nowMs <= matchDateEnd) {
        focusMatch = match;
        break;
      }
      continue;
    }

    const endMs = startMs + LIVE_WINDOW_MS;

    if (nowMs < startMs) {
      // Match hasn't started → this is our target
      focusMatch = match;
      break;
    }

    if (nowMs >= startMs && nowMs <= endMs) {
      // Match started and within live window
      focusMatch = match;
      isLive = true;
      break;
    }

    // nowMs > endMs → match has concluded, continue to next
  }

  if (!focusMatch) {
    // All matches concluded
    return { type: "season_complete" };
  }

  if (isLive) {
    return { type: "live", match: focusMatch };
  }

  const startMs = parseMatchStartMs(focusMatch.date, focusMatch.time);

  // TBA time
  if (startMs === null) {
    return { type: "tba", match: focusMatch };
  }

  // 1. Before the first match of the season
  const isFirstMatch = matches[0]?.id === focusMatch.id;
  if (isFirstMatch) {
    return { type: "kickoff", match: focusMatch };
  }

  // 2. Later in the season, if the next match is today in NPT
  const isToday = focusMatch.date === todayNPT;
  if (isToday) {
    // Find other matches also today (excluding the focus match, upcoming or tba)
    const otherToday = matches.filter(
      (m) => m.id !== focusMatch!.id && m.date === todayNPT
    );
    return { type: "today", match: focusMatch, otherToday };
  }

  // 3. Otherwise
  return { type: "next", match: focusMatch };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Human-readable "Starts in X days, Y hours" for screen readers.
 * Updates once per minute (we memoize at the call site).
 */
export function accessibleCountdownLabel(tr: TimeRemaining): string {
  if (tr.totalMs <= 0) return "Starting now";
  const parts: string[] = [];
  if (tr.days > 0) parts.push(`${tr.days} day${tr.days !== 1 ? "s" : ""}`);
  if (tr.hours > 0) parts.push(`${tr.hours} hour${tr.hours !== 1 ? "s" : ""}`);
  if (tr.days === 0 && tr.minutes > 0)
    parts.push(`${tr.minutes} minute${tr.minutes !== 1 ? "s" : ""}`);
  return parts.length ? `Starts in ${parts.join(", ")}` : "Starting imminently";
}

/** Format a match's date/time for display: "Mon, 26 Oct 2026 · 4:30 PM NPT" */
export function formatMatchDisplay(match: ScheduleMatch): string {
  const time = match.time === "Time TBA" ? "Time to be announced" : match.time;
  const shortDate = match.formattedDate
    .replace("October", "Oct")
    .replace("November", "Nov")
    .replace("December", "Dec");
  return `${match.dayOfWeek.slice(0, 3)}, ${shortDate} · ${time}`;
}

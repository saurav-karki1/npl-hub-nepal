/**
 * NPL Hub Nepal — Nepal Standard Time (NPT / Asia/Kathmandu) Date & Schedule Helpers
 *
 * Provides timezone-resilient date calculation for tournament match scheduling,
 * today's match resolution, Bikram Sambat dual-calendar display, and countdown sync.
 *
 * Nepal Standard Time is UTC +05:45 (strictly 345 minutes ahead of UTC).
 */

import NepaliDate from "nepali-date-converter";
import type { ScheduleMatch } from "@/lib/data/schedule-data";

export const NEPAL_TIMEZONE = "Asia/Kathmandu";

/**
 * Returns current date string in Nepal timezone formatted as 'YYYY-MM-DD'.
 */
export function getNepalDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NEPAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Returns current formatted Nepal time string (e.g. "10:30 AM NPT").
 */
export function getNepalTimeString(now: Date = new Date()): string {
  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: NEPAL_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  return `${timePart} NPT`;
}

/**
 * Returns complete Nepal date breakdown in Gregorian and Bikram Sambat (BS 2083).
 */
export function getNepalDateDetails(now: Date = new Date()): {
  isoDate: string;
  formattedGregorian: string;
  dayOfWeek: string;
  bsDate: string;
  bsDateNepali: string;
} {
  const isoDate = getNepalDateString(now);
  const [yearStr, monthStr, dayStr] = isoDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const dayOfWeek = new Intl.DateTimeFormat("en-US", {
    timeZone: NEPAL_TIMEZONE,
    weekday: "long",
  }).format(now);

  const formattedGregorian = new Intl.DateTimeFormat("en-US", {
    timeZone: NEPAL_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  let bsDate = "";
  let bsDateNepali = "";

  try {
    const nepaliDate = new NepaliDate(new Date(year, month - 1, day));
    const bsYear = nepaliDate.getYear();
    const bsMonth = nepaliDate.getMonth(); // 0-indexed
    const bsDay = nepaliDate.getDate();

    const bsMonthsEnglish = [
      "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
      "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
    ];
    const bsMonthsNepali = [
      "बैशाख", "जेठ", "असार", "श्रावण", "भाद्र", "असोज",
      "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुन", "चैत्र",
    ];
    const daysNepali: Record<string, string> = {
      Sunday: "आइतबार",
      Monday: "सोमबार",
      Tuesday: "मंगलबार",
      Wednesday: "बुधबार",
      Thursday: "बिहीबार",
      Friday: "शुक्रबार",
      Saturday: "शनिबार",
    };

    const padDay = String(bsDay).padStart(2, "0");
    bsDate = `${padDay} ${bsMonthsEnglish[bsMonth] || "Kartik"} ${bsYear}`;
    bsDateNepali = `${daysNepali[dayOfWeek] || dayOfWeek}, ${bsDay} ${bsMonthsNepali[bsMonth] || "कार्तिक"} ${bsYear}`;
  } catch {
    bsDate = "Kartik 2083";
    bsDateNepali = "कार्तिक २०८३";
  }

  return {
    isoDate,
    formattedGregorian,
    dayOfWeek,
    bsDate,
    bsDateNepali,
  };
}

export interface TodayMatchesResolution {
  nepalDate: string;
  nepalDateDetails: ReturnType<typeof getNepalDateDetails>;
  todayMatches: ScheduleMatch[];
  nextMatch: ScheduleMatch | null;
  hasMatchToday: boolean;
  isRestDay: boolean;
  isTournamentOver: boolean;
  isPreTournament: boolean;
}

/**
 * Resolves today's matches and tournament phase relative to current Nepal local date.
 */
export function resolveTodayMatches(
  matches: ScheduleMatch[],
  referenceDate: Date = new Date()
): TodayMatchesResolution {
  const nepalDate = getNepalDateString(referenceDate);
  const nepalDateDetails = getNepalDateDetails(referenceDate);

  // Matches scheduled for today in Nepal
  const todayMatches = matches.filter((m) => m.date === nepalDate);

  const firstTournamentDate = matches[0]?.date || "2026-10-26";
  const lastTournamentDate = matches[matches.length - 1]?.date || "2026-11-21";

  const isPreTournament = nepalDate < firstTournamentDate;
  const isTournamentOver = nepalDate > lastTournamentDate;

  // Find next upcoming match if no matches today or after today's matches
  let nextMatch: ScheduleMatch | null = null;

  if (todayMatches.length > 0) {
    // If any match today is upcoming or live, focus on it
    const activeToday = todayMatches.find((m) => m.status === "live" || m.status === "upcoming");
    if (!activeToday) {
      // All today's matches are completed; find next match on subsequent days
      nextMatch = matches.find((m) => m.date > nepalDate && m.status !== "completed") || null;
    }
  } else if (!isTournamentOver) {
    // No match today -> rest day or pre-tournament
    nextMatch = matches.find((m) => m.date >= nepalDate && m.status !== "completed") || null;
  }

  const hasMatchToday = todayMatches.length > 0;
  const isRestDay = !hasMatchToday && !isPreTournament && !isTournamentOver;

  return {
    nepalDate,
    nepalDateDetails,
    todayMatches,
    nextMatch,
    hasMatchToday,
    isRestDay,
    isTournamentOver,
    isPreTournament,
  };
}

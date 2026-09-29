import { getTeamBySlug, TeamDetail } from "./teams-data";

export interface MatchScoreDetails {
  runs: number;
  wickets: number;
  overs: string;
}

export interface MatchResultDetails {
  winnerId?: string;
  winnerName?: string;
  winMargin?: string;
  winType?: "runs" | "wickets" | "super_over" | "no_result" | "abandoned";
  statement?: string;
  playerOfTheMatch?: string;
  tossWinner?: string;
  tossDecision?: "bat" | "bowl";
}

export interface PlayoffPlaceholder {
  id: string;
  name: string;
  shortName: string;
  city: string;
  initials: string;
  isPlaceholder: true;
}

export const PLAYOFF_PLACEHOLDERS: Record<string, PlayoffPlaceholder> = {
  "rank-1": { id: "rank-1", name: "Rank 1 Team", shortName: "TBD", city: "League Stage", initials: "Q1", isPlaceholder: true },
  "rank-2": { id: "rank-2", name: "Rank 2 Team", shortName: "TBD", city: "League Stage", initials: "Q2", isPlaceholder: true },
  "rank-3": { id: "rank-3", name: "Rank 3 Team", shortName: "TBD", city: "League Stage", initials: "E1", isPlaceholder: true },
  "rank-4": { id: "rank-4", name: "Rank 4 Team", shortName: "TBD", city: "League Stage", initials: "E2", isPlaceholder: true },
  "q1-loser": { id: "q1-loser", name: "Loser of Qualifier 1", shortName: "TBD", city: "Playoff", initials: "Q1L", isPlaceholder: true },
  "elim-winner": { id: "elim-winner", name: "Winner of Eliminator", shortName: "TBD", city: "Playoff", initials: "EW", isPlaceholder: true },
  "q1-winner": { id: "q1-winner", name: "Winner of Qualifier 1", shortName: "TBD", city: "Finalist", initials: "F1", isPlaceholder: true },
  "q2-winner": { id: "q2-winner", name: "Winner of Qualifier 2", shortName: "TBD", city: "Finalist", initials: "F2", isPlaceholder: true },
};

export type MatchTeamInfo = (TeamDetail & { isPlaceholder?: false }) | (PlayoffPlaceholder & {
  slug?: string;
  region?: string;
  brandColor?: string;
  brandBg?: string;
  crestBg?: string;
  crestText?: string;
  logoUrl?: string;
  captain?: string;
  captainConfidence?: "confirmed" | "reported";
  coach?: string;
  squadStatus?: string;
  description?: string;
});

/**
 * Resolves a match team by canonical team ID or playoff placeholder ID
 */
export function resolveMatchTeam(
  teamId: string | null,
  placeholder?: string | null
): MatchTeamInfo {
  if (teamId !== null && teamId !== undefined) {
    const canonical = getTeamBySlug(teamId);
    if (canonical) {
      return { ...canonical, isPlaceholder: false };
    }
  }
  if (placeholder !== null && placeholder !== undefined) {
    const p = PLAYOFF_PLACEHOLDERS[placeholder];
    if (p) {
      return p;
    }
    return {
      id: placeholder,
      name: placeholder,
      shortName: "TBD",
      city: "To Be Determined",
      initials: "TBD",
      isPlaceholder: true,
    };
  }
  return {
    id: "tbd",
    name: "TBD",
    shortName: "TBD",
    city: "To Be Determined",
    initials: "TBD",
    isPlaceholder: true,
  };
}

export interface ScheduleMatch {
  id: string;
  matchNumber: number;
  stage: "League" | "Qualifier 1" | "Eliminator" | "Qualifier 2" | "Final";
  /** Canonical team slug from teams-data.ts, or null for playoff placeholder */
  team1Id: string | null;
  /** Playoff placeholder identifier (e.g. 'rank-1'), or null for league matches */
  team1Placeholder: string | null;
  /** Canonical team slug from teams-data.ts, or null for playoff placeholder */
  team2Id: string | null;
  /** Playoff placeholder identifier (e.g. 'rank-2'), or null for league matches */
  team2Placeholder: string | null;
  date: string; // ISO format: YYYY-MM-DD
  formattedDate: string; // e.g. 26 October 2026
  bsDate: string; // e.g. 09 Kartik 2083
  bsDateNepali: string; // e.g. सोमबार, ९ कार्तिक २०८३
  dayOfWeek: string; // e.g. Monday
  time: string; // Local Nepal Time (NPT) display or "Time TBA"
  venue: string;
  status: "upcoming" | "completed" | "live" | "tba";
  result?: string;
  scores?: {
    team1?: MatchScoreDetails;
    team2?: MatchScoreDetails;
  };
  resultDetails?: MatchResultDetails;
  slug: string;
  isProvisional: boolean;
}

/** Helper to resolve both teams for a given match */
export function resolveMatchTeams(match: ScheduleMatch): { team1: MatchTeamInfo; team2: MatchTeamInfo } {
  return {
    team1: resolveMatchTeam(match.team1Id, match.team1Placeholder),
    team2: resolveMatchTeam(match.team2Id, match.team2Placeholder),
  };
}

export interface TournamentInfo {
  name: string;
  season: string;
  edition: string;
  format: string;
  country: string;
  organizer: string;
  totalTeams: number;
  totalMatches: number;
  primaryVenue: string;
  status: "Upcoming" | "Live" | "Completed";
  projectedDates: string;
  isConfirmed: boolean;
}

export const TOURNAMENT_INFO: TournamentInfo = {
  name: "Siddhartha Bank Nepal Premier League",
  season: "Season 3 / NPL 2026",
  edition: "2026 Edition",
  format: "Twenty20 (20 Overs)",
  country: "Nepal",
  organizer: "Cricket Association of Nepal (CAN)",
  totalTeams: 8,
  totalMatches: 32,
  primaryVenue: "TU International Cricket Stadium, Kirtipur",
  status: "Upcoming",
  projectedDates: "26 October – 21 November 2026",
  isConfirmed: false,
};

/* ── NPL Season 3 Complete 32-Fixture Dataset (28 League + 4 Playoffs) ── */
export const SCHEDULE_FIXTURES: ScheduleMatch[] = [
  {
    id: "match-01",
    matchNumber: 1,
    stage: "League",
    team1Id: "lumbini-lions",
    team1Placeholder: null,
    team2Id: "sudurpaschim-royals",
    team2Placeholder: null,
    date: "2026-10-26",
    formattedDate: "26 October 2026",
    bsDate: "09 Kartik 2083",
    bsDateNepali: "सोमबार, ९ कार्तिक २०८३",
    dayOfWeek: "Monday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-1-lumbini-lions-vs-sudurpaschim-royals",
    isProvisional: false,
  },
  {
    id: "match-02",
    matchNumber: 2,
    stage: "League",
    team1Id: "biratnagar-kings",
    team1Placeholder: null,
    team2Id: "chitwan-rhinos",
    team2Placeholder: null,
    date: "2026-10-27",
    formattedDate: "27 October 2026",
    bsDate: "10 Kartik 2083",
    bsDateNepali: "मंगलबार, १० कार्तिक २०८३",
    dayOfWeek: "Tuesday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-2-biratnagar-kings-vs-chitwan-rhinos",
    isProvisional: false,
  },
  {
    id: "match-03",
    matchNumber: 3,
    stage: "League",
    team1Id: "karnali-yaks",
    team1Placeholder: null,
    team2Id: "janakpur-bolts",
    team2Placeholder: null,
    date: "2026-10-27",
    formattedDate: "27 October 2026",
    bsDate: "10 Kartik 2083",
    bsDateNepali: "मंगलबार, १० कार्तिक २०८३",
    dayOfWeek: "Tuesday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-3-karnali-yaks-vs-janakpur-bolts",
    isProvisional: false,
  },
  {
    id: "match-04",
    matchNumber: 4,
    stage: "League",
    team1Id: "pokhara-avengers",
    team1Placeholder: null,
    team2Id: "sudurpaschim-royals",
    team2Placeholder: null,
    date: "2026-10-28",
    formattedDate: "28 October 2026",
    bsDate: "11 Kartik 2083",
    bsDateNepali: "बुधबार, ११ कार्तिक २०८३",
    dayOfWeek: "Wednesday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-4-pokhara-avengers-vs-sudurpaschim-royals",
    isProvisional: false,
  },
  {
    id: "match-05",
    matchNumber: 5,
    stage: "League",
    team1Id: "janakpur-bolts",
    team1Placeholder: null,
    team2Id: "kathmandu-gorkhas",
    team2Placeholder: null,
    date: "2026-10-29",
    formattedDate: "29 October 2026",
    bsDate: "12 Kartik 2083",
    bsDateNepali: "बिहीबार, १२ कार्तिक २०८३",
    dayOfWeek: "Thursday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-5-janakpur-bolts-vs-kathmandu-gorkhas",
    isProvisional: false,
  },
  {
    id: "match-06",
    matchNumber: 6,
    stage: "League",
    team1Id: "karnali-yaks",
    team1Placeholder: null,
    team2Id: "biratnagar-kings",
    team2Placeholder: null,
    date: "2026-10-29",
    formattedDate: "29 October 2026",
    bsDate: "12 Kartik 2083",
    bsDateNepali: "बिहीबार, १२ कार्तिक २०८३",
    dayOfWeek: "Thursday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-6-karnali-yaks-vs-biratnagar-kings",
    isProvisional: false,
  },
  {
    id: "match-07",
    matchNumber: 7,
    stage: "League",
    team1Id: "lumbini-lions",
    team1Placeholder: null,
    team2Id: "chitwan-rhinos",
    team2Placeholder: null,
    date: "2026-10-31",
    formattedDate: "31 October 2026",
    bsDate: "14 Kartik 2083",
    bsDateNepali: "शनिबार, १४ कार्तिक २०८३",
    dayOfWeek: "Saturday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-7-lumbini-lions-vs-chitwan-rhinos",
    isProvisional: false,
  },
  {
    id: "match-08",
    matchNumber: 8,
    stage: "League",
    team1Id: "sudurpaschim-royals",
    team1Placeholder: null,
    team2Id: "biratnagar-kings",
    team2Placeholder: null,
    date: "2026-10-31",
    formattedDate: "31 October 2026",
    bsDate: "14 Kartik 2083",
    bsDateNepali: "शनिबार, १४ कार्तिक २०८३",
    dayOfWeek: "Saturday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-8-sudurpaschim-royals-vs-biratnagar-kings",
    isProvisional: false,
  },
  {
    id: "match-09",
    matchNumber: 9,
    stage: "League",
    team1Id: "janakpur-bolts",
    team1Placeholder: null,
    team2Id: "pokhara-avengers",
    team2Placeholder: null,
    date: "2026-11-01",
    formattedDate: "1 November 2026",
    bsDate: "15 Kartik 2083",
    bsDateNepali: "आइतबार, १५ कार्तिक २०८३",
    dayOfWeek: "Sunday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-9-janakpur-bolts-vs-pokhara-avengers",
    isProvisional: false,
  },
  {
    id: "match-10",
    matchNumber: 10,
    stage: "League",
    team1Id: "kathmandu-gorkhas",
    team1Placeholder: null,
    team2Id: "karnali-yaks",
    team2Placeholder: null,
    date: "2026-11-02",
    formattedDate: "2 November 2026",
    bsDate: "16 Kartik 2083",
    bsDateNepali: "सोमबार, १६ कार्तिक २०८३",
    dayOfWeek: "Monday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-10-kathmandu-gorkhas-vs-karnali-yaks",
    isProvisional: false,
  },
  {
    id: "match-11",
    matchNumber: 11,
    stage: "League",
    team1Id: "sudurpaschim-royals",
    team1Placeholder: null,
    team2Id: "chitwan-rhinos",
    team2Placeholder: null,
    date: "2026-11-02",
    formattedDate: "2 November 2026",
    bsDate: "16 Kartik 2083",
    bsDateNepali: "सोमबार, १६ कार्तिक २०८३",
    dayOfWeek: "Monday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-11-sudurpaschim-royals-vs-chitwan-rhinos",
    isProvisional: false,
  },
  {
    id: "match-12",
    matchNumber: 12,
    stage: "League",
    team1Id: "biratnagar-kings",
    team1Placeholder: null,
    team2Id: "janakpur-bolts",
    team2Placeholder: null,
    date: "2026-11-03",
    formattedDate: "3 November 2026",
    bsDate: "17 Kartik 2083",
    bsDateNepali: "मंगलबार, १७ कार्तिक २०८३",
    dayOfWeek: "Tuesday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-12-biratnagar-kings-vs-janakpur-bolts",
    isProvisional: false,
  },
  {
    id: "match-13",
    matchNumber: 13,
    stage: "League",
    team1Id: "lumbini-lions",
    team1Placeholder: null,
    team2Id: "pokhara-avengers",
    team2Placeholder: null,
    date: "2026-11-03",
    formattedDate: "3 November 2026",
    bsDate: "17 Kartik 2083",
    bsDateNepali: "मंगलबार, १७ कार्तिक २०८३",
    dayOfWeek: "Tuesday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-13-lumbini-lions-vs-pokhara-avengers",
    isProvisional: false,
  },
  {
    id: "match-14",
    matchNumber: 14,
    stage: "League",
    team1Id: "lumbini-lions",
    team1Placeholder: null,
    team2Id: "janakpur-bolts",
    team2Placeholder: null,
    date: "2026-11-05",
    formattedDate: "5 November 2026",
    bsDate: "19 Kartik 2083",
    bsDateNepali: "बिहीबार, १९ कार्तिक २०८३",
    dayOfWeek: "Thursday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-14-lumbini-lions-vs-janakpur-bolts",
    isProvisional: false,
  },
  {
    id: "match-15",
    matchNumber: 15,
    stage: "League",
    team1Id: "kathmandu-gorkhas",
    team1Placeholder: null,
    team2Id: "biratnagar-kings",
    team2Placeholder: null,
    date: "2026-11-05",
    formattedDate: "5 November 2026",
    bsDate: "19 Kartik 2083",
    bsDateNepali: "बिहीबार, १९ कार्तिक २०८३",
    dayOfWeek: "Thursday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-15-kathmandu-gorkhas-vs-biratnagar-kings",
    isProvisional: false,
  },
  {
    id: "match-16",
    matchNumber: 16,
    stage: "League",
    team1Id: "sudurpaschim-royals",
    team1Placeholder: null,
    team2Id: "karnali-yaks",
    team2Placeholder: null,
    date: "2026-11-06",
    formattedDate: "6 November 2026",
    bsDate: "20 Kartik 2083",
    bsDateNepali: "शुक्रबार, २० कार्तिक २०८३",
    dayOfWeek: "Friday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-16-sudurpaschim-royals-vs-karnali-yaks",
    isProvisional: false,
  },
  {
    id: "match-17",
    matchNumber: 17,
    stage: "League",
    team1Id: "chitwan-rhinos",
    team1Placeholder: null,
    team2Id: "pokhara-avengers",
    team2Placeholder: null,
    date: "2026-11-06",
    formattedDate: "6 November 2026",
    bsDate: "20 Kartik 2083",
    bsDateNepali: "शुक्रबार, २० कार्तिक २०८३",
    dayOfWeek: "Friday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-17-chitwan-rhinos-vs-pokhara-avengers",
    isProvisional: false,
  },
  {
    id: "match-18",
    matchNumber: 18,
    stage: "League",
    team1Id: "kathmandu-gorkhas",
    team1Placeholder: null,
    team2Id: "lumbini-lions",
    team2Placeholder: null,
    date: "2026-11-07",
    formattedDate: "7 November 2026",
    bsDate: "21 Kartik 2083",
    bsDateNepali: "शनिबार, २१ कार्तिक २०८३",
    dayOfWeek: "Saturday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-18-kathmandu-gorkhas-vs-lumbini-lions",
    isProvisional: false,
  },
  {
    id: "match-19",
    matchNumber: 19,
    stage: "League",
    team1Id: "pokhara-avengers",
    team1Placeholder: null,
    team2Id: "karnali-yaks",
    team2Placeholder: null,
    date: "2026-11-09",
    formattedDate: "9 November 2026",
    bsDate: "23 Kartik 2083",
    bsDateNepali: "सोमबार, २३ कार्तिक २०८३",
    dayOfWeek: "Monday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-19-pokhara-avengers-vs-karnali-yaks",
    isProvisional: false,
  },
  {
    id: "match-20",
    matchNumber: 20,
    stage: "League",
    team1Id: "chitwan-rhinos",
    team1Placeholder: null,
    team2Id: "kathmandu-gorkhas",
    team2Placeholder: null,
    date: "2026-11-09",
    formattedDate: "9 November 2026",
    bsDate: "23 Kartik 2083",
    bsDateNepali: "सोमबार, २३ कार्तिक २०८३",
    dayOfWeek: "Monday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-20-chitwan-rhinos-vs-kathmandu-gorkhas",
    isProvisional: false,
  },
  {
    id: "match-21",
    matchNumber: 21,
    stage: "League",
    team1Id: "sudurpaschim-royals",
    team1Placeholder: null,
    team2Id: "janakpur-bolts",
    team2Placeholder: null,
    date: "2026-11-10",
    formattedDate: "10 November 2026",
    bsDate: "24 Kartik 2083",
    bsDateNepali: "मंगलबार, २४ कार्तिक २०८३",
    dayOfWeek: "Tuesday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-21-sudurpaschim-royals-vs-janakpur-bolts",
    isProvisional: false,
  },
  {
    id: "match-22",
    matchNumber: 22,
    stage: "League",
    team1Id: "biratnagar-kings",
    team1Placeholder: null,
    team2Id: "pokhara-avengers",
    team2Placeholder: null,
    date: "2026-11-12",
    formattedDate: "12 November 2026",
    bsDate: "26 Kartik 2083",
    bsDateNepali: "बिहीबार, २६ कार्तिक २०८३",
    dayOfWeek: "Thursday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-22-biratnagar-kings-vs-pokhara-avengers",
    isProvisional: false,
  },
  {
    id: "match-23",
    matchNumber: 23,
    stage: "League",
    team1Id: "karnali-yaks",
    team1Placeholder: null,
    team2Id: "lumbini-lions",
    team2Placeholder: null,
    date: "2026-11-12",
    formattedDate: "12 November 2026",
    bsDate: "26 Kartik 2083",
    bsDateNepali: "बिहीबार, २६ कार्तिक २०८३",
    dayOfWeek: "Thursday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-23-karnali-yaks-vs-lumbini-lions",
    isProvisional: false,
  },
  {
    id: "match-24",
    matchNumber: 24,
    stage: "League",
    team1Id: "kathmandu-gorkhas",
    team1Placeholder: null,
    team2Id: "sudurpaschim-royals",
    team2Placeholder: null,
    date: "2026-11-13",
    formattedDate: "13 November 2026",
    bsDate: "27 Kartik 2083",
    bsDateNepali: "शुक्रबार, २७ कार्तिक २०८३",
    dayOfWeek: "Friday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-24-kathmandu-gorkhas-vs-sudurpaschim-royals",
    isProvisional: false,
  },
  {
    id: "match-25",
    matchNumber: 25,
    stage: "League",
    team1Id: "janakpur-bolts",
    team1Placeholder: null,
    team2Id: "chitwan-rhinos",
    team2Placeholder: null,
    date: "2026-11-13",
    formattedDate: "13 November 2026",
    bsDate: "27 Kartik 2083",
    bsDateNepali: "शुक्रबार, २७ कार्तिक २०८३",
    dayOfWeek: "Friday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-25-janakpur-bolts-vs-chitwan-rhinos",
    isProvisional: false,
  },
  {
    id: "match-26",
    matchNumber: 26,
    stage: "League",
    team1Id: "biratnagar-kings",
    team1Placeholder: null,
    team2Id: "lumbini-lions",
    team2Placeholder: null,
    date: "2026-11-14",
    formattedDate: "14 November 2026",
    bsDate: "28 Kartik 2083",
    bsDateNepali: "शनिबार, २८ कार्तिक २०८३",
    dayOfWeek: "Saturday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-26-biratnagar-kings-vs-lumbini-lions",
    isProvisional: false,
  },
  {
    id: "match-27",
    matchNumber: 27,
    stage: "League",
    team1Id: "chitwan-rhinos",
    team1Placeholder: null,
    team2Id: "karnali-yaks",
    team2Placeholder: null,
    date: "2026-11-15",
    formattedDate: "15 November 2026",
    bsDate: "29 Kartik 2083",
    bsDateNepali: "आइतबार, २९ कार्तिक २०८३",
    dayOfWeek: "Sunday",
    time: "12:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-27-chitwan-rhinos-vs-karnali-yaks",
    isProvisional: false,
  },
  {
    id: "match-28",
    matchNumber: 28,
    stage: "League",
    team1Id: "pokhara-avengers",
    team1Placeholder: null,
    team2Id: "kathmandu-gorkhas",
    team2Placeholder: null,
    date: "2026-11-15",
    formattedDate: "15 November 2026",
    bsDate: "29 Kartik 2083",
    bsDateNepali: "आइतबार, २९ कार्तिक २०८३",
    dayOfWeek: "Sunday",
    time: "4:30 PM NPT",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "upcoming",
    slug: "match-28-pokhara-avengers-vs-kathmandu-gorkhas",
    isProvisional: false,
  },
  {
    id: "match-29",
    matchNumber: 29,
    stage: "Qualifier 1",
    team1Id: null,
    team1Placeholder: "rank-1",
    team2Id: null,
    team2Placeholder: "rank-2",
    date: "2026-11-17",
    formattedDate: "17 November 2026",
    bsDate: "01 Mangsir 2083",
    bsDateNepali: "मंगलबार, १ मंसिर २०८३",
    dayOfWeek: "Tuesday",
    time: "Time TBA",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "tba",
    slug: "match-29-qualifier-1",
    isProvisional: false,
  },
  {
    id: "match-30",
    matchNumber: 30,
    stage: "Eliminator",
    team1Id: null,
    team1Placeholder: "rank-3",
    team2Id: null,
    team2Placeholder: "rank-4",
    date: "2026-11-18",
    formattedDate: "18 November 2026",
    bsDate: "02 Mangsir 2083",
    bsDateNepali: "बुधबार, २ मंसिर २०८३",
    dayOfWeek: "Wednesday",
    time: "Time TBA",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "tba",
    slug: "match-30-eliminator",
    isProvisional: false,
  },
  {
    id: "match-31",
    matchNumber: 31,
    stage: "Qualifier 2",
    team1Id: null,
    team1Placeholder: "q1-loser",
    team2Id: null,
    team2Placeholder: "elim-winner",
    date: "2026-11-19",
    formattedDate: "19 November 2026",
    bsDate: "03 Mangsir 2083",
    bsDateNepali: "बिहीबार, ३ मंसिर २०८३",
    dayOfWeek: "Thursday",
    time: "Time TBA",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "tba",
    slug: "match-31-qualifier-2",
    isProvisional: false,
  },
  {
    id: "match-32",
    matchNumber: 32,
    stage: "Final",
    team1Id: null,
    team1Placeholder: "q1-winner",
    team2Id: null,
    team2Placeholder: "q2-winner",
    date: "2026-11-21",
    formattedDate: "21 November 2026",
    bsDate: "05 Mangsir 2083",
    bsDateNepali: "शनिबार, ५ मंसिर २०८३",
    dayOfWeek: "Saturday",
    time: "Time TBA",
    venue: "TU International Cricket Stadium, Kirtipur",
    status: "tba",
    slug: "match-32-npl-season-3-final",
    isProvisional: false,
  },
];

/**
 * Look up a match by its URL slug, match ID, or match number format
 */
export function getMatchBySlug(slug: string): ScheduleMatch | undefined {
  const normalized = slug.trim().toLowerCase();
  return SCHEDULE_FIXTURES.find(
    (m) =>
      m.slug.toLowerCase() === normalized ||
      m.id.toLowerCase() === normalized ||
      `match-${m.matchNumber}` === normalized ||
      `match-${m.matchNumber.toString().padStart(2, "0")}` === normalized
  );
}

/**
 * Get adjacent fixtures for navigation (Previous Match / Next Match)
 */
export function getAdjacentMatches(matchNumber: number): {
  prevMatch?: ScheduleMatch;
  nextMatch?: ScheduleMatch;
} {
  const index = SCHEDULE_FIXTURES.findIndex((m) => m.matchNumber === matchNumber);
  if (index === -1) {
    return {};
  }
  return {
    prevMatch: index > 0 ? SCHEDULE_FIXTURES[index - 1] : undefined,
    nextMatch: index < SCHEDULE_FIXTURES.length - 1 ? SCHEDULE_FIXTURES[index + 1] : undefined,
  };
}

/**
 * Get all slugs for Next.js generateStaticParams
 */
export function getAllMatchSlugs(): { slug: string }[] {
  return SCHEDULE_FIXTURES.map((m) => ({
    slug: m.slug,
  }));
}

/**
 * Standings Calculation & Data Module
 *
 * Source of truth for NPL Season 3 Points Table.
 * - Sourced strictly from centralized `teams-data.ts` and `schedule-data.ts`.
 * - Zero duplicated team definitions or fake fixture results.
 * - Standard T20 Points Logic:
 *     Win = 2 points
 *     Tie / No Result / Abandoned = 1 point
 *     Loss = 0 points
 * - Net Run Rate (NRR) mathematically computed from completed match scores.
 * - Before any match results exist, statistics are set to `null` and displayed
 *   as unavailable ("—") rather than inventing zeros or fake records.
 */

import { NPL_TEAM_DETAILS, TeamDetail } from "./teams-data";
import { SCHEDULE_FIXTURES, ScheduleMatch } from "./schedule-data";

export interface StandingsRow {
  position: number;
  team: TeamDetail;
  played: number | null;
  won: number | null;
  lost: number | null;
  noResult: number | null; // Tie or Abandoned / No Result
  points: number | null;
  netRunRate: number | null; // Raw numeric value for sorting
  formattedNRR: string; // "+0.842", "-0.210", or "—"
  runsScored: number;
  oversFacedDecimal: number;
  runsConceded: number;
  oversBowledDecimal: number;
  form: ("W" | "L" | "NR" | "T")[];
}

export interface StandingsData {
  season: string;
  edition: string;
  hasResults: boolean;
  totalMatchesCompleted: number;
  totalLeagueMatches: number;
  rows: StandingsRow[];
  lastUpdated: string;
}

/**
 * Converts cricket overs string/number (e.g. "19.4" = 19 overs + 4 balls) to decimal overs.
 * In tournament rules, if a team is bowled out (10 wickets down), their overs
 * are counted as the full allocated quota (20.0 for T20).
 */
export function oversToDecimal(
  oversInput: string | number | undefined,
  wickets: number = 0,
  maxQuotaOvers: number = 20
): number {
  if (wickets >= 10) {
    return maxQuotaOvers;
  }
  if (!oversInput && oversInput !== 0) return 0;

  const str = String(oversInput).trim();
  if (!str.includes(".")) {
    const ov = parseFloat(str) || 0;
    return Math.min(ov, maxQuotaOvers);
  }

  const [oversStr, ballsStr] = str.split(".");
  const overs = parseInt(oversStr, 10) || 0;
  const balls = parseInt(ballsStr, 10) || 0;

  const decimal = overs + balls / 6;
  return Math.min(decimal, maxQuotaOvers);
}

/**
 * Formats a numeric Net Run Rate with standard cricket +/- prefix and 3 decimal places.
 */
export function formatNRR(nrr: number | null): string {
  if (nrr === null || isNaN(nrr)) return "—";
  if (nrr > 0) return `+${nrr.toFixed(3)}`;
  if (nrr < 0) return nrr.toFixed(3);
  return "0.000";
}

/**
 * Computes live standings dynamically from a given list of fixtures and teams.
 */
export function computeStandings(
  fixtures: ScheduleMatch[] = SCHEDULE_FIXTURES,
  teams: TeamDetail[] = NPL_TEAM_DETAILS
): StandingsData {
  // Only completed league stage matches count towards the group points table
  const completedLeagueMatches = fixtures.filter(
    (m) => m.stage === "League" && m.status === "completed"
  );

  const totalLeagueMatches = fixtures.filter((m) => m.stage === "League").length;
  const hasResults = completedLeagueMatches.length > 0;

  // Pre-tournament state: no matches have been completed yet
  if (!hasResults) {
    const rows: StandingsRow[] = teams.map((team, index) => ({
      position: index + 1,
      team,
      played: null,
      won: null,
      lost: null,
      noResult: null,
      points: null,
      netRunRate: null,
      formattedNRR: "—",
      runsScored: 0,
      oversFacedDecimal: 0,
      runsConceded: 0,
      oversBowledDecimal: 0,
      form: [],
    }));

    return {
      season: "Season 3 / NPL 2026",
      edition: "2026 Edition",
      hasResults: false,
      totalMatchesCompleted: 0,
      totalLeagueMatches,
      rows,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Active tournament state: compute real stats
  interface TeamAccumulator {
    team: TeamDetail;
    played: number;
    won: number;
    lost: number;
    noResult: number;
    points: number;
    runsScored: number;
    oversFacedDecimal: number;
    runsConceded: number;
    oversBowledDecimal: number;
    form: ("W" | "L" | "NR" | "T")[];
  }

  const teamMap = new Map<string, TeamAccumulator>();
  teams.forEach((t) => {
    teamMap.set(t.id, {
      team: t,
      played: 0,
      won: 0,
      lost: 0,
      noResult: 0,
      points: 0,
      runsScored: 0,
      oversFacedDecimal: 0,
      runsConceded: 0,
      oversBowledDecimal: 0,
      form: [],
    });
  });

  completedLeagueMatches.forEach((match) => {
    if (match.team1Id === null || match.team2Id === null) return;

    const acc1 = teamMap.get(match.team1Id);
    const acc2 = teamMap.get(match.team2Id);
    if (!acc1 || !acc2) return;

    acc1.played += 1;
    acc2.played += 1;

    // Check for abandoned / no result
    const resultText = (match.result || "").toLowerCase();
    const isNoResult =
      resultText.includes("no result") ||
      resultText.includes("abandoned") ||
      resultText.includes("washout");

    if (isNoResult) {
      acc1.noResult += 1;
      acc2.noResult += 1;
      acc1.points += 1;
      acc2.points += 1;
      acc1.form.push("NR");
      acc2.form.push("NR");
      return;
    }

    // Determine winner
    let winnerId: string | null = null;
    let isTie = false;

    if (match.scores?.team1 && match.scores?.team2) {
      const r1 = match.scores.team1.runs;
      const r2 = match.scores.team2.runs;
      if (r1 > r2) winnerId = match.team1Id;
      else if (r2 > r1) winnerId = match.team2Id;
      else isTie = true;

      // Accumulate runs & overs for NRR
      const ov1 = oversToDecimal(
        match.scores.team1.overs,
        match.scores.team1.wickets
      );
      const ov2 = oversToDecimal(
        match.scores.team2.overs,
        match.scores.team2.wickets
      );

      acc1.runsScored += r1;
      acc1.oversFacedDecimal += ov1;
      acc1.runsConceded += r2;
      acc1.oversBowledDecimal += ov2;

      acc2.runsScored += r2;
      acc2.oversFacedDecimal += ov2;
      acc2.runsConceded += r1;
      acc2.oversBowledDecimal += ov1;
    } else if (match.result) {
      if (resultText.includes(acc1.team.name.toLowerCase())) {
        winnerId = match.team1Id;
      } else if (resultText.includes(acc2.team.name.toLowerCase())) {
        winnerId = match.team2Id;
      }
    }

    if (isTie) {
      acc1.noResult += 1;
      acc2.noResult += 1;
      acc1.points += 1;
      acc2.points += 1;
      acc1.form.push("T");
      acc2.form.push("T");
    } else if (winnerId === match.team1Id) {
      acc1.won += 1;
      acc1.points += 2;
      acc1.form.push("W");
      acc2.lost += 1;
      acc2.form.push("L");
    } else if (winnerId === match.team2Id) {
      acc2.won += 1;
      acc2.points += 2;
      acc2.form.push("W");
      acc1.lost += 1;
      acc1.form.push("L");
    }
  });

  // Calculate NRR and build rows
  const unsortedRows: StandingsRow[] = Array.from(teamMap.values()).map((acc) => {
    let nrr: number | null = null;
    if (acc.oversFacedDecimal > 0 && acc.oversBowledDecimal > 0) {
      const runRateFor = acc.runsScored / acc.oversFacedDecimal;
      const runRateAgainst = acc.runsConceded / acc.oversBowledDecimal;
      nrr = runRateFor - runRateAgainst;
    }

    return {
      position: 0,
      team: acc.team,
      played: acc.played,
      won: acc.won,
      lost: acc.lost,
      noResult: acc.noResult,
      points: acc.points,
      netRunRate: nrr,
      formattedNRR: formatNRR(nrr),
      runsScored: acc.runsScored,
      oversFacedDecimal: acc.oversFacedDecimal,
      runsConceded: acc.runsConceded,
      oversBowledDecimal: acc.oversBowledDecimal,
      form: acc.form.slice(-5), // Last 5 matches
    };
  });

  // Sort by Points DESC -> NRR DESC -> Won DESC -> Alphabetical
  unsortedRows.sort((a, b) => {
    const ptsDiff = (b.points ?? 0) - (a.points ?? 0);
    if (ptsDiff !== 0) return ptsDiff;

    const nrrA = a.netRunRate ?? -999;
    const nrrB = b.netRunRate ?? -999;
    if (nrrB !== nrrA) return nrrB - nrrA;

    const winDiff = (b.won ?? 0) - (a.won ?? 0);
    if (winDiff !== 0) return winDiff;

    return a.team.name.localeCompare(b.team.name);
  });

  // Assign 1-indexed position
  const rows: StandingsRow[] = unsortedRows.map((row, idx) => ({
    ...row,
    position: idx + 1,
  }));

  return {
    season: "Season 3 / NPL 2026",
    edition: "2026 Edition",
    hasResults: true,
    totalMatchesCompleted: completedLeagueMatches.length,
    totalLeagueMatches,
    rows,
    lastUpdated: new Date().toISOString(),
  };
}

/** Convenience default getter */
export function getStandings(): StandingsData {
  return computeStandings(SCHEDULE_FIXTURES, NPL_TEAM_DETAILS);
}

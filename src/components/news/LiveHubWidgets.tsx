import React from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  ScheduleMatch,
  resolveMatchTeams,
} from "@/lib/data/schedule-data";
import { StandingsData } from "@/lib/data/standings";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNptDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recently";
    return (
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kathmandu",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d) + " NPT"
    );
  } catch {
    return "Recently";
  }
}

function getTodayNptYmd(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ---------------------------------------------------------------------------
// 1. TodayMatch Component
// ---------------------------------------------------------------------------

interface TodayMatchProps {
  fixtures: ScheduleMatch[];
}

export function TodayMatch({ fixtures }: TodayMatchProps) {
  const todayYmd = getTodayNptYmd();

  // Find matches scheduled for today
  const matchesToday = fixtures.filter((m) => m.date === todayYmd);

  // If no match today, find the next scheduled upcoming match
  const nextMatch =
    matchesToday.length === 0
      ? fixtures.find((m) => m.date >= todayYmd && (m.status === "upcoming" || m.status === "tba")) ||
        fixtures.find((m) => m.status === "upcoming" || m.status === "tba") ||
        fixtures[0]
      : null;

  const displayMatches = matchesToday.length > 0 ? matchesToday : nextMatch ? [nextMatch] : [];
  const isScheduledToday = matchesToday.length > 0;

  if (displayMatches.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 text-center text-sm text-[var(--color-ink-muted)]">
        No matches currently scheduled.
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      {displayMatches.map((match) => {
        const { team1, team2 } = resolveMatchTeams(match);
        const isLive = match.status === "live";

        return (
          <div
            key={match.id}
            className="rounded-[var(--radius-lg)] border-2 border-[var(--color-brand)] bg-[var(--color-canvas)] shadow-xs overflow-hidden"
          >
            {/* Ribbon Header */}
            <div className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                    isLive
                      ? "bg-red-600 text-white animate-pulse"
                      : isScheduledToday
                      ? "bg-[var(--color-brand)] text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {isLive ? "● Live Match" : isScheduledToday ? "Today's Match" : "Next Scheduled Match"}
                </span>
                <span className="font-semibold text-[var(--color-ink)]">
                  Match #{match.matchNumber} · {match.stage}
                </span>
              </div>
              <div className="text-[var(--color-ink-muted)] font-medium">
                {match.bsDateNepali ? `${match.bsDateNepali} · ` : ""}
                {match.formattedDate}
              </div>
            </div>

            {/* Match Card Body */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 sm:gap-6">
                {/* Team 1 */}
                <div className="md:col-span-5 flex items-center gap-3.5">
                  <TeamLogo
                    name={team1.name}
                    shortName={team1.shortName}
                    initials={team1.initials}
                    logoUrl={"logoUrl" in team1 ? team1.logoUrl : undefined}
                    crestBg={"crestBg" in team1 ? team1.crestBg : undefined}
                    crestText={"crestText" in team1 ? team1.crestText : undefined}
                    size="lg"
                  />
                  <div>
                    {"slug" in team1 && team1.slug ? (
                      <Link
                        href={`/teams/${team1.slug}`}
                        className="font-bold text-base sm:text-lg text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors"
                      >
                        {team1.name}
                      </Link>
                    ) : (
                      <span className="font-bold text-base sm:text-lg text-[var(--color-ink)]">
                        {team1.name}
                      </span>
                    )}
                    {"region" in team1 && team1.region && (
                      <p className="text-xs text-[var(--color-ink-muted)]">{team1.region}</p>
                    )}
                    {match.scores?.team1 && (
                      <p className="font-mono font-bold text-sm text-[var(--color-ink)] mt-0.5">
                        {match.scores.team1.runs}/{match.scores.team1.wickets}{" "}
                        <span className="text-xs font-normal text-[var(--color-ink-muted)]">
                          ({match.scores.team1.overs} ov)
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* VS / Time Badge */}
                <div className="md:col-span-1 text-center py-1">
                  <span className="inline-block px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded bg-[var(--color-surface)] border border-[var(--color-rule)] text-[var(--color-ink-secondary)]">
                    VS
                  </span>
                </div>

                {/* Team 2 */}
                <div className="md:col-span-5 flex items-center md:flex-row-reverse gap-3.5 text-left md:text-right">
                  <TeamLogo
                    name={team2.name}
                    shortName={team2.shortName}
                    initials={team2.initials}
                    logoUrl={"logoUrl" in team2 ? team2.logoUrl : undefined}
                    crestBg={"crestBg" in team2 ? team2.crestBg : undefined}
                    crestText={"crestText" in team2 ? team2.crestText : undefined}
                    size="lg"
                  />
                  <div>
                    {"slug" in team2 && team2.slug ? (
                      <Link
                        href={`/teams/${team2.slug}`}
                        className="font-bold text-base sm:text-lg text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors"
                      >
                        {team2.name}
                      </Link>
                    ) : (
                      <span className="font-bold text-base sm:text-lg text-[var(--color-ink)]">
                        {team2.name}
                      </span>
                    )}
                    {"region" in team2 && team2.region && (
                      <p className="text-xs text-[var(--color-ink-muted)]">{team2.region}</p>
                    )}
                    {match.scores?.team2 && (
                      <p className="font-mono font-bold text-sm text-[var(--color-ink)] mt-0.5">
                        {match.scores.team2.runs}/{match.scores.team2.wickets}{" "}
                        <span className="text-xs font-normal text-[var(--color-ink-muted)]">
                          ({match.scores.team2.overs} ov)
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Meta Footer */}
              <div className="mt-5 pt-3.5 border-t border-[var(--color-rule)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-ink-secondary)]">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[var(--color-brand)] flex items-center gap-1.5">
                    <span aria-hidden="true">⏰</span>
                    <span>{match.time}</span>
                  </span>
                  <span className="text-[var(--color-ink-muted)] flex items-center gap-1.5">
                    <span aria-hidden="true">📍</span>
                    <span>{match.venue}</span>
                  </span>
                </div>
                {match.slug && (
                  <Link
                    href={`/matches/${match.slug}`}
                    className="font-bold text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
                  >
                    Match Center →
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. PointsTable Component
// ---------------------------------------------------------------------------

interface PointsTableWidgetProps {
  standings: StandingsData;
}

export function PointsTableWidget({ standings }: PointsTableWidgetProps) {
  const asOfFormatted = formatNptDateTime(standings.lastUpdated);

  // Check if any matches have been played
  const isZeroState = !standings.hasResults || standings.totalMatchesCompleted === 0;

  // Build rows: if zero state, all eight teams listed alphabetically with 0 played, 0 points, NRR 0.000
  let displayRows: {
    position: number;
    team: {
      id: string;
      slug: string;
      name: string;
      shortName: string;
      initials: string;
      logoUrl?: string;
      crestBg?: string;
      crestText?: string;
    };
    played: number;
    won: number;
    lost: number;
    noResult: number;
    points: number;
    nrrFormatted: string;
  }[] = [];

  if (isZeroState) {
    // Alphabetical order for all eight teams
    const sortedAlphabetical = [...standings.rows].sort((a, b) =>
      a.team.name.localeCompare(b.team.name)
    );

    displayRows = sortedAlphabetical.map((r, idx) => ({
      position: idx + 1,
      team: r.team,
      played: 0,
      won: 0,
      lost: 0,
      noResult: 0,
      points: 0,
      nrrFormatted: "0.000",
    }));
  } else {
    // Active tournament state: sort by points DESC, then net run rate DESC
    const sorted = [...standings.rows].sort((a, b) => {
      const pDiff = (b.points ?? 0) - (a.points ?? 0);
      if (pDiff !== 0) return pDiff;
      const nrrA = a.netRunRate ?? -999;
      const nrrB = b.netRunRate ?? -999;
      if (nrrB !== nrrA) return nrrB - nrrA;
      return a.team.name.localeCompare(b.team.name);
    });

    displayRows = sorted.map((r, idx) => ({
      position: idx + 1,
      team: r.team,
      played: r.played ?? 0,
      won: r.won ?? 0,
      lost: r.lost ?? 0,
      noResult: r.noResult ?? 0,
      points: r.points ?? 0,
      nrrFormatted: r.formattedNRR && r.formattedNRR !== "—" ? r.formattedNRR : "0.000",
    }));
  }

  return (
    <div className="space-y-3 my-6">
      {/* Table Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-ink-muted)]">
        <span className="font-semibold text-[var(--color-ink)]">
          {standings.season} Standings
        </span>
        <span>As of {asOfFormatted}</span>
      </div>

      {/* Semantic Table Wrapper */}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-rule)] shadow-2xs">
        <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[560px]">
          <caption className="sr-only">
            NPL 2026 Points Table and Standings as of {asOfFormatted}
          </caption>
          <thead className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
            <tr>
              <th scope="col" className="py-2.5 px-3 w-12 text-center">
                Pos
              </th>
              <th scope="col" className="py-2.5 px-3 min-w-[180px]">
                Team
              </th>
              <th
                scope="col"
                className="py-2.5 px-2.5 text-right tabular-nums w-12"
                title="Played"
              >
                P
              </th>
              <th
                scope="col"
                className="py-2.5 px-2.5 text-right tabular-nums w-12"
                title="Won"
              >
                W
              </th>
              <th
                scope="col"
                className="py-2.5 px-2.5 text-right tabular-nums w-12"
                title="Lost"
              >
                L
              </th>
              <th
                scope="col"
                className="py-2.5 px-2.5 text-right tabular-nums w-12"
                title="No Result / Tied"
              >
                NR
              </th>
              <th
                scope="col"
                className="py-2.5 px-3 text-right tabular-nums w-14 font-black"
                title="Total Points"
              >
                Pts
              </th>
              <th
                scope="col"
                className="py-2.5 px-3 text-right tabular-nums w-20 font-mono"
                title="Net Run Rate"
              >
                NRR
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-rule)] bg-[var(--color-canvas)]">
            {displayRows.map((row) => {
              const isTopFour = row.position <= 4;

              return (
                <tr
                  key={row.team.id}
                  className={
                    isTopFour
                      ? "bg-emerald-50/35 hover:bg-emerald-50/60 transition-colors"
                      : "hover:bg-[var(--color-surface)]/60 transition-colors"
                  }
                >
                  {/* Position + Marker */}
                  <td className="py-2.5 px-3 text-center align-middle">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                        isTopFour
                          ? "bg-[var(--color-brand)] text-white"
                          : "text-[var(--color-ink-muted)] bg-[var(--color-surface)] border border-[var(--color-rule)]"
                      }`}
                    >
                      {row.position}
                    </span>
                  </td>

                  {/* Team with Link and Playoff Indicator */}
                  <td className="py-2.5 px-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <TeamLogo
                        name={row.team.name}
                        shortName={row.team.shortName}
                        initials={row.team.initials}
                        logoUrl={row.team.logoUrl}
                        crestBg={row.team.crestBg}
                        crestText={row.team.crestText}
                        size="xs"
                      />
                      <Link
                        href={`/teams/${row.team.slug}`}
                        className="font-bold text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{row.team.name}</span>
                        {isTopFour && (
                          <span
                            className="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300"
                            title="Top 4 playoff qualification zone"
                          >
                            Q
                          </span>
                        )}
                      </Link>
                    </div>
                  </td>

                  {/* Played */}
                  <td className="py-2.5 px-2.5 text-right tabular-nums font-medium text-[var(--color-ink)] align-middle">
                    {row.played}
                  </td>

                  {/* Won */}
                  <td className="py-2.5 px-2.5 text-right tabular-nums font-medium text-emerald-700 align-middle">
                    {row.won}
                  </td>

                  {/* Lost */}
                  <td className="py-2.5 px-2.5 text-right tabular-nums font-medium text-rose-700 align-middle">
                    {row.lost}
                  </td>

                  {/* No Result */}
                  <td className="py-2.5 px-2.5 text-right tabular-nums font-medium text-[var(--color-ink-muted)] align-middle">
                    {row.noResult}
                  </td>

                  {/* Points */}
                  <td className="py-2.5 px-3 text-right tabular-nums font-black text-[var(--color-ink)] align-middle">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-rule)]">
                      {row.points}
                    </span>
                  </td>

                  {/* NRR */}
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-xs font-semibold text-[var(--color-ink)] align-middle">
                    {row.nrrFormatted}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Qualification Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[var(--color-ink-muted)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand)] shrink-0" aria-hidden="true" />
          <span className="text-[var(--color-ink-secondary)] font-medium">
            <span className="font-bold text-[var(--color-ink)]">Q</span>: Top 4 qualify for the playoffs
          </span>
        </div>

        {/* Clear Button / Link to Full Points Table */}
        <Link
          href="/points-table"
          className="inline-flex items-center gap-1.5 font-bold text-[var(--color-brand)] hover:underline text-xs"
        >
          <span>View the full NPL 2026 points table</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. LatestResults Component
// ---------------------------------------------------------------------------

interface LatestResultsProps {
  fixtures: ScheduleMatch[];
}

export function LatestResults({ fixtures }: LatestResultsProps) {
  // Get completed matches (up to last 5, latest first)
  const completed = fixtures
    .filter((m) => m.status === "completed")
    .slice(-5)
    .reverse();

  if (completed.length === 0) {
    return (
      <div className="my-6 space-y-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            No matches have been played yet.
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Official results will appear here following the conclusion of Match #1 on October 26, 2026.
          </p>
        </div>
        <div>
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand)] hover:underline"
          >
            <span>View complete tournament schedule and upcoming fixtures</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 space-y-3">
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-rule)] shadow-2xs">
        <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
          <caption className="sr-only">Latest Nepal Premier League Match Results</caption>
          <thead className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
            <tr>
              <th scope="col" className="py-2.5 px-3">
                Match
              </th>
              <th scope="col" className="py-2.5 px-3 min-w-[200px]">
                Teams
              </th>
              <th scope="col" className="py-2.5 px-3 min-w-[160px]">
                Result Summary
              </th>
              <th scope="col" className="py-2.5 px-3 min-w-[130px]">
                Player of the Match
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-rule)] bg-[var(--color-canvas)]">
            {completed.map((m) => {
              const { team1, team2 } = resolveMatchTeams(m);
              const potm = m.resultDetails?.playerOfTheMatch || "-";
              const resultSummary = m.resultDetails?.statement || m.result || "Match Completed";

              return (
                <tr key={m.id} className="hover:bg-[var(--color-surface)]/60 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[var(--color-ink)] whitespace-nowrap">
                    #{m.matchNumber} · {m.formattedDate}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-[var(--color-ink)]">
                      {team1.name} vs {team2.name}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-emerald-800 font-medium">
                    {resultSummary}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--color-ink-secondary)]">
                    {potm}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand)] hover:underline"
        >
          <span>View all results and complete tournament schedule</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. UpcomingFixtures Component
// ---------------------------------------------------------------------------

interface UpcomingFixturesProps {
  fixtures: ScheduleMatch[];
}

export function UpcomingFixtures({ fixtures }: UpcomingFixturesProps) {
  // Get next 5 upcoming matches
  const todayYmd = getTodayNptYmd();
  const upcoming = fixtures
    .filter((m) => m.status === "upcoming" || m.status === "tba")
    .filter((m) => m.date >= todayYmd || m.status === "upcoming")
    .slice(0, 5);

  const displayList = upcoming.length > 0 ? upcoming : fixtures.slice(0, 5);

  return (
    <div className="my-6 space-y-3">
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-rule)] shadow-2xs">
        <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[540px]">
          <caption className="sr-only">Upcoming Nepal Premier League Fixtures</caption>
          <thead className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
            <tr>
              <th scope="col" className="py-2.5 px-3 w-16">
                Match
              </th>
              <th scope="col" className="py-2.5 px-3 whitespace-nowrap">
                Date
              </th>
              <th scope="col" className="py-2.5 px-3 min-w-[210px]">
                Teams
              </th>
              <th scope="col" className="py-2.5 px-3 whitespace-nowrap">
                Start Time (NPT)
              </th>
              <th scope="col" className="py-2.5 px-3 min-w-[150px]">
                Venue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-rule)] bg-[var(--color-canvas)]">
            {displayList.map((m) => {
              const { team1, team2 } = resolveMatchTeams(m);

              return (
                <tr key={m.id} className="hover:bg-[var(--color-surface)]/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[var(--color-brand)] whitespace-nowrap">
                    #{m.matchNumber}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--color-ink-secondary)] whitespace-nowrap">
                    {m.formattedDate}
                    <span className="block text-[10px] text-[var(--color-ink-muted)]">
                      {m.dayOfWeek}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--color-ink)]">
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        name={team1.name}
                        shortName={team1.shortName}
                        initials={team1.initials}
                        logoUrl={"logoUrl" in team1 ? team1.logoUrl : undefined}
                        size="xs"
                      />
                      <span>{team1.name}</span>
                      <span className="text-[var(--color-ink-muted)] font-normal text-xs">vs</span>
                      <TeamLogo
                        name={team2.name}
                        shortName={team2.shortName}
                        initials={team2.initials}
                        logoUrl={"logoUrl" in team2 ? team2.logoUrl : undefined}
                        size="xs"
                      />
                      <span>{team2.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[var(--color-ink)] whitespace-nowrap tabular-nums">
                    {m.time}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--color-ink-muted)] text-xs">
                    {m.venue.replace("TU International Cricket Stadium", "TU Stadium")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand)] hover:underline"
        >
          <span>View the full 32-match NPL 2026 schedule</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

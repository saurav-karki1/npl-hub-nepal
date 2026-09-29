"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardBody, StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { resolveMatchTeams, type ScheduleMatch } from "@/lib/repository/matches";
import type { TeamDetail } from "@/lib/repository/teams";
import { TeamLogo } from "@/components/ui/TeamLogo";

type StatusFilter = "all" | "upcoming" | "playoffs" | "completed";

interface FullFixturesSectionProps {
  initialMatches: ScheduleMatch[];
  initialTeams: TeamDetail[];
}

export function FullFixturesSection({
  initialMatches,
  initialTeams,
}: FullFixturesSectionProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const allMatches = initialMatches;
  const allTeams = initialTeams;

  // Filtered fixtures computation
  const filteredMatches = useMemo(() => {
    return allMatches.filter((match) => {
      // 1. Status Filter
      if (statusFilter === "upcoming" && match.status !== "upcoming" && match.status !== "tba") {
        return false;
      }
      if (statusFilter === "completed" && match.status !== "completed") {
        return false;
      }
      if (statusFilter === "playoffs" && match.stage === "League") {
        return false;
      }

      // 2. Team Filter
      if (selectedTeam !== "all") {
        const matchesTeam1 = match.team1Id === selectedTeam;
        const matchesTeam2 = match.team2Id === selectedTeam;
        if (!matchesTeam1 && !matchesTeam2) {
          return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const { team1, team2 } = resolveMatchTeams(match);
        const inTeam1 = team1.name.toLowerCase().includes(q);
        const inTeam2 = team2.name.toLowerCase().includes(q);
        const inVenue = match.venue.toLowerCase().includes(q);
        const inStage = match.stage.toLowerCase().includes(q);
        const inBs = match.bsDate.toLowerCase().includes(q) || match.bsDateNepali.includes(q);
        if (!inTeam1 && !inTeam2 && !inVenue && !inStage && !inBs) {
          return false;
        }
      }

      return true;
    });
  }, [allMatches, statusFilter, selectedTeam, searchQuery]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: allMatches.length,
      upcoming: allMatches.filter((m) => m.status === "upcoming" || m.status === "tba").length,
      playoffs: allMatches.filter((m) => m.stage !== "League").length,
      completed: allMatches.filter((m) => m.status === "completed").length,
    };
  }, [allMatches]);

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSelectedTeam("all");
    setSearchQuery("");
  };

  return (
    <section id="all-fixtures" className="space-y-6 scroll-mt-20">
      {/* Section Header */}
      <div className="border-t-2 border-[var(--color-brand)] pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-ink)]">
            NPL Season 3 Fixtures & Match Schedule
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-0.5">
            Browse all 32 matches of Nepal Premier League Season 3 with Nepali Bikram Sambat (BS) dates, local Nepal times (NPT), and Kirtipur venue information.
          </p>
        </div>

        <div className="text-xs font-semibold text-[var(--color-ink-muted)] bg-[var(--color-surface)] px-3 py-1.5 rounded-sm border border-[var(--color-rule)] self-start md:self-auto">
          Showing <span className="text-[var(--color-brand)] font-bold">{filteredMatches.length}</span> of {allMatches.length} matches
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-4 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter matches by status">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${
              statusFilter === "all"
                ? "bg-[var(--color-brand)] text-white shadow-2xs"
                : "bg-[var(--color-canvas)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-rule)]"
            }`}
          >
            All Matches ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("upcoming")}
            className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${
              statusFilter === "upcoming"
                ? "bg-[var(--color-brand)] text-white shadow-2xs"
                : "bg-[var(--color-canvas)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-rule)]"
            }`}
          >
            Upcoming ({counts.upcoming})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("playoffs")}
            className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${
              statusFilter === "playoffs"
                ? "bg-[var(--color-brand)] text-white shadow-2xs"
                : "bg-[var(--color-canvas)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-rule)]"
            }`}
          >
            Playoffs ({counts.playoffs})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 text-xs font-bold rounded-[var(--radius-md)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${
              statusFilter === "completed"
                ? "bg-[var(--color-brand)] text-white shadow-2xs"
                : "bg-[var(--color-canvas)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-rule)]"
            }`}
          >
            Completed ({counts.completed})
          </button>
        </div>

        {/* Team Dropdown & Search Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-[var(--color-rule)]">
          {/* Team Selector */}
          <div>
            <label htmlFor="team-filter" className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
              Filter by Team
            </label>
            <select
              id="team-filter"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full bg-[var(--color-canvas)] border border-[var(--color-rule)] text-[var(--color-ink)] text-xs rounded-[var(--radius-md)] py-2 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] font-medium"
            >
              <option value="all">All 8 Franchise Teams</option>
              {allTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.city})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div>
            <label htmlFor="search-fixtures" className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
              Search by Keyword
            </label>
            <input
              id="search-fixtures"
              type="text"
              placeholder="e.g. Kathmandu, Kirtipur, Final..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-canvas)] border border-[var(--color-rule)] text-[var(--color-ink)] text-xs rounded-[var(--radius-md)] py-2 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] placeholder:text-[var(--color-ink-faint)]"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={statusFilter === "all" && selectedTeam === "all" && searchQuery === ""}
              className="text-xs h-[34px] w-full sm:w-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Fixtures Display */}
      {filteredMatches.length === 0 ? (
        <Card className="border-[var(--color-rule)] bg-[var(--color-surface)] py-12 text-center">
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              No matches found matching your filters.
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Try adjusting the status tabs, selecting another team, or clearing your search keywords.
            </p>
            <div className="pt-2">
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden border border-[var(--color-rule)] rounded-[var(--radius-lg)] bg-[var(--color-canvas)] shadow-2xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-rule)] bg-[var(--color-surface)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  <th scope="col" className="py-3 px-4 w-20">Match</th>
                  <th scope="col" className="py-3 px-4 w-48">Date & Time</th>
                  <th scope="col" className="py-3 px-4">Clash (Opponent)</th>
                  <th scope="col" className="py-3 px-4">Venue</th>
                  <th scope="col" className="py-3 px-4 w-28 text-center">Status</th>
                  <th scope="col" className="py-3 px-4 w-28 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-rule)]">
                {filteredMatches.map((match) => {
                  const { team1, team2 } = resolveMatchTeams(match);

                  return (
                    <tr
                      key={match.id}
                      className="hover:bg-[var(--color-surface)]/70 transition-colors"
                    >
                      {/* Match # */}
                      <td className="py-3.5 px-4 font-bold text-xs text-[var(--color-ink-muted)] align-middle">
                        <Link href={`/matches/${match.slug}`} className="group block">
                          <span className="block text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors">
                            #{match.matchNumber}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[var(--color-brand)] tracking-wider">
                            {match.stage}
                          </span>
                        </Link>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="font-bold text-xs text-[var(--color-ink)] block">
                          {match.bsDateNepali}
                        </span>
                        <span className="text-[11px] text-[var(--color-ink-muted)] block">
                          {match.dayOfWeek}, {match.formattedDate}
                        </span>
                        <span
                          className={`text-xs font-semibold mt-0.5 inline-block ${
                            match.time === "Time TBA"
                              ? "text-amber-700 font-medium"
                              : "text-[var(--color-brand)]"
                          }`}
                        >
                          {match.time === "Time TBA" ? "Time TBA (Not yet published)" : match.time}
                        </span>
                      </td>

                      {/* Teams Matchup */}
                      <td className="py-3.5 px-4 align-middle">
                        <Link
                          href={`/matches/${match.slug}`}
                          className="flex items-center gap-3 group hover:opacity-95 transition-opacity"
                        >
                          {/* Team 1 */}
                          <div className="flex items-center gap-2 w-48 justify-end">
                            <span className="font-bold text-xs text-[var(--color-ink)] text-right group-hover:text-[var(--color-brand)] transition-colors">
                              {team1.name}
                            </span>
                            <TeamLogo
                              name={team1.name}
                              shortName={team1.shortName}
                              initials={team1.initials}
                              logoUrl={team1.logoUrl}
                              crestBg={team1.crestBg}
                              crestText={team1.crestText}
                              size="sm"
                            />
                          </div>

                          {/* VS */}
                          <span className="text-[10px] font-black text-[var(--color-ink-muted)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded-xs uppercase tracking-wider border border-[var(--color-rule)] shrink-0">
                            vs
                          </span>

                          {/* Team 2 */}
                          <div className="flex items-center gap-2 w-48 justify-start">
                            <TeamLogo
                              name={team2.name}
                              shortName={team2.shortName}
                              initials={team2.initials}
                              logoUrl={team2.logoUrl}
                              crestBg={team2.crestBg}
                              crestText={team2.crestText}
                              size="sm"
                            />
                            <span className="font-bold text-xs text-[var(--color-ink)] text-left group-hover:text-[var(--color-brand)] transition-colors">
                              {team2.name}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Venue */}
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-muted)] align-middle">
                        <span className="line-clamp-1">{match.venue}</span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <StatusBadge
                          status={match.status === "tba" ? "neutral" : "upcoming"}
                          label={match.status === "tba" ? "Time TBA" : "Scheduled"}
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right align-middle">
                        <Link
                          href={`/matches/${match.slug}`}
                          className="text-xs font-bold text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
                        >
                          Match Page →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Match Cards (No Horizontal Scrolling) */}
          <div className="md:hidden space-y-3">
            {filteredMatches.map((match) => {
              const { team1, team2 } = resolveMatchTeams(match);

              return (
                <Card key={match.id} className="border-[var(--color-rule)]">
                  <CardBody className="p-4 space-y-3">
                    {/* Top Header */}
                    <div className="flex items-center justify-between text-[11px] border-b border-[var(--color-rule)] pb-2.5">
                      <Link
                        href={`/matches/${match.slug}`}
                        className="font-bold text-[var(--color-ink)] hover:text-[var(--color-brand)] uppercase tracking-wider"
                      >
                        Match #{match.matchNumber} · {match.stage}
                      </Link>
                      <StatusBadge
                        status={match.status === "tba" ? "neutral" : "upcoming"}
                        label={match.status === "tba" ? "Time TBA" : "Scheduled"}
                      />
                    </div>

                    {/* Teams Faceoff */}
                    <Link href={`/matches/${match.slug}`} className="block space-y-2 py-0.5 group">
                      <div className="flex items-center gap-2.5">
                        <TeamLogo
                          name={team1.name}
                          shortName={team1.shortName}
                          initials={team1.initials}
                          logoUrl={team1.logoUrl}
                          crestBg={team1.crestBg}
                          crestText={team1.crestText}
                          size="sm"
                        />
                        <span className="font-bold text-xs text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors">
                          {team1.name}
                        </span>
                      </div>

                      <div className="text-[10px] font-bold text-[var(--color-ink-faint)] uppercase tracking-wider pl-9">
                        vs
                      </div>

                      <div className="flex items-center gap-2.5">
                        <TeamLogo
                          name={team2.name}
                          shortName={team2.shortName}
                          initials={team2.initials}
                          logoUrl={team2.logoUrl}
                          crestBg={team2.crestBg}
                          crestText={team2.crestText}
                          size="sm"
                        />
                        <span className="font-bold text-xs text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors">
                          {team2.name}
                        </span>
                      </div>
                    </Link>

                    {/* Date & Venue Footer */}
                    <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                      <div>
                        <div className="font-bold text-xs text-[var(--color-ink)]">
                          {match.bsDateNepali}
                        </div>
                        <div className="text-[11px] text-[var(--color-ink-muted)]">
                          {match.dayOfWeek}, {match.formattedDate}
                        </div>
                        <span
                          className={`text-xs font-semibold mt-0.5 inline-block ${
                            match.time === "Time TBA"
                              ? "text-amber-700 font-medium"
                              : "text-[var(--color-brand)]"
                          }`}
                        >
                          {match.time === "Time TBA" ? "Time TBA (Not yet published)" : match.time}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--color-ink-faint)] text-right max-w-[140px] truncate self-end">
                        📍 {match.venue}
                      </span>
                    </div>

                    {/* Mobile Match Page Action Link */}
                    <div className="pt-2 border-t border-[var(--color-rule)] flex justify-end">
                      <Link
                        href={`/matches/${match.slug}`}
                        className="text-xs font-bold text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
                      >
                        View Match Page →
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

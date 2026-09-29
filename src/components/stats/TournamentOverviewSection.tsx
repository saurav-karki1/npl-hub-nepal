import { TournamentSummary } from "@/lib/data/stats-types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamMeta } from "@/lib/data/stats-registry";
import Link from "next/link";

interface TournamentOverviewSectionProps {
  summary: TournamentSummary;
}

export function TournamentOverviewSection({ summary }: TournamentOverviewSectionProps) {
  const championTeam = summary.champion ? getTeamMeta(summary.champion.teamId) : null;
  const runnerUpTeam = summary.runnerUp ? getTeamMeta(summary.runnerUp.teamId) : null;

  return (
    <section aria-labelledby="overview-heading" className="space-y-4">
      <SectionHeader
        title={`${summary.shortName} Overview`}
        description="Core tournament specifications, competition structure, venue details, and title honors."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tournament Dates & Venue */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              Dates & Venue
            </h3>
          </CardHeader>
          <CardBody className="p-4 space-y-2">
            <div>
              <span className="text-[11px] text-[var(--color-ink-muted)] block">Tournament Window</span>
              <span className="font-bold text-sm text-[var(--color-ink)]">
                {summary.dates}
              </span>
            </div>
            <div className="pt-1 border-t border-[var(--color-rule)]">
              <span className="text-[11px] text-[var(--color-ink-muted)] block">Host Venue</span>
              <span className="font-semibold text-xs text-[var(--color-ink)]">
                {summary.venue}
              </span>
              <span className="text-[11px] text-[var(--color-ink-muted)] block">
                {summary.venueCity} (All 32 fixtures)
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Format & Matches */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              Competition Format
            </h3>
          </CardHeader>
          <CardBody className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-ink-muted)]">Franchises</span>
              <span className="font-bold text-[var(--color-ink)]">{summary.teamsCount} Teams</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-ink-muted)]">Total Fixtures</span>
              <span className="font-bold text-[var(--color-ink)]">{summary.totalMatches} Matches</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-ink-muted)]">League Stage</span>
              <span className="font-bold text-[var(--color-ink)]">{summary.leagueMatches} (Single Round-Robin)</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-[var(--color-rule)]">
              <span className="text-[var(--color-ink-muted)]">Playoffs</span>
              <span className="font-bold text-[var(--color-ink)]">4 (Q1, Eliminator, Q2, Final)</span>
            </div>
          </CardBody>
        </Card>

        {/* Card 3: Champions & Honors */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              Title Honors
            </h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            {summary.champion ? (
              <>
                <div className="flex items-center gap-3">
                  <TeamLogo
                    name={summary.champion.teamName}
                    logoUrl={championTeam?.logoUrl}
                    crestBg={championTeam?.crestBg}
                    crestText={championTeam?.crestText}
                    size="sm"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block w-fit mb-0.5">
                      Champions
                    </span>
                    <Link
                      href={`/teams/${championTeam?.slug || summary.champion.teamId}`}
                      className="font-bold text-xs text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors"
                    >
                      {summary.champion.teamName}
                    </Link>
                  </div>
                </div>

                {summary.runnerUp && (
                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-rule)]">
                    <TeamLogo
                      name={summary.runnerUp.teamName}
                      logoUrl={runnerUpTeam?.logoUrl}
                      crestBg={runnerUpTeam?.crestBg}
                      crestText={runnerUpTeam?.crestText}
                      size="sm"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 block w-fit mb-0.5">
                        Runner-Up
                      </span>
                      <Link
                        href={`/teams/${runnerUpTeam?.slug || summary.runnerUp.teamId}`}
                        className="font-semibold text-xs text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors"
                      >
                        {summary.runnerUp.teamName}
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-[var(--color-ink-muted)] italic">
                Title honors will be decided at the Grand Final on 21 November 2026.
              </div>
            )}
          </CardBody>
        </Card>

        {/* Card 4: Points Rules & Verification */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              Regulations & Integrity
            </h3>
          </CardHeader>
          <CardBody className="p-4 space-y-2 text-xs">
            <div>
              <span className="text-[11px] text-[var(--color-ink-muted)] block">Points System</span>
              <span className="font-semibold text-[var(--color-ink)]">
                {summary.pointsSystem}
              </span>
            </div>
            <div className="pt-1.5 border-t border-[var(--color-rule)] flex justify-between items-center">
              <span className="text-[var(--color-ink-muted)]">Data Confidence:</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] uppercase">
                {summary.confidence} Confidence
              </span>
            </div>
            {summary.confidenceNote && (
              <p className="text-[10px] text-[var(--color-ink-muted)] leading-tight pt-1">
                {summary.confidenceNote}
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableWrapper,
  Td,
  Th,
} from "@/components/ui/Table";
import { StandingsData, StandingsRow } from "@/lib/data/standings";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface FullPointsTableProps {
  standings: StandingsData;
}

export function FullPointsTable({ standings }: FullPointsTableProps) {
  return (
    <section aria-labelledby="standings-table-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 id="standings-table-title" className="text-xl sm:text-2xl font-black text-[var(--color-ink)]">
          League Stage Standings
        </h2>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {standings.hasResults
            ? `${standings.totalMatchesCompleted} of ${standings.totalLeagueMatches} matches completed`
            : "Pre-tournament initial order (0 of 28 matches played)"}
        </span>
      </div>

      {/* Pre-tournament notice if no match results exist yet */}
      {!standings.hasResults && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-[var(--radius-md)] p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <span className="text-base leading-none shrink-0 mt-0.5" aria-hidden="true">
            ℹ️
          </span>
          <p className="leading-relaxed">
            <strong>Pre-Tournament Standings Notice:</strong> NPL Season 3 begins on <strong>26 October 2026 (०९ कार्तिक २०८३)</strong>. All 8 franchises start level. Statistics are displayed as unavailable (<span className="font-semibold text-amber-950">—</span>) until the opening round fixtures conclude at TU Cricket Stadium. Live standings, points, and Net Run Rates (NRR) will be calculated automatically upon match completion.
          </p>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="border-[var(--color-rule)] shadow-2xs">
        <CardBody flush>
          <TableWrapper>
            <Table>
              <TableHead>
                <tr className="bg-[var(--color-surface)]">
                  <Th className="w-12 text-center">Pos</Th>
                  <Th className="min-w-[200px]">Team</Th>
                  <Th numeric title="Matches Played" className="w-12">
                    P
                  </Th>
                  <Th numeric title="Matches Won" className="w-12">
                    W
                  </Th>
                  <Th numeric title="Matches Lost" className="w-12">
                    L
                  </Th>
                  <Th numeric title="No Result / Tied Matches" className="w-14">
                    NR/T
                  </Th>
                  <Th numeric title="Net Run Rate" className="w-24">
                    NRR
                  </Th>
                  <Th numeric title="Total Points (Win = 2, NR = 1, Loss = 0)" className="w-14 font-black">
                    Pts
                  </Th>
                </tr>
              </TableHead>
              <TableBody>
                {standings.rows.map((row: StandingsRow) => {
                  const isTopTwo = row.position <= 2;
                  const isTopFour = row.position <= 4;
                  const isCutoffRow = row.position === 4;

                  return (
                    <TableRow
                      key={row.team.id}
                      className={
                        isTopTwo
                          ? "bg-emerald-50/25 hover:bg-emerald-50/50"
                          : isTopFour
                          ? "bg-blue-50/20 hover:bg-blue-50/40"
                          : undefined
                      }
                    >
                      {/* Position */}
                      <Td className="text-center font-bold text-xs align-middle">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            isTopTwo
                              ? "bg-[var(--color-brand)] text-white font-black"
                              : isTopFour
                              ? "bg-emerald-100 text-emerald-900 font-bold"
                              : "text-[var(--color-ink-muted)] bg-[var(--color-surface)]"
                          }`}
                        >
                          {row.position}
                        </span>
                      </Td>

                      {/* Team Crest & Name with Link */}
                      <Td className="align-middle">
                        <Link
                          href={`/teams/${row.team.slug}`}
                          className="group flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-sm)]"
                        >
                          {/* Team Logo */}
                          <TeamLogo
                            name={row.team.name}
                            shortName={row.team.shortName}
                            initials={row.team.initials}
                            logoUrl={row.team.logoUrl}
                            crestBg={row.team.crestBg}
                            crestText={row.team.crestText}
                            size="md"
                            className="group-hover:scale-105 transition-transform"
                          />

                          <div>
                            <span className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors block">
                              {row.team.name}
                            </span>
                            <span className="text-[10px] text-[var(--color-ink-muted)] font-medium block">
                              {row.team.region} · {row.team.shortName}
                            </span>
                          </div>
                        </Link>
                      </Td>

                      {/* Played */}
                      <Td numeric className="align-middle font-medium">
                        {row.played !== null ? row.played : "—"}
                      </Td>

                      {/* Won */}
                      <Td numeric className="align-middle font-medium text-emerald-700">
                        {row.won !== null ? row.won : "—"}
                      </Td>

                      {/* Lost */}
                      <Td numeric className="align-middle font-medium text-rose-700">
                        {row.lost !== null ? row.lost : "—"}
                      </Td>

                      {/* No Result */}
                      <Td numeric className="align-middle font-medium text-[var(--color-ink-muted)]">
                        {row.noResult !== null ? row.noResult : "—"}
                      </Td>

                      {/* Net Run Rate */}
                      <Td numeric className="align-middle font-mono text-xs font-semibold">
                        {row.formattedNRR}
                      </Td>

                      {/* Points */}
                      <Td numeric className="align-middle font-black text-sm text-[var(--color-ink)]">
                        {row.points !== null ? (
                          <span className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)]">
                            {row.points}
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
        </CardBody>
      </Card>

      {/* Playoff Qualification Cutoff Legend */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-4 text-xs space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
          Qualification & Playoff Scenarios
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--color-brand)] shrink-0" aria-hidden="true" />
            <span className="text-[var(--color-ink-secondary)]">
              <strong className="text-[var(--color-ink)] font-bold">Ranks 1 & 2:</strong> Advance to <em>Qualifier 1</em> (Two chances to reach Final).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-400 shrink-0" aria-hidden="true" />
            <span className="text-[var(--color-ink-secondary)]">
              <strong className="text-[var(--color-ink)] font-bold">Ranks 3 & 4:</strong> Advance to <em>Eliminator</em> (Knockout).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--color-rule)] shrink-0" aria-hidden="true" />
            <span className="text-[var(--color-ink-muted)]">
              <strong className="text-[var(--color-ink-secondary)] font-semibold">Ranks 5–8:</strong> Eliminated after 28 League matches.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableWrapper,
  Td,
  Th,
} from "@/components/ui/Table";
import { getStandings, StandingsData, StandingsRow } from "@/lib/repository/matches";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface PointsTablePreviewProps {
  standings?: StandingsData;
}

export function PointsTablePreview({ standings: propStandings }: PointsTablePreviewProps) {
  const standings = propStandings ?? getStandings();
  // Show top 5 preview rows on homepage
  const previewRows = standings.rows.slice(0, 5);

  return (
    <section>
      <SectionHeader
        title="Points Table"
        action={{ label: "Full Standings →", href: "/points-table" }}
      />

      <Card>
        <CardBody flush>
          <TableWrapper>
            <Table>
              <TableHead>
                <tr>
                  <Th className="w-12 text-center">#</Th>
                  <Th>Team</Th>
                  <Th numeric title="Matches Played">
                    P
                  </Th>
                  <Th numeric title="Won">
                    W
                  </Th>
                  <Th numeric title="Lost">
                    L
                  </Th>
                  <Th numeric title="Net Run Rate" className="hidden sm:table-cell">
                    NRR
                  </Th>
                  <Th numeric title="Points" className="font-bold">
                    Pts
                  </Th>
                </tr>
              </TableHead>
              <TableBody>
                {previewRows.map((row: StandingsRow) => {
                  const isTopFour = row.position <= 4;
                  return (
                    <TableRow key={row.team.id} highlighted={row.position === 1}>
                      {/* Position */}
                      <Td className="text-center font-semibold text-xs">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${
                            row.position === 1
                              ? "bg-[var(--color-brand)] text-white font-bold"
                              : isTopFour
                              ? "bg-[var(--color-surface)] text-[var(--color-ink)] font-medium"
                              : "text-[var(--color-ink-muted)]"
                          }`}
                        >
                          {row.position}
                        </span>
                      </Td>

                      {/* Team Name & Badge */}
                      <Td className="font-semibold text-[var(--color-ink)]">
                        <Link
                          href={`/teams/${row.team.slug}`}
                          className="flex items-center gap-2.5 group hover:text-[var(--color-brand)] transition-colors"
                        >
                          <TeamLogo
                            name={row.team.name}
                            shortName={row.team.shortName}
                            initials={row.team.initials}
                            logoUrl={row.team.logoUrl}
                            crestBg={row.team.crestBg}
                            crestText={row.team.crestText}
                            size="sm"
                            className="group-hover:scale-105 transition-transform"
                          />
                          <span className="group-hover:underline">
                            {row.team.name}
                          </span>
                        </Link>
                      </Td>

                      {/* P, W, L, NRR, Pts */}
                      <Td numeric>{row.played !== null ? row.played : "—"}</Td>
                      <Td numeric>{row.won !== null ? row.won : "—"}</Td>
                      <Td numeric>{row.lost !== null ? row.lost : "—"}</Td>
                      <Td numeric className="hidden sm:table-cell font-mono text-xs">
                        {row.formattedNRR}
                      </Td>
                      <Td numeric className="font-bold text-[var(--color-ink)]">
                        {row.points !== null ? row.points : "—"}
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
        </CardBody>
      </Card>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-ink-muted)]">
        <p className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] inline-block" />
          <span>
            {standings.hasResults
              ? "Top 4 teams qualify for the playoff stage."
              : "Pre-season initial standings. Top 4 teams qualify for playoffs."}
          </span>
        </p>
        <LinkButton variant="secondary" size="sm" href="/points-table">
          View Full Points Table →
        </LinkButton>
      </div>
    </section>
  );
}

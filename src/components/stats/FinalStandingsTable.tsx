import { FinalStandingsRow } from "@/lib/data/stats-types";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableWrapper } from "@/components/ui/Table";
import { SectionHeader } from "@/components/ui/Layout";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamMeta } from "@/lib/data/stats-registry";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FinalStandingsTableProps {
  standings: FinalStandingsRow[];
  seasonName: string;
}

export function FinalStandingsTable({ standings, seasonName }: FinalStandingsTableProps) {
  if (!standings || standings.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="standings-heading" className="space-y-4">
      <SectionHeader
        title={`${seasonName} — Final League Stage Standings`}
        description="Authoritative final points table following all 28 single round-robin group fixtures. Qualified teams advanced to the Page-Playoffs."
      />

      <div className="bg-[var(--color-canvas)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] overflow-hidden shadow-2xs">
        <TableWrapper>
          <Table>
            <TableHead className="bg-[var(--color-surface)] border-b border-[var(--color-rule)]">
              <tr>
                <Th className="w-12 text-center">Pos</Th>
                <Th className="min-w-[180px]">Franchise Team</Th>
                <Th numeric title="Matches Played">P</Th>
                <Th numeric title="Won">W</Th>
                <Th numeric title="Lost">L</Th>
                <Th numeric title="Tied">T</Th>
                <Th numeric title="No Result / Abandoned">NR</Th>
                <Th numeric title="Points" className="text-[var(--color-ink)]">Pts</Th>
                <Th numeric title="Net Run Rate">NRR</Th>
                <Th className="min-w-[130px] text-right">Playoff Progression</Th>
              </tr>
            </TableHead>
            <TableBody>
              {standings.map((row) => {
                const team = getTeamMeta(row.teamId);
                const isQualifier1 = row.position <= 2;
                const isEliminator = row.position === 3 || row.position === 4;
                const isTop4 = isQualifier1 || isEliminator;

                return (
                  <TableRow
                    key={row.teamId}
                    className={cn(
                      row.position === 4 && "border-b-2 border-emerald-600/30",
                      row.position === 1 && "bg-emerald-50/30"
                    )}
                  >
                    {/* Position */}
                    <Td className="text-center font-bold text-xs">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                          row.position === 1
                            ? "bg-amber-400 text-amber-950 ring-1 ring-amber-500/50"
                            : isTop4
                            ? "bg-emerald-100 text-emerald-900"
                            : "text-[var(--color-ink-muted)] bg-[var(--color-surface)]"
                        )}
                      >
                        {row.position}
                      </span>
                    </Td>

                    {/* Team */}
                    <Td>
                      <Link
                        href={`/teams/${team?.slug || row.teamId}`}
                        className="group flex items-center gap-2.5 hover:text-[var(--color-brand)] transition-colors"
                      >
                        <TeamLogo
                          name={row.teamName}
                          logoUrl={team?.logoUrl}
                          crestBg={team?.crestBg}
                          crestText={team?.crestText}
                          size="xs"
                        />
                        <span className="font-bold text-xs sm:text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand)]">
                          {row.teamName}
                        </span>
                      </Link>
                    </Td>

                    {/* Numerical Stats */}
                    <Td numeric className="text-xs">{row.played ?? "—"}</Td>
                    <Td numeric className="text-xs font-semibold">{row.won ?? "—"}</Td>
                    <Td numeric className="text-xs text-[var(--color-ink-muted)]">{row.lost ?? "—"}</Td>
                    <Td numeric className="text-xs text-[var(--color-ink-muted)]">{row.tied ?? "—"}</Td>
                    <Td numeric className="text-xs text-[var(--color-ink-muted)]">{row.noResult ?? "—"}</Td>
                    <Td numeric className="text-xs sm:text-sm font-black text-[var(--color-ink)] bg-black/[0.02]">
                      {row.points ?? "—"}
                    </Td>
                    <Td
                      numeric
                      className={cn(
                        "text-xs font-mono font-bold",
                        row.netRunRate !== null && row.netRunRate > 0
                          ? "text-emerald-700"
                          : row.netRunRate !== null && row.netRunRate < 0
                          ? "text-rose-700"
                          : "text-[var(--color-ink-muted)]"
                      )}
                    >
                      {row.formattedNRR}
                    </Td>

                    {/* Progression Stage */}
                    <Td className="text-right">
                      {isQualifier1 && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-sm">
                          Qualifier 1
                        </span>
                      )}
                      {isEliminator && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100/80 border border-blue-300 px-2 py-0.5 rounded-sm">
                          Eliminator
                        </span>
                      )}
                      {!isTop4 && (
                        <span className="inline-flex items-center text-[10px] text-[var(--color-ink-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded-sm">
                          Eliminated
                        </span>
                      )}
                    </Td>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>

        {/* Footnote & Qualification Legend */}
        <div className="p-3 sm:p-4 bg-[var(--color-surface)] border-t border-[var(--color-rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-ink-muted)]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Top 2 advance to Qualifier 1 (double chance to reach Final)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>3rd & 4th advance to Eliminator</span>
            </div>
          </div>
          <div className="text-[11px] italic">
            Source: ESPN Cricinfo authoritative table. High confidence.
          </div>
        </div>
      </div>
    </section>
  );
}

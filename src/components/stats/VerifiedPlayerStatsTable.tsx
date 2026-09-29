import { PlayerSeasonStats } from "@/lib/data/stats-types";
import { Table, TableHead, TableBody, TableRow, Th, Td, TableWrapper } from "@/components/ui/Table";
import { SectionHeader } from "@/components/ui/Layout";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamMeta } from "@/lib/data/stats-registry";
import Link from "next/link";

interface VerifiedPlayerStatsTableProps {
  playerStats: PlayerSeasonStats[];
  seasonName: string;
}

function formatStatValue(val: number | string | null | undefined): string {
  if (val === null || val === undefined) {
    return "—";
  }
  return String(val);
}

export function VerifiedPlayerStatsTable({
  playerStats,
  seasonName,
}: VerifiedPlayerStatsTableProps) {
  if (!playerStats || playerStats.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="player-stats-heading" className="space-y-4">
      <SectionHeader
        title={`${seasonName} — Verified Player Statistics`}
        description="Individual tournament records across batting, bowling, and fielding. Unavailable fields are preserved as null ('—') per source integrity guidelines."
      />

      <div className="bg-[var(--color-canvas)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] overflow-hidden shadow-2xs">
        <TableWrapper>
          <Table>
            <TableHead className="bg-[var(--color-surface)] border-b border-[var(--color-rule)]">
              <tr>
                <Th className="min-w-[170px]">Player</Th>
                <Th className="min-w-[150px]">Franchise</Th>
                <Th numeric title="Matches Played">M</Th>
                <Th numeric title="Innings Batted">Inn</Th>
                <Th numeric title="Total Runs Scored">Runs</Th>
                <Th numeric title="Highest Individual Score">HS</Th>
                <Th numeric title="Batting Average">Avg</Th>
                <Th numeric title="Batting Strike Rate">SR</Th>
                <Th numeric title="Wickets Taken">Wkts</Th>
                <Th numeric title="Best Bowling Figures">Best</Th>
                <Th numeric title="Bowling Economy Rate">Econ</Th>
                <Th numeric title="Fours Hit">4s</Th>
                <Th numeric title="Sixes Hit">6s</Th>
                <Th numeric title="Centuries (100s)">100</Th>
                <Th numeric title="Half-Centuries (50s)">50</Th>
                <Th numeric title="Catches Taken">Ct</Th>
                <Th numeric title="Wicketkeeper Dismissals">Dis</Th>
              </tr>
            </TableHead>
            <TableBody>
              {playerStats.map((stat) => {
                const team = getTeamMeta(stat.teamId);

                return (
                  <TableRow key={stat.id}>
                    {/* Player Name */}
                    <Td>
                      {stat.playerSlug ? (
                        <Link
                          href={`/players/${stat.playerSlug}`}
                          className="font-bold text-xs sm:text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors inline-flex items-center gap-1 group"
                        >
                          <span className="group-hover:underline">{stat.playerName}</span>
                          <span className="text-[10px] text-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                            ↗
                          </span>
                        </Link>
                      ) : (
                        <span className="font-bold text-xs sm:text-sm text-[var(--color-ink)]">
                          {stat.playerName}
                        </span>
                      )}
                      {stat.sourceNote && (
                        <span className="text-[10px] text-[var(--color-ink-muted)] block truncate max-w-[200px]" title={stat.sourceNote}>
                          {stat.sourceNote}
                        </span>
                      )}
                    </Td>

                    {/* Team */}
                    <Td>
                      <Link
                        href={`/teams/${team?.slug || stat.teamId}`}
                        className="flex items-center gap-2 group hover:text-[var(--color-brand)] transition-colors"
                      >
                        <TeamLogo
                          name={stat.teamName}
                          logoUrl={team?.logoUrl}
                          crestBg={team?.crestBg}
                          crestText={team?.crestText}
                          size="xs"
                        />
                        <span className="text-xs text-[var(--color-ink-secondary)] group-hover:text-[var(--color-brand)] font-medium">
                          {stat.teamName}
                        </span>
                      </Link>
                    </Td>

                    {/* Batting Metrics */}
                    <Td numeric className="text-xs">{formatStatValue(stat.matches)}</Td>
                    <Td numeric className="text-xs">{formatStatValue(stat.innings)}</Td>
                    <Td numeric className="text-xs font-black text-[var(--color-brand)]">
                      {formatStatValue(stat.runs)}
                    </Td>
                    <Td numeric className="text-xs font-mono">{formatStatValue(stat.highestScore)}</Td>
                    <Td numeric className="text-xs font-mono">{formatStatValue(stat.average)}</Td>
                    <Td numeric className="text-xs font-mono">{formatStatValue(stat.strikeRate)}</Td>

                    {/* Bowling Metrics */}
                    <Td numeric className="text-xs font-black text-emerald-800">
                      {formatStatValue(stat.wickets)}
                    </Td>
                    <Td numeric className="text-xs font-mono">{formatStatValue(stat.bestBowling)}</Td>
                    <Td numeric className="text-xs font-mono">{formatStatValue(stat.economy)}</Td>

                    {/* Milestones */}
                    <Td numeric className="text-xs">{formatStatValue(stat.fours)}</Td>
                    <Td numeric className="text-xs">{formatStatValue(stat.sixes)}</Td>
                    <Td numeric className="text-xs">{formatStatValue(stat.hundreds)}</Td>
                    <Td numeric className="text-xs">{formatStatValue(stat.fifties)}</Td>

                    {/* Fielding */}
                    <Td numeric className="text-xs text-[var(--color-ink-muted)]">{formatStatValue(stat.catches)}</Td>
                    <Td numeric className="text-xs text-[var(--color-ink-muted)]">{formatStatValue(stat.wicketkeeperDismissals)}</Td>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>

        {/* Footnote */}
        <div className="p-3 sm:p-4 bg-[var(--color-surface)] border-t border-[var(--color-rule)] text-xs text-[var(--color-ink-muted)] space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-ink)]">Integrity Notice:</span>
            <span>A dash (&quot;—&quot;) denotes fields marked NOT FOUND in canonical research records. Values are never estimated or replaced with zero.</span>
          </div>
          <div className="text-[11px]">
            Abbreviations: M = Matches, Inn = Innings, HS = Highest Score, Avg = Batting Average, SR = Strike Rate, Wkts = Wickets, Best = Best Bowling, Econ = Economy Rate, Ct = Catches, Dis = Dismissals.
          </div>
        </div>
      </div>
    </section>
  );
}

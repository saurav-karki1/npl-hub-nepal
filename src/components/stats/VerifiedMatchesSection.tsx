import { VerifiedLeagueMatch } from "@/lib/data/stats-types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamMeta } from "@/lib/data/stats-registry";
import Link from "next/link";

interface VerifiedMatchesSectionProps {
  matches: VerifiedLeagueMatch[];
  seasonName: string;
}

export function VerifiedMatchesSection({ matches, seasonName }: VerifiedMatchesSectionProps) {
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="verified-matches-heading" className="space-y-4">
      <SectionHeader
        title={`${seasonName} — Verified League Match Scorecards`}
        description="7 of 28 league matches have fully verified scorecards in the current repository. The remaining 21 fixture scorecards are queued for import from ESPN Cricinfo."
      />

      {/* Progress Banner */}
      <div className="rounded-[var(--radius-md)] border border-amber-300 bg-amber-50/60 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" aria-hidden="true" />
        <div>
          <strong className="font-semibold block mb-0.5">Scorecard Verification Status:</strong>
          7 scorecards verified (25% of group stage). Unscored matches are deliberately omitted from this section rather than guessing winning margins or scores. Player of the Match was NOT FOUND in league research and is not guessed.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {matches.map((match) => {
          const team1Meta = getTeamMeta(match.team1.id);
          const team2Meta = getTeamMeta(match.team2.id);

          return (
            <Card key={match.matchNumber} className="border-[var(--color-rule)]">
              <CardHeader className="bg-[var(--color-surface)] py-2 px-3.5 border-b border-[var(--color-rule)] flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-[var(--color-ink)]">
                  Match #{match.matchNumber}
                </span>
                <span className="text-[var(--color-ink-muted)] text-[11px]">
                  {match.formattedDate}
                </span>
              </CardHeader>

              <CardBody className="p-3.5 space-y-2.5">
                {/* Team 1 */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo
                      name={match.team1.name}
                      logoUrl={team1Meta?.logoUrl}
                      crestBg={team1Meta?.crestBg}
                      crestText={team1Meta?.crestText}
                      size="xs"
                    />
                    <Link
                      href={`/teams/${team1Meta?.slug || match.team1.id}`}
                      className="font-bold text-xs text-[var(--color-ink)] hover:text-[var(--color-brand)] truncate transition-colors"
                    >
                      {match.team1.name}
                    </Link>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs">
                    <span className="font-bold text-[var(--color-ink)]">{match.team1.score}</span>
                    <span className="text-[10px] text-[var(--color-ink-muted)] ml-1">({match.team1.overs})</span>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo
                      name={match.team2.name}
                      logoUrl={team2Meta?.logoUrl}
                      crestBg={team2Meta?.crestBg}
                      crestText={team2Meta?.crestText}
                      size="xs"
                    />
                    <Link
                      href={`/teams/${team2Meta?.slug || match.team2.id}`}
                      className="font-bold text-xs text-[var(--color-ink)] hover:text-[var(--color-brand)] truncate transition-colors"
                    >
                      {match.team2.name}
                    </Link>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs">
                    <span className="font-bold text-[var(--color-ink)]">{match.team2.score}</span>
                    <span className="text-[10px] text-[var(--color-ink-muted)] ml-1">({match.team2.overs})</span>
                  </div>
                </div>

                {/* Result */}
                <div className="pt-2 border-t border-[var(--color-rule)]">
                  <span className="text-[11px] font-semibold text-[var(--color-brand)] block truncate">
                    {match.result}
                  </span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

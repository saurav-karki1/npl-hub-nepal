import { PlayoffMatch } from "@/lib/data/stats-types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamMeta } from "@/lib/data/stats-registry";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlayoffsSectionProps {
  playoffs: PlayoffMatch[];
  seasonName: string;
}

export function PlayoffsSection({ playoffs, seasonName }: PlayoffsSectionProps) {
  if (!playoffs || playoffs.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="playoffs-heading" className="space-y-4">
      <SectionHeader
        title={`${seasonName} — Page-Playoff Results`}
        description="The 4-stage Page-Playoff phase deciding the NPL Season 2 championship at TU International Cricket Ground."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playoffs.map((match) => {
          const team1Meta = getTeamMeta(match.team1.id);
          const team2Meta = getTeamMeta(match.team2.id);
          const isFinal = match.stage === "Final";

          return (
            <Card
              key={match.id}
              className={cn(
                "border-[var(--color-rule)] flex flex-col justify-between overflow-hidden",
                isFinal && "ring-1 ring-amber-400/50 border-amber-300/60 bg-amber-50/10"
              )}
            >
              <div>
                {/* Match Header */}
                <CardHeader
                  className={cn(
                    "py-2.5 px-4 border-b border-[var(--color-rule)] flex items-center justify-between",
                    isFinal ? "bg-amber-100/50" : "bg-[var(--color-surface)]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm",
                        isFinal
                          ? "bg-amber-500 text-amber-950 font-black"
                          : "bg-emerald-900 text-emerald-100"
                      )}
                    >
                      {match.stage}
                    </span>
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {match.formattedDate}
                    </span>
                  </div>

                  <span className="text-[10px] text-[var(--color-ink-muted)]">
                    TU Cricket Ground
                  </span>
                </CardHeader>

                <CardBody className="p-4 sm:p-5 space-y-3.5">
                  {/* Teams and Scores */}
                  <div className="space-y-2">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TeamLogo
                          name={match.team1.name}
                          logoUrl={team1Meta?.logoUrl}
                          crestBg={team1Meta?.crestBg}
                          crestText={team1Meta?.crestText}
                          size="xs"
                        />
                        <Link
                          href={`/teams/${team1Meta?.slug || match.team1.id}`}
                          className="font-bold text-xs sm:text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] truncate transition-colors"
                        >
                          {match.team1.name}
                        </Link>
                      </div>

                      <div className="text-right shrink-0">
                        {match.team1.score ? (
                          <div className="font-mono">
                            <span className="font-bold text-sm text-[var(--color-ink)]">
                              {match.team1.score}
                            </span>
                            {match.team1.overs && (
                              <span className="text-[11px] text-[var(--color-ink-muted)] ml-1">
                                ({match.team1.overs})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-muted)] italic">
                            —
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TeamLogo
                          name={match.team2.name}
                          logoUrl={team2Meta?.logoUrl}
                          crestBg={team2Meta?.crestBg}
                          crestText={team2Meta?.crestText}
                          size="xs"
                        />
                        <Link
                          href={`/teams/${team2Meta?.slug || match.team2.id}`}
                          className="font-bold text-xs sm:text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] truncate transition-colors"
                        >
                          {match.team2.name}
                        </Link>
                      </div>

                      <div className="text-right shrink-0">
                        {match.team2.score ? (
                          <div className="font-mono">
                            <span className="font-bold text-sm text-[var(--color-ink)]">
                              {match.team2.score}
                            </span>
                            {match.team2.overs && (
                              <span className="text-[11px] text-[var(--color-ink-muted)] ml-1">
                                ({match.team2.overs})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-muted)] italic">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Result Banner */}
                  <div
                    className={cn(
                      "p-2.5 rounded-[var(--radius-sm)] border text-xs font-semibold flex items-center justify-between",
                      isFinal
                        ? "bg-amber-100/70 border-amber-300 text-amber-950 font-bold"
                        : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                    )}
                  >
                    <span>{match.result}</span>
                    {isFinal && (
                      <span className="text-[10px] uppercase font-black tracking-wider text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                        Champions
                      </span>
                    )}
                  </div>

                  {/* Missing Scorecard Note for Qualifier 2 */}
                  {!match.scorecardAvailable && (
                    <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)] text-[11px] text-[var(--color-ink-muted)] leading-relaxed italic">
                      {match.notes || "Complete scorecard was marked NOT FOUND in primary records. Margin confirmed by editorial and radio reports."}
                    </div>
                  )}

                  {/* Player of the Match if available */}
                  {match.playerOfTheMatch ? (
                    <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-xs">
                      <span className="text-[var(--color-ink-muted)]">Player of the Final:</span>
                      <span className="font-bold text-[var(--color-ink)]">
                        {match.playerOfTheMatch.name}{" "}
                        <span className="font-normal text-[var(--color-ink-muted)]">
                          ({match.playerOfTheMatch.stats})
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
                      <span>Player of the Match:</span>
                      <span className="italic">Not recorded</span>
                    </div>
                  )}
                </CardBody>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

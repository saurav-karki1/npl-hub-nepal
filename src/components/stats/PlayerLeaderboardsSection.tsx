import { Leaderboards } from "@/lib/data/stats-types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamMeta } from "@/lib/data/stats-registry";
import Link from "next/link";

interface PlayerLeaderboardsSectionProps {
  leaderboards: Leaderboards;
  seasonName: string;
}

export function PlayerLeaderboardsSection({
  leaderboards,
  seasonName,
}: PlayerLeaderboardsSectionProps) {
  const battingCategories = Object.entries(leaderboards.batting || {});
  const bowlingCategories = Object.entries(leaderboards.bowling || {});

  if (battingCategories.length === 0 && bowlingCategories.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="leaderboards-heading" className="space-y-6">
      <SectionHeader
        title={`${seasonName} — Verified Player Leaderboards`}
        description="Individual performance leaders across batting and bowling categories. Sourced strictly from verified tournament scorecards."
      />

      {/* Verification Notice */}
      <div className="rounded-[var(--radius-md)] border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" aria-hidden="true" />
        <div>
          <strong className="font-semibold block mb-0.5">Authoritative Source Notice:</strong>
          Full Top 10/20 leaderboards were unavailable in primary records. Only confirmed category leaders are displayed below. Unverified categories (Bowling Economy, Bowling Average, 4W/5W hauls, Catches, and Wicketkeeper Dismissals) remain unpopulated per NPL Hub integrity standards.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── BATTING LEADERS ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-rule)] pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
            <h3 className="text-base font-bold text-[var(--color-ink)]">
              Batting Leaders
            </h3>
            <span className="text-xs text-[var(--color-ink-muted)] ml-auto">
              {battingCategories.length} Verified Categories
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {battingCategories.map(([key, category]) => (
              <Card key={key} className="border-[var(--color-rule)]">
                <CardHeader className="bg-[var(--color-surface)] py-2 px-3.5 border-b border-[var(--color-rule)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      {category.title}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-ink-muted)]">
                      {category.metric}
                    </span>
                  </div>
                </CardHeader>
                <CardBody className="p-3 space-y-2">
                  {category.items.map((item) => {
                    const team = getTeamMeta(item.teamId);
                    return (
                      <div
                        key={`${item.rank}-${item.playerName}`}
                        className="flex items-center justify-between gap-2 py-1 border-b border-[var(--color-rule)] last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono font-bold text-[var(--color-ink-muted)] w-4 text-center shrink-0">
                            #{item.rank}
                          </span>
                          <TeamLogo
                            name={item.teamName}
                            logoUrl={team?.logoUrl}
                            crestBg={team?.crestBg}
                            crestText={team?.crestText}
                            size="xs"
                          />
                          <div className="min-w-0 truncate">
                            {item.playerSlug ? (
                              <Link
                                href={`/players/${item.playerSlug}`}
                                className="font-bold text-xs text-[var(--color-ink)] hover:text-[var(--color-brand)] truncate block transition-colors"
                              >
                                {item.playerName}
                              </Link>
                            ) : (
                              <span className="font-bold text-xs text-[var(--color-ink)] truncate block">
                                {item.playerName}
                              </span>
                            )}
                            <span className="text-[10px] text-[var(--color-ink-muted)] truncate block">
                              {item.secondaryDetail || item.teamName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-[var(--color-brand)]">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* ── BOWLING LEADERS ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-rule)] pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
            <h3 className="text-base font-bold text-[var(--color-ink)]">
              Bowling Leaders
            </h3>
            <span className="text-xs text-[var(--color-ink-muted)] ml-auto">
              {bowlingCategories.length} Verified Categories
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {bowlingCategories.map(([key, category]) => (
              <Card key={key} className="border-[var(--color-rule)]">
                <CardHeader className="bg-[var(--color-surface)] py-2 px-3.5 border-b border-[var(--color-rule)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      {category.title}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-ink-muted)]">
                      {category.metric}
                    </span>
                  </div>
                </CardHeader>
                <CardBody className="p-3 space-y-2">
                  {category.items.map((item) => {
                    const team = getTeamMeta(item.teamId);
                    return (
                      <div
                        key={`${item.rank}-${item.playerName}`}
                        className="flex items-center justify-between gap-2 py-1 border-b border-[var(--color-rule)] last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono font-bold text-[var(--color-ink-muted)] w-4 text-center shrink-0">
                            #{item.rank}
                          </span>
                          <TeamLogo
                            name={item.teamName}
                            logoUrl={team?.logoUrl}
                            crestBg={team?.crestBg}
                            crestText={team?.crestText}
                            size="xs"
                          />
                          <div className="min-w-0 truncate">
                            {item.playerSlug ? (
                              <Link
                                href={`/players/${item.playerSlug}`}
                                className="font-bold text-xs text-[var(--color-ink)] hover:text-[var(--color-brand)] truncate block transition-colors"
                              >
                                {item.playerName}
                              </Link>
                            ) : (
                              <span className="font-bold text-xs text-[var(--color-ink)] truncate block">
                                {item.playerName}
                              </span>
                            )}
                            <span className="text-[10px] text-[var(--color-ink-muted)] truncate block">
                              {item.secondaryDetail || item.teamName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-emerald-800">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Pending bowling metrics box */}
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-rule)] text-xs text-[var(--color-ink-muted)] space-y-1">
            <span className="font-semibold text-[var(--color-ink)] block">
              Additional Bowling Metrics (Pending Scorecards)
            </span>
            <p className="text-[11px] leading-relaxed">
              Economy rates, bowling averages, 4-wicket hauls, and 5-wicket hauls remain unverified until the remaining 21 match scorecards are extracted from ESPN/Cricbuzz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

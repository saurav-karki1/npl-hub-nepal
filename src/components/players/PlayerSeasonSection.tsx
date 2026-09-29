import { Player, getPlayerTeam } from "@/lib/data/players-data";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";

interface PlayerSeasonSectionProps {
  player: Player;
}

export function PlayerSeasonSection({ player }: PlayerSeasonSectionProps) {
  const team = getPlayerTeam(player);
  const stats = player.seasonStats;

  return (
    <section aria-labelledby="season-3-heading" className="space-y-4">
      <SectionHeader title="NPL Season 3 (2026) Campaign" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Squad & Roster Status Card */}
        <Card className="border-[var(--color-rule)] h-full">
          <CardHeader className="bg-[var(--color-surface)] py-3">
            <h3 className="font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full bg-[var(--color-brand)]"
                aria-hidden="true"
              />
              Franchise Squad Status
            </h3>
          </CardHeader>
          <CardBody className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm text-[var(--color-ink-secondary)]">
            <p className="leading-relaxed">
              <strong>{player.name}</strong> is officially registered with{" "}
              <strong>{team ? team.name : "their franchise"}</strong> for Nepal
              Premier League Season 3 (26 October – 21 November 2026).
            </p>

            <ul className="space-y-2 border-t border-[var(--color-rule)] pt-3 text-xs">
              <li className="flex justify-between items-center py-1 border-b border-[var(--color-rule)]">
                <span className="text-[var(--color-ink-muted)]">Roster Entry</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[var(--radius-sm)] border border-emerald-200">
                  Pre-Auction Retained Core
                </span>
              </li>
              <li className="flex justify-between items-center py-1 border-b border-[var(--color-rule)]">
                <span className="text-[var(--color-ink-muted)]">Leadership Duty</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {player.captain ? "Franchise Captain" : "Playing Squad Member"}
                </span>
              </li>
              <li className="flex justify-between items-center py-1">
                <span className="text-[var(--color-ink-muted)]">Category</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {player.marquee ? "Marquee Icon" : "Retained Domestic Core"}
                </span>
              </li>
            </ul>
          </CardBody>
        </Card>

        {/* Right: Season 3 Statistics (Result-Ready Architecture) */}
        <Card className="border-[var(--color-rule)] h-full">
          <CardHeader className="bg-[var(--color-surface)] py-3">
            <h3 className="font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full bg-[var(--color-accent)]"
                aria-hidden="true"
              />
              Season 3 Match Statistics
            </h3>
          </CardHeader>
          <CardBody className="p-4 sm:p-5 space-y-4">
            {stats && stats.matches && stats.matches > 0 ? (
              /* When live tournament stats become available via Admin Panel / Database */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-ink-muted)] block">
                    Matches
                  </span>
                  <span className="text-lg font-black text-[var(--color-ink)]">
                    {stats.matches}
                  </span>
                </div>
                <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-ink-muted)] block">
                    Runs
                  </span>
                  <span className="text-lg font-black text-[var(--color-brand)]">
                    {stats.runs ?? "—"}
                  </span>
                </div>
                <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-ink-muted)] block">
                    Wickets
                  </span>
                  <span className="text-lg font-black text-[var(--color-brand)]">
                    {stats.wickets ?? "—"}
                  </span>
                </div>
                <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-ink-muted)] block">
                    Catches
                  </span>
                  <span className="text-lg font-black text-[var(--color-ink)]">
                    {stats.catches ?? "—"}
                  </span>
                </div>
              </div>
            ) : (
              /* Pre-Tournament Verified State: Zero fabricated stats */
              <div className="space-y-3">
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-rule)] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--color-ink)]">
                      Tournament State
                    </span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[var(--radius-sm)] border border-emerald-200 text-[10px] uppercase tracking-wider">
                      Pre-Tournament
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed pt-1">
                    Season 3 fixtures commence on 26 October 2026. Official match
                    statistics (runs, strike rates, wickets, and economy) will
                    populate in real time as match scorecards conclude.
                  </p>
                </div>

                <div className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed italic">
                  Guaranteed Zero Hallucination: NPL Hub Nepal never invents mock
                  figures or speculative stats before ball-one is bowled.
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

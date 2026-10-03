import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export function AboutFormatSection() {
  const playoffSteps = [
    {
      title: "Qualifier 1 (Match #29)",
      badge: "Double Chance",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      teams: "Rank 1 vs Rank 2",
      progression:
        "The top two teams on the league points table battle for direct entry to the Final. The winner advances straight to the Grand Final, while the loser earns a second opportunity in Qualifier 2.",
    },
    {
      title: "Eliminator (Match #30)",
      badge: "Knockout",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      teams: "Rank 3 vs Rank 4",
      progression:
        "Teams finishing 3rd and 4th face sudden death. The winner stays alive to contest Qualifier 2, while the loser is immediately eliminated from NPL Season 3 contention.",
    },
    {
      title: "Qualifier 2 (Match #31)",
      badge: "Semi-Final",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      teams: "Loser Q1 vs Winner Eliminator",
      progression:
        "The loser of Qualifier 1 takes on the high-momentum winner of the Eliminator. The winner captures the second spot in the Grand Final, while the loser exits the tournament.",
    },
    {
      title: "Grand Final (Match #32)",
      badge: "Championship",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
      teams: "Winner Q1 vs Winner Q2",
      progression:
        "The crowning match of the season between the winners of Qualifier 1 and Qualifier 2. The winning team lifts the prestigious Siddhartha Bank Nepal Premier League Season 3 Trophy.",
    },
  ];

  return (
    <section aria-labelledby="format-rules-heading" className="space-y-6">
      <SectionHeader
        title="Tournament Format & Competition Rules"
        action={{ label: "Live Points Table", href: "/points-table" }}
      />

      <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed max-w-3xl">
        NPL Season 3 uses an internationally recognized franchise Twenty20 structure:
        a single round-robin group phase of 28 fixtures, followed by a 4-team
        Page-Playoff system designed to reward regular season consistency.
      </p>

      {/* Two columns: League Phase Rules & Tiebreaker vs Playoff System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: League Stage & Points System */}
        <div className="space-y-4">
          <Card className="border-[var(--color-rule)] h-full">
            <CardHeader className="bg-[var(--color-surface)] py-3">
              <h3 className="font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-[var(--color-brand)]"
                  aria-hidden="true"
                />
                1. Round-Robin League Stage (28 Matches)
              </h3>
            </CardHeader>
            <CardBody className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm text-[var(--color-ink-secondary)]">
              <p className="leading-relaxed">
                Every franchise plays each of the other 7 teams once during the
                group stage. Each franchise contests 7 league matches to determine
                their rank on the unified standings table.
              </p>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-3 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] block">
                  Points Allocation
                </span>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex justify-between items-center py-1 border-b border-[var(--color-rule)]">
                    <span>Match Win</span>
                    <strong className="text-[var(--color-brand)] font-bold text-sm">
                      2 Points
                    </strong>
                  </li>
                  <li className="flex justify-between items-center py-1 border-b border-[var(--color-rule)]">
                    <span>Tie / No Result / Weather Abandoned</span>
                    <strong className="text-[var(--color-ink)] font-bold text-sm">
                      1 Point
                    </strong>
                  </li>
                  <li className="flex justify-between items-center py-1">
                    <span>Match Loss</span>
                    <span className="text-[var(--color-ink-muted)] text-sm">
                      0 Points
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] block">
                  Net Run Rate (NRR) Formula & Tiebreakers
                </span>
                <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                  When two or more teams finish tied on points, rank is decided by
                  the following hierarchy:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[var(--color-ink-secondary)] pl-1">
                  <li>Superior Net Run Rate (NRR)</li>
                  <li>Greater number of total match wins</li>
                  <li>Head-to-head match result between tied teams</li>
                </ol>
                <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] p-2.5 rounded-[var(--radius-sm)] font-mono text-[11px] text-[var(--color-ink)] text-center mt-2">
                  NRR = (Runs Scored ÷ Overs Faced) − (Runs Conceded ÷ Overs Bowled)
                </div>
                <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed italic">
                  Note: If a side is bowled out before completing 20 overs, their overs
                  faced count as the full 20.0 overs for NRR computation.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: 4-Team Page Playoff System */}
        <div className="space-y-4">
          <Card className="border-[var(--color-rule)] h-full">
            <CardHeader className="bg-[var(--color-surface)] py-3">
              <h3 className="font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-[var(--color-accent)]"
                  aria-hidden="true"
                />
                2. Page-Playoff Progression (4 Matches)
              </h3>
            </CardHeader>
            <CardBody className="p-4 sm:p-5 space-y-3.5">
              <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                Only the top 4 teams on the points table qualify for the post-season.
                The Page system gives the top two seeds an advantage via a second
                chance.
              </p>

              <div className="space-y-3">
                {playoffSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-[var(--color-ink)]">
                        {step.title}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[var(--radius-sm)] border ${step.badgeColor}`}
                      >
                        {step.badge}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-brand)] block">
                      {step.teams}
                    </span>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      {step.progression}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Cross Links Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[var(--color-ink-muted)]">
          Follow real-time calculations and top-4 cutoff scenarios on our dedicated table.
        </p>
        <div className="flex items-center gap-2">
          <LinkButton href="/points-table" variant="secondary" size="sm">
            View Points Table Rules →
          </LinkButton>
          <LinkButton href="/schedule" variant="primary" size="sm">
            Full 32 Fixtures →
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

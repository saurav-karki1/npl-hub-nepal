import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export function PointsTableRules() {
  return (
    <section aria-labelledby="rules-heading" className="space-y-6 pt-4">
      <h2 id="rules-heading" className="text-xl sm:text-2xl font-black text-[var(--color-ink)] border-b border-[var(--color-rule)] pb-3">
        Tournament Rules & Playoff System
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Points System Card */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-3">
            <h3 className="font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
              1. Points System
            </h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3 text-xs leading-relaxed text-[var(--color-ink-secondary)]">
            <ul className="space-y-2">
              <li className="flex items-center justify-between pb-1.5 border-b border-[var(--color-rule)]">
                <span>Match Win</span>
                <span className="font-bold text-[var(--color-brand)] text-sm">2 Points</span>
              </li>
              <li className="flex items-center justify-between pb-1.5 border-b border-[var(--color-rule)]">
                <span>Tie / No Result / Washout</span>
                <span className="font-semibold text-[var(--color-ink)] text-sm">1 Point</span>
              </li>
              <li className="flex items-center justify-between pb-1.5 border-b border-[var(--color-rule)]">
                <span>Match Loss</span>
                <span className="font-medium text-[var(--color-ink-muted)] text-sm">0 Points</span>
              </li>
            </ul>

            <div className="pt-2">
              <span className="font-bold text-[var(--color-ink)] block mb-1">
                Tie-Breaker Hierarchy:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-[var(--color-ink-muted)]">
                <li>Higher total points</li>
                <li>Superior Net Run Rate (NRR)</li>
                <li>Most total match wins</li>
                <li>Head-to-head match result</li>
              </ol>
            </div>
          </CardBody>
        </Card>

        {/* 2. NRR Calculation Card */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-3">
            <h3 className="font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
              2. Net Run Rate (NRR)
            </h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3 text-xs leading-relaxed text-[var(--color-ink-secondary)]">
            <p>
              Net Run Rate is the primary tie-breaker separating teams tied on points in tournament cricket.
            </p>

            <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] p-2.5 rounded-[var(--radius-sm)] font-mono text-[11px] text-[var(--color-ink)] text-center">
              NRR = (Runs For ÷ Overs Faced) − (Runs Conceded ÷ Overs Bowled)
            </div>

            <div className="space-y-1.5 text-[var(--color-ink-muted)]">
              <p>
                <strong className="text-[var(--color-ink)] font-semibold">All-Out Quota Rule:</strong> If a side is bowled out before completing their 20 overs, their overs faced are counted as the full 20.0 overs.
              </p>
              <p>
                <strong className="text-[var(--color-ink)] font-semibold">Abandoned Matches:</strong> Fixtures abandoned without a result are excluded from NRR calculations.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 3. Playoff Structure Card */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-3">
            <h3 className="font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" aria-hidden="true" />
              3. Playoff Format (Page System)
            </h3>
          </CardHeader>
          <CardBody className="p-4 space-y-2.5 text-xs leading-relaxed text-[var(--color-ink-secondary)]">
            <div className="space-y-2">
              <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)]">
                <span className="font-bold text-[var(--color-ink)] block">
                  Match #29 · Qualifier 1 (17 Nov)
                </span>
                <span className="text-[var(--color-ink-muted)]">
                  Rank 1 vs Rank 2. Winner → Final. Loser → Qualifier 2.
                </span>
              </div>

              <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)]">
                <span className="font-bold text-[var(--color-ink)] block">
                  Match #30 · Eliminator (18 Nov)
                </span>
                <span className="text-[var(--color-ink-muted)]">
                  Rank 3 vs Rank 4. Winner → Qualifier 2. Loser eliminated.
                </span>
              </div>

              <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)]">
                <span className="font-bold text-[var(--color-ink)] block">
                  Match #31 · Qualifier 2 (19 Nov)
                </span>
                <span className="text-[var(--color-ink-muted)]">
                  Loser Q1 vs Winner Eliminator. Winner → Final.
                </span>
              </div>

              <div className="p-2 rounded-[var(--radius-sm)] bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-950 block">
                  Match #32 · Grand Final (21 Nov)
                </span>
                <span className="text-emerald-800">
                  Winner Q1 vs Winner Q2. Decides NPL Season 3 Champion.
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-xs text-[var(--color-ink-muted)]">
          All 32 fixtures (28 League + 4 Playoffs) take place at Tribhuvan University International Cricket Stadium, Kirtipur.
        </p>
        <LinkButton href="/schedule" variant="secondary" size="sm">
          View Complete 32-Match Schedule →
        </LinkButton>
      </div>
    </section>
  );
}

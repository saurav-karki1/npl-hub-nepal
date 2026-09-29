import { SeasonStatsDataset } from "@/lib/data/stats-types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";

interface PreTournamentStatsStateProps {
  dataset: SeasonStatsDataset;
}

export function PreTournamentStatsState({ dataset }: PreTournamentStatsStateProps) {
  const { summary, preTournamentNotice } = dataset;

  return (
    <div className="space-y-8">
      {/* ── 1. Main Pre-Tournament Callout ── */}
      <Card className="border-amber-300/80 bg-amber-50/40 overflow-hidden shadow-xs">
        <CardHeader className="bg-amber-100/70 py-3.5 px-5 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
            <h2 className="text-base font-bold text-amber-950">
              {preTournamentNotice?.title || "Season 3 Statistics Are Not Available Yet"}
            </h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-sm border border-amber-300">
            Pre-Tournament
          </span>
        </CardHeader>

        <CardBody className="p-5 sm:p-6 space-y-4">
          <p className="text-sm sm:text-base text-amber-950/90 leading-relaxed max-w-3xl">
            {preTournamentNotice?.message ||
              "Nepal Premier League Season 3 commences on 26 October 2026. Tournament statistics will appear after verified Season 3 matches are played."}
          </p>

          <div className="p-3.5 rounded-[var(--radius-md)] bg-white/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold block mb-0.5">Zero Hallucination Guarantee:</strong>
            NPL Hub Nepal strictly avoids displaying zero-padded scorecards (0 runs, 0 wickets, 0 matches) or mock player rankings before a tournament begins. Statistics will be recorded directly from certified match scorecards once ball-one is bowled at TU Cricket Stadium.
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <LinkButton href="/schedule" variant="primary" size="sm">
              View Match Schedule (32 Fixtures) →
            </LinkButton>
            <LinkButton href="/teams" variant="secondary" size="sm">
              Explore 8 Franchise Squads →
            </LinkButton>
            <LinkButton href="/players" variant="ghost" size="sm">
              Browse Retained Players →
            </LinkButton>
          </div>
        </CardBody>
      </Card>

      {/* ── 2. Tournament Overview Factsheet ── */}
      <section aria-labelledby="s3-overview-heading" className="space-y-4">
        <SectionHeader
          title="NPL Season 3 (2026) Specifications"
          description="Confirmed dates, venue, and structural parameters for the upcoming championship."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[var(--color-rule)]">
            <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Tournament Dates
              </span>
            </CardHeader>
            <CardBody className="p-4 space-y-1">
              <span className="text-sm font-bold text-[var(--color-ink)] block">
                {summary.dates}
              </span>
              <span className="text-xs text-[var(--color-ink-muted)] block">
                ९ कार्तिक – ६ मंसिर २०८३ (BS)
              </span>
            </CardBody>
          </Card>

          <Card className="border-[var(--color-rule)]">
            <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Host Venue
              </span>
            </CardHeader>
            <CardBody className="p-4 space-y-1">
              <span className="text-sm font-bold text-[var(--color-ink)] block">
                TU Cricket Stadium
              </span>
              <span className="text-xs text-[var(--color-ink-muted)] block">
                Kirtipur, Kathmandu (All 32 fixtures)
              </span>
            </CardBody>
          </Card>

          <Card className="border-[var(--color-rule)]">
            <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Match Quota
              </span>
            </CardHeader>
            <CardBody className="p-4 space-y-1">
              <span className="text-sm font-bold text-[var(--color-ink)] block">
                32 Matches Total
              </span>
              <span className="text-xs text-[var(--color-ink-muted)] block">
                28 League + 4 Page-Playoffs
              </span>
            </CardBody>
          </Card>

          <Card className="border-[var(--color-rule)]">
            <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Points System
              </span>
            </CardHeader>
            <CardBody className="p-4 space-y-1">
              <span className="text-sm font-bold text-[var(--color-ink)] block">
                2 – 1 – 0
              </span>
              <span className="text-xs text-[var(--color-ink-muted)] block">
                Win: 2 pts · Tie/NR: 1 pt · Loss: 0
              </span>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ── 3. Future Statistics Architecture Preview ── */}
      <section aria-labelledby="live-architecture-heading" className="space-y-4">
        <SectionHeader
          title="What Statistics Will Appear During Tournament Play"
          description="The statistical engine is built and awaiting verified match input from official scorecards."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {preTournamentNotice?.features.map((feature, idx) => (
            <Card key={idx} className="border-[var(--color-rule)]">
              <CardBody className="p-4 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-medium text-[var(--color-ink)] leading-snug">
                  {feature}
                </span>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

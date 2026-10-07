import { Card, CardBody } from "@/components/ui/Card";
import { TOURNAMENT_INFO } from "@/lib/repository/matches";

export function TournamentSummary() {
  const info = TOURNAMENT_INFO;

  return (
    <section aria-labelledby="tournament-info-heading" className="space-y-4">
      <h2 id="tournament-info-heading" className="sr-only">
        Tournament Information & Overview
      </h2>

      <Card className="border-[var(--color-rule)] bg-[var(--color-surface)]">
        <CardBody className="p-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-rule)]">
            {/* Field 1 */}
            <div className="pt-2 sm:pt-0 sm:pr-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Tournament
              </span>
              <span className="font-bold text-sm sm:text-base text-[var(--color-ink)] mt-0.5 block">
                {info.name}
              </span>
              <span className="text-xs text-[var(--color-brand)] font-semibold">
                {info.season}
              </span>
            </div>

            {/* Field 2 */}
            <div className="pt-2 sm:pt-0 sm:px-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Format
              </span>
              <span className="font-bold text-sm sm:text-base text-[var(--color-ink)] mt-0.5 block">
                {info.format}
              </span>
              <span className="text-xs text-[var(--color-ink-muted)]">
                White Ball T20
              </span>
            </div>

            {/* Field 3 */}
            <div className="pt-2 sm:pt-0 sm:px-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Country
              </span>
              <span className="font-bold text-sm sm:text-base text-[var(--color-ink)] mt-0.5 block">
                {info.country}
              </span>
              <span className="text-xs text-[var(--color-ink-muted)]">
                TU Kirtipur
              </span>
            </div>

            {/* Field 4 */}
            <div className="pt-2 sm:pt-0 sm:px-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Matches
              </span>
              <span className="font-bold text-sm sm:text-base text-[var(--color-ink)] mt-0.5 block">
                {info.totalMatches} Fixtures
              </span>
              <span className="text-xs text-[var(--color-ink-muted)]">
                28 League + 4 Playoffs
              </span>
            </div>

            {/* Field 5 */}
            <div className="pt-2 sm:pt-0 sm:px-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Teams
              </span>
              <span className="font-bold text-sm sm:text-base text-[var(--color-ink)] mt-0.5 block">
                {info.totalTeams} Franchises
              </span>
              <span className="text-xs text-[var(--color-ink-muted)]">
                Provinces & Cities
              </span>
            </div>

            {/* Field 6 */}
            <div className="pt-2 sm:pt-0 sm:pl-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Tournament Dates
              </span>
              <span className="font-bold text-sm sm:text-base text-[var(--color-brand)] mt-0.5 block">
                26 Oct – 21 Nov 2026
              </span>
              <span className="text-xs text-[var(--color-ink-muted)]">
                ९ कार्तिक – ५ मंसिर २०८३
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

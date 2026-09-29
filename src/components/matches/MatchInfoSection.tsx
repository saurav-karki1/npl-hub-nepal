import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ScheduleMatch } from "@/lib/data/schedule-data";

interface MatchInfoSectionProps {
  match: ScheduleMatch;
}

export function MatchInfoSection({ match }: MatchInfoSectionProps) {
  const isPlayoff = match.stage !== "League";

  return (
    <section aria-labelledby="match-facts-heading" className="space-y-4">
      <div className="border-b border-[var(--color-rule)] pb-2.5">
        <h2 id="match-facts-heading" className="text-lg sm:text-xl font-black text-[var(--color-ink)]">
          Match Details & Venue Information
        </h2>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
          Essential match parameters, schedule metadata, and venue specifications for NPL Season 3.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Match Specification Factsheet */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
              Fixture Factsheet
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <dl className="divide-y divide-[var(--color-rule)] text-xs">
              <div className="flex items-center justify-between py-2.5 px-4">
                <dt className="text-[var(--color-ink-muted)] font-medium">Match Number</dt>
                <dd className="font-bold text-[var(--color-ink)]">Match #{match.matchNumber}</dd>
              </div>

              <div className="flex items-center justify-between py-2.5 px-4">
                <dt className="text-[var(--color-ink-muted)] font-medium">Tournament Stage</dt>
                <dd className="font-bold text-[var(--color-brand)]">
                  {match.stage} {isPlayoff ? "Playoff" : "Stage"}
                </dd>
              </div>

              <div className="flex items-center justify-between py-2.5 px-4">
                <dt className="text-[var(--color-ink-muted)] font-medium">Bikram Sambat (BS)</dt>
                <dd className="font-bold text-[var(--color-ink)] text-right">
                  {match.bsDateNepali}
                  <span className="block text-[11px] font-normal text-[var(--color-ink-muted)]">
                    {match.bsDate}
                  </span>
                </dd>
              </div>

              <div className="flex items-center justify-between py-2.5 px-4">
                <dt className="text-[var(--color-ink-muted)] font-medium">Gregorian Date</dt>
                <dd className="font-semibold text-[var(--color-ink)]">
                  {match.dayOfWeek}, {match.formattedDate}
                </dd>
              </div>

              <div className="flex items-center justify-between py-2.5 px-4">
                <dt className="text-[var(--color-ink-muted)] font-medium">Scheduled Time</dt>
                <dd className="font-bold text-[var(--color-brand)]">
                  {match.time === "Time TBA" ? "Time TBA (To be announced)" : `${match.time} (Local Nepal Time)`}
                </dd>
              </div>

              <div className="flex items-center justify-between py-2.5 px-4">
                <dt className="text-[var(--color-ink-muted)] font-medium">Match Format</dt>
                <dd className="font-semibold text-[var(--color-ink)]">Twenty20 (20 Overs)</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {/* Venue & Organizer Card */}
        <Card className="border-[var(--color-rule)]">
          <CardHeader className="bg-[var(--color-surface)] py-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
              Venue & Hosting Ground
            </h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Official Stadium
              </span>
              <p className="font-bold text-sm text-[var(--color-ink)] mt-0.5">
                Tribhuvan University (TU) International Cricket Ground
              </p>
              <p className="text-[11px] text-[var(--color-ink-secondary)]">
                Kirtipur, Kathmandu Valley, Nepal
              </p>
            </div>

            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)] space-y-1">
              <span className="font-bold text-[11px] text-[var(--color-ink)] block">
                🏟️ Single Shared Tournament Venue
              </span>
              <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
                All 32 fixtures of Nepal Premier League Season 3 (28 league matches and 4 playoff fixtures) are scheduled to be hosted at TU Cricket Stadium in Kirtipur. There are no individual franchise home grounds.
              </p>
            </div>

            <div className="pt-1 border-t border-[var(--color-rule)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-ink-muted)]">Tournament Organizer</span>
                <span className="font-semibold text-[var(--color-ink)]">Cricket Association of Nepal (CAN)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-ink-muted)]">Title Sponsor</span>
                <span className="font-semibold text-[var(--color-ink)]">Siddhartha Bank</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Playoff Format Explainer (if playoff match) */}
      {isPlayoff && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardBody className="p-4 sm:p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" aria-hidden="true" />
              <h3 className="font-bold text-sm text-blue-950">
                Playoff Progression Format: {match.stage}
              </h3>
            </div>
            <p className="text-blue-900 leading-relaxed">
              {match.stage === "Qualifier 1" &&
                "Qualifier 1 pits the top two teams from the 28-match League Stage against each other. The winner earns direct entry into the NPL Season 3 Final (Match #32). The defeated team receives a second opportunity in Qualifier 2 (Match #31)."}
              {match.stage === "Eliminator" &&
                "The Eliminator is a knockout contest between the 3rd and 4th placed teams on the points table. The winner advances to Qualifier 2 (Match #31) to fight for a finals berth, while the losing team is eliminated from the tournament."}
              {match.stage === "Qualifier 2" &&
                "Qualifier 2 offers the loser of Qualifier 1 a second chance to contest against the winner of the Eliminator. The winner of this clash advances to the Grand Final (Match #32); the loser is eliminated."}
              {match.stage === "Final" &&
                "The championship climax of NPL Season 3 features the winner of Qualifier 1 against the winner of Qualifier 2. The champion of Nepal Premier League 2026 will be crowned upon the conclusion of this match."}
            </p>
            <p className="text-[11px] text-blue-800 font-semibold pt-1">
              Notice: Team assignments will be officially confirmed upon conclusion of all 28 league stage matches based on final standings.
            </p>
          </CardBody>
        </Card>
      )}
    </section>
  );
}

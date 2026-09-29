import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";

export function AboutVenueSection() {
  const venueFacts = [
    {
      label: "Official Stadium Name",
      value: "Tribhuvan University International Cricket Stadium",
    },
    {
      label: "Common Designation",
      value: "TU Cricket Ground / TU Stadium",
    },
    {
      label: "Location",
      value: "Kirtipur, Kathmandu Valley, Bagmati Province, Nepal",
    },
    {
      label: "Proximity to City Center",
      value: "Approximately 5 km southwest of central Kathmandu",
    },
    {
      label: "Role in NPL Season 3",
      value: "Sole host venue for all 32 tournament fixtures (28 League + 4 Playoffs)",
    },
    {
      label: "Governing Authority",
      value: "Cricket Association of Nepal (CAN) / Tribhuvan University",
    },
    {
      label: "Playing Surface",
      value: "Natural turf pitch with open outfield and surrounding grass banks",
    },
  ];

  return (
    <section aria-labelledby="venue-information-heading" className="space-y-6">
      <SectionHeader
        title="Host Venue & Ground Information"
        action={{ label: "View Venue Fixtures", href: "/schedule" }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Editorial Description and Clear Distinction */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
            All 32 fixtures of Nepal Premier League Season 3 are scheduled to take
            place exclusively at the <strong>Tribhuvan University (TU) International
            Cricket Stadium</strong> in Kirtipur. As the historical spiritual home of
            cricket in the country, the ground serves as the unified epicenter of the
            entire tournament.
          </p>

          {/* CRITICAL DISTINCTION BOX */}
          <div className="rounded-[var(--radius-md)] border-2 border-emerald-600/30 bg-emerald-50/60 p-4 sm:p-5 space-y-2 text-xs sm:text-sm text-emerald-950">
            <h4 className="font-bold text-sm text-[var(--color-brand)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
              Tournament Venue vs Franchise Home Ground Distinction
            </h4>
            <p className="leading-relaxed">
              <strong>Key Editorial Clarification:</strong> While all eight NPL
              franchises draw their identities, fan bases, and pride from Nepal’s
              various provinces and cities (such as Koshi, Madhesh, Gandaki,
              Lumbini, Karnali, Sudurpaschim, Chitwan, and Kathmandu), <strong>no
              franchise possesses an individual home ground for NPL Season 3</strong>.
            </p>
            <p className="leading-relaxed text-xs text-emerald-900/90 pt-1">
              Every match is contested at the central TU International Cricket
              Stadium in Kirtipur. NPL Hub Nepal maintains strict data accuracy by
              never erroneously labeling TU Ground as the private home stadium of any
              single team.
            </p>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-ink)]">
              Venue Environment & Spectator Setting
            </h4>
            <p>
              Situated amidst the rolling hills of Kirtipur on the outskirts of
              Kathmandu, TU Ground is renowned worldwide for its passionate,
              tree-lined grass-bank spectator hills and electric atmosphere. The
              stadium regularly hosts international fixtures, ICC World Cricket
              League matches, and national championships under natural daytime and
              afternoon lighting conditions.
            </p>
          </div>
        </div>

        {/* Right Col: Structured Venue Details Card */}
        <div>
          <Card className="border-[var(--color-rule)] h-full">
            <div className="bg-[var(--color-surface)] px-4 py-3 border-b border-[var(--color-rule)]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-brand)]">
                Stadium Specifications
              </h4>
            </div>
            <CardBody className="p-0">
              <dl className="divide-y divide-[var(--color-rule)] text-xs">
                {venueFacts.map((fact, idx) => (
                  <div key={idx} className="p-3 hover:bg-[var(--color-surface)]/50 transition-colors">
                    <dt className="font-semibold text-[var(--color-ink-muted)] text-[11px]">
                      {fact.label}
                    </dt>
                    <dd className="font-medium text-[var(--color-ink)] mt-0.5 leading-snug">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}

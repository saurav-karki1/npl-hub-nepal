import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";

export function AboutPlatformSection() {
  const editorialPrinciples = [
    {
      title: "1. Zero Fabricated Data",
      description:
        "We never invent player scores, match results, contract figures, or unverified squad rosters. When official details have not been released by CAN or franchise teams, we clearly label content as provisional or state 'To be announced'.",
    },
    {
      title: "2. Dual-Calendar Respect",
      description:
        "We recognize the paramount importance of the Nepali national calendar. All fixtures, match days, and schedules feature verified Bikram Sambat (BS 2083) dates alongside Gregorian dates.",
    },
    {
      title: "3. Independent Editorial Integrity",
      description:
        "Our analysis, schedules, and standings calculations are conducted independently to serve cricket fans. We do not accept promotional bias or alter statistics for commercial interests.",
    },
    {
      title: "4. Rapid & Rigorous Corrections",
      description:
        "If a tournament fixture time, venue condition, or squad registration changes, our centralized data layer updates synchronously across all pages without delay.",
    },
  ];

  return (
    <section aria-labelledby="platform-mission-heading" className="space-y-6">
      <SectionHeader title="Platform Mission & Editorial Policy" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mission Statement Card */}
        <Card className="border-[var(--color-rule)] h-full">
          <CardBody className="p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--color-ink)]">
              Our Mission
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
              NPL Hub Nepal was founded by Nepali cricket enthusiasts to provide
              domestic fans and diaspora followers with a clean, fast, authoritative,
              and ad-clutter-free digital guide to the Nepal Premier League.
            </p>
            <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
              In an era of clickbait rumors and outdated schedules, our goal is to
              deliver precision: real-time points tables, complete dual-calendar
              fixtures, verified squad updates, and transparent tournament reporting.
            </p>

            {/* Official Disclaimer Banner */}
            <div
              id="disclaimer"
              className="rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed space-y-1.5"
            >
              <strong className="block font-bold text-amber-950">
                Statutory Non-Affiliation Disclaimer
              </strong>
              <p>
                NPL Hub Nepal is an <strong>independent cricket information portal</strong>.
                It is <strong>not affiliated with, authorized, maintained, sponsored, or endorsed</strong> by
                the Nepal Premier League (NPL), the Cricket Association of Nepal (CAN),
                or any participating cricket franchise.
              </p>
              <p className="text-[11px] text-amber-800">
                All tournament names, franchise titles, team crests, and associated
                trademarks referenced on this website remain the exclusive property
                of their respective owners. Their presentation here is strictly for
                informational, editorial, and non-commercial fan reference.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Editorial Accuracy & Policy Card */}
        <Card className="border-[var(--color-rule)] h-full">
          <CardBody className="p-5 sm:p-6 space-y-4">
            <h3
              id="privacy"
              className="text-base font-bold text-[var(--color-ink)]"
            >
              Editorial & Data Accuracy Standards
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
              Our platform operates under strict journalistic standards to guarantee
              unimpeachable data accuracy throughout NPL Season 3:
            </p>

            <div className="space-y-3">
              {editorialPrinciples.map((principle, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)] space-y-1"
                >
                  <h4 className="font-bold text-xs text-[var(--color-ink)]">
                    {principle.title}
                  </h4>
                  <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

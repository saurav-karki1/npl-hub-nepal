import { TOURNAMENT_INFO, getAllMatches } from "@/lib/repository/matches";
import { getAllTeams } from "@/lib/repository/teams";
import { Card, CardBody } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";

export function AboutTournamentOverview() {
  const totalTeams = getAllTeams().length;
  const matches = getAllMatches();
  const totalMatches = matches.length;
  const leagueMatches = matches.filter(
    (m) => m.stage === "League"
  ).length;
  const playoffMatches = matches.filter(
    (m) => m.stage !== "League"
  ).length;

  const quickStats = [
    {
      label: "Tournament Edition",
      value: TOURNAMENT_INFO.edition,
      sublabel: TOURNAMENT_INFO.season,
    },
    {
      label: "Franchise Teams",
      value: `${totalTeams} Teams`,
      sublabel: "Regional representation",
    },
    {
      label: "Total Fixtures",
      value: `${totalMatches} Matches`,
      sublabel: `${leagueMatches} League + ${playoffMatches} Playoffs`,
    },
    {
      label: "Cricket Format",
      value: "T20 Overs",
      sublabel: TOURNAMENT_INFO.format,
    },
    {
      label: "Tournament Window",
      value: "Oct – Nov 2026",
      sublabel: TOURNAMENT_INFO.projectedDates,
    },
    {
      label: "Host Venue",
      value: "TU Ground",
      sublabel: "Kirtipur, Kathmandu",
    },
  ];

  const factsheet = [
    {
      label: "Official Tournament Name",
      value: TOURNAMENT_INFO.name,
    },
    {
      label: "Sanctioning Body & Organizer",
      value: TOURNAMENT_INFO.organizer,
    },
    {
      label: "Host Country & Jurisdiction",
      value: `${TOURNAMENT_INFO.country} (Domestic T20 Tier-1)`,
    },
    {
      label: "Match Schedule Format",
      value: "Single Round-Robin followed by Page-Playoff System",
    },
    {
      label: "Official Match Timing (NPT)",
      value: "12:30 PM & 4:30 PM Nepal Standard Time (UTC+5:45)",
    },
    {
      label: "Calendar Systems Displayed",
      value: "Bikram Sambat (BS 2083) primary · Gregorian secondary",
    },
  ];

  return (
    <section aria-labelledby="tournament-overview-heading" className="space-y-6">
      <SectionHeader
        title="Tournament Overview"
        action={{ label: "View 32 Fixtures", href: "/schedule" }}
      />

      <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed max-w-3xl">
        The Nepal Premier League (NPL) represents the highest echelon of domestic
        franchise cricket in Nepal. Governed by the Cricket Association of Nepal
        (CAN), Season 3 features eight province-based franchises competing in a
        month-long Twenty20 tournament at the central Tribhuvan University Ground.
      </p>

      {/* 6 Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickStats.map((stat, idx) => (
          <Card
            key={idx}
            className="border-[var(--color-rule)] bg-[var(--color-surface)] text-center"
          >
            <CardBody className="p-3 sm:p-4 flex flex-col justify-center h-full">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand)] block mb-1">
                {stat.label}
              </span>
              <span className="text-base sm:text-lg font-black text-[var(--color-ink)] block leading-tight">
                {stat.value}
              </span>
              <span className="text-[10px] sm:text-xs text-[var(--color-ink-muted)] mt-1 block truncate">
                {stat.sublabel}
              </span>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Structured Factsheet Card */}
      <Card className="border-[var(--color-rule)] overflow-hidden">
        <div className="bg-[var(--color-surface)] px-4 py-3 border-b border-[var(--color-rule)]">
          <h3 className="font-bold text-sm text-[var(--color-ink)]">
            Verified NPL Season 3 Factsheet
          </h3>
        </div>
        <CardBody className="p-0">
          <dl className="divide-y divide-[var(--color-rule)]">
            {factsheet.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-3 px-4 py-3 sm:py-3.5 hover:bg-[var(--color-surface)]/50 transition-colors"
              >
                <dt className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  {item.label}
                </dt>
                <dd className="sm:col-span-2 text-xs sm:text-sm font-medium text-[var(--color-ink)] mt-0.5 sm:mt-0">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </section>
  );
}

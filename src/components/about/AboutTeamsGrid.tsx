import Link from "next/link";
import { getAllTeams } from "@/lib/data/teams-data";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function AboutTeamsGrid() {
  const teams = getAllTeams();

  return (
    <section aria-labelledby="teams-overview-heading" className="space-y-6">
      <SectionHeader
        title="8 Participating Franchise Teams"
        action={{ label: "View Teams Hub →", href: "/teams" }}
      />

      <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed max-w-3xl">
        Eight city- and province-based franchises compete in Nepal Premier League
        Season 3. Each team represents a distinct regional heritage and passionate
        cricket community from across the country. All franchises play their
        scheduled fixtures at the central TU International Cricket Ground in
        Kirtipur.
      </p>

      {/* 8-Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.slug}`}
            className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-lg)]"
          >
            <Card
              interactive
              className="h-full border-[var(--color-rule)] group-hover:border-[var(--color-brand)] transition-colors"
            >
              <CardBody className="p-4 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start gap-3">
                  <TeamLogo
                    name={team.name}
                    shortName={team.shortName}
                    initials={team.initials}
                    logoUrl={team.logoUrl}
                    crestBg={team.crestBg}
                    crestText={team.crestText}
                    size="lg"
                    className="w-12 h-12 shadow-xs group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)] block truncate">
                      {team.region}
                    </span>
                    <h3 className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors leading-snug truncate">
                      {team.name}
                    </h3>
                    <span className="text-xs text-[var(--color-ink-muted)] block truncate mt-0.5">
                      Base: {team.city}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--color-ink-muted)]">
                    Est. {team.established}
                  </span>
                  <span className="font-semibold text-[var(--color-brand)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Profile & Schedule →
                  </span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-3.5 text-xs text-[var(--color-ink-muted)] leading-relaxed">
        <strong className="text-[var(--color-ink)] font-semibold">
          Regional Representation vs Match Venue Note:
        </strong>{" "}
        While franchises celebrate regional identities spanning Lumbini,
        Sudurpaschim, Koshi, Bagmati, Karnali, Kathmandu Valley, Gandaki, and
        Madhesh, individual franchises do not host separate home grounds. All 32
        tournament fixtures take place exclusively at Tribhuvan University Ground
        in Kirtipur.
      </div>
    </section>
  );
}

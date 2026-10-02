import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { getAllTeamsSync } from "@/lib/repository/teams";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function TeamsPreview() {
  const teams = getAllTeamsSync();

  return (
    <section>
      <SectionHeader
        title="NPL Franchise Teams"
        action={{ label: "Explore Squads →", href: "/teams" }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              <CardBody className="p-4 sm:p-5 flex flex-col items-center text-center">
                {/* Team Logo */}
                <TeamLogo
                  name={team.name}
                  shortName={team.shortName}
                  initials={team.initials}
                  logoUrl={team.logoUrl}
                  crestBg={team.crestBg}
                  crestText={team.crestText}
                  size="xl"
                  className="mb-3 group-hover:scale-105 transition-all"
                />

                {/* Team Name */}
                <h3 className="font-bold text-sm sm:text-base text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors leading-tight">
                  {team.name}
                </h3>

                {/* City */}
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  {team.city}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <LinkButton variant="secondary" href="/teams">
          View All 8 Teams →
        </LinkButton>
        <LinkButton variant="ghost" href="/players">
          View Players Directory →
        </LinkButton>
      </div>
    </section>
  );
}

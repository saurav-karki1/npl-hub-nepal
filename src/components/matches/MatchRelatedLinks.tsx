import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { ScheduleMatch, resolveMatchTeams } from "@/lib/repository/matches";
import { getTeamBySlug } from "@/lib/repository/teams";

interface MatchRelatedLinksProps {
  match: ScheduleMatch;
}

export function MatchRelatedLinks({ match }: MatchRelatedLinksProps) {
  const team1Detail = match.team1Id !== null ? getTeamBySlug(match.team1Id) : undefined;
  const team2Detail = match.team2Id !== null ? getTeamBySlug(match.team2Id) : undefined;
  const { team1, team2 } = resolveMatchTeams(match);

  return (
    <section aria-labelledby="related-links-heading" className="space-y-4">
      <div className="border-b border-[var(--color-rule)] pb-2.5">
        <h2 id="related-links-heading" className="text-lg sm:text-xl font-black text-[var(--color-ink)]">
          Related Tournament Links
        </h2>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
          Explore team profiles, tournament standings, and related NPL Season 3 modules.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Team 1 Link */}
        {team1Detail ? (
          <Card className="border-[var(--color-rule)] hover:border-[var(--color-brand)] transition-colors">
            <CardBody className="p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Team Profile
              </span>
              <Link
                href={`/teams/${team1Detail.slug}`}
                className="font-bold text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors block line-clamp-1"
              >
                {team1Detail.name}
              </Link>
              <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">
                View captain, squad updates, and all {team1Detail.name} fixtures.
              </p>
              <Link
                href={`/teams/${team1Detail.slug}`}
                className="text-xs font-semibold text-[var(--color-brand)] inline-flex items-center gap-1 hover:underline pt-1"
              >
                Explore Team →
              </Link>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardBody className="p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                Playoff Seed
              </span>
              <span className="font-bold text-sm text-amber-950 block">
                {team1.name}
              </span>
              <p className="text-xs text-amber-900/80">
                Determined by final league rankings and playoff progression.
              </p>
              <Link
                href="/points-table"
                className="text-xs font-semibold text-amber-900 inline-flex items-center gap-1 hover:underline pt-1"
              >
                Check Standings →
              </Link>
            </CardBody>
          </Card>
        )}

        {/* Team 2 Link */}
        {team2Detail ? (
          <Card className="border-[var(--color-rule)] hover:border-[var(--color-brand)] transition-colors">
            <CardBody className="p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Team Profile
              </span>
              <Link
                href={`/teams/${team2Detail.slug}`}
                className="font-bold text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors block line-clamp-1"
              >
                {team2Detail.name}
              </Link>
              <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">
                View captain, squad updates, and all {team2Detail.name} fixtures.
              </p>
              <Link
                href={`/teams/${team2Detail.slug}`}
                className="text-xs font-semibold text-[var(--color-brand)] inline-flex items-center gap-1 hover:underline pt-1"
              >
                Explore Team →
              </Link>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardBody className="p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                Playoff Seed
              </span>
              <span className="font-bold text-sm text-amber-950 block">
                {team2.name}
              </span>
              <p className="text-xs text-amber-900/80">
                Determined by final league rankings and playoff progression.
              </p>
              <Link
                href="/points-table"
                className="text-xs font-semibold text-amber-900 inline-flex items-center gap-1 hover:underline pt-1"
              >
                Check Standings →
              </Link>
            </CardBody>
          </Card>
        )}

        {/* Full Schedule Link */}
        <Card className="border-[var(--color-rule)] hover:border-[var(--color-brand)] transition-colors">
          <CardBody className="p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
              Tournament Fixtures
            </span>
            <Link
              href="/schedule"
              className="font-bold text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors block"
            >
              Full Schedule
            </Link>
            <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">
              Browse all 32 matches with Bikram Sambat dates and team filters.
            </p>
            <Link
              href="/schedule"
              className="text-xs font-semibold text-[var(--color-brand)] inline-flex items-center gap-1 hover:underline pt-1"
            >
              View Schedule →
            </Link>
          </CardBody>
        </Card>

        {/* Points Table Link */}
        <Card className="border-[var(--color-rule)] hover:border-[var(--color-brand)] transition-colors">
          <CardBody className="p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
              Playoff Race
            </span>
            <Link
              href="/points-table"
              className="font-bold text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors block"
            >
              Points Table & NRR
            </Link>
            <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">
              Track wins, losses, Net Run Rate (NRR), and top 4 qualification.
            </p>
            <Link
              href="/points-table"
              className="text-xs font-semibold text-[var(--color-brand)] inline-flex items-center gap-1 hover:underline pt-1"
            >
              View Standings →
            </Link>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

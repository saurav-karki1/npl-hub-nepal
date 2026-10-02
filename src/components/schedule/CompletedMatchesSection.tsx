import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import {
  getCompletedMatchesSync,
  resolveMatchTeams,
} from "@/lib/repository/matches";
import { LinkButton } from "@/components/ui/Button";

export function CompletedMatchesSection() {
  const completedMatches = getCompletedMatchesSync();

  return (
    <section aria-labelledby="completed-matches-heading" className="space-y-4">
      <SectionHeader title="Match Results & Completed Fixtures" />

      {completedMatches.length === 0 ? (
        <Card className="border-[var(--color-rule)] bg-[var(--color-surface)]">
          <CardBody className="p-6 sm:p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)] font-bold text-sm flex items-center justify-center mx-auto">
              ✓
            </div>
            <h3 className="font-bold text-base text-[var(--color-ink)]">
              No Matches Completed Yet
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] max-w-lg mx-auto leading-relaxed">
              Nepal Premier League Season 3 has not started yet. Once tournament matches begin, complete scorecards, innings summaries, player-of-the-match awards, and result metrics will be published here in real time.
            </p>
            <div className="pt-2">
              <LinkButton href="/points-table" variant="secondary" size="sm">
                View Points Table Standings →
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedMatches.map((match) => {
            const { team1, team2 } = resolveMatchTeams(match);

            return (
              <Card key={match.id} className="border-[var(--color-rule)] hover:border-[var(--color-brand)] transition-colors">
                <CardBody className="p-4">
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    Match #{match.matchNumber} · {match.formattedDate}
                  </div>
                  <Link
                    href={`/matches/${match.slug}`}
                    className="font-bold text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors mt-1 block"
                  >
                    {team1.name} vs {team2.name}
                  </Link>
                  <p className="text-xs text-[var(--color-win)] font-semibold mt-2">
                    {match.result}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

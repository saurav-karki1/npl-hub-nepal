import Link from "next/link";
import { Player, getPlayerTeam } from "@/lib/repository/players";
import { getMatchesByTeam, resolveMatchTeam } from "@/lib/repository/matches";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface PlayerRelatedMatchesProps {
  player: Player;
}

export function PlayerRelatedMatches({ player }: PlayerRelatedMatchesProps) {
  const team = getPlayerTeam(player);

  if (!team) {
    return null;
  }

  // Filter fixtures involving the player's team from repository
  const teamMatches = getMatchesByTeam(team.id).slice(0, 4); // Display next 4 fixtures

  if (teamMatches.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="player-matches-heading" className="space-y-4">
      <SectionHeader
        title={`Upcoming Fixtures for ${player.name}`}
        action={{ label: "View Team Schedule →", href: `/teams/${team.slug}` }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {teamMatches.map((match) => {
          const isTeam1 = match.team1Id === team.id;
          const opponentId = isTeam1 ? match.team2Id : match.team1Id;
          const opponentPlaceholder = isTeam1 ? match.team2Placeholder : match.team1Placeholder;
          const opponent = resolveMatchTeam(opponentId, opponentPlaceholder);

          return (
            <Link
              key={match.id}
              href={`/matches/${match.slug}`}
              className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-lg)]"
            >
              <Card
                interactive
                className="h-full border-[var(--color-rule)] group-hover:border-[var(--color-brand)] transition-colors"
              >
                <CardBody className="p-3.5 flex flex-col justify-between h-full space-y-3">
                  <div>
                    {/* Eyebrow: Match Number & Stage */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
                      <span>Match #{match.matchNumber}</span>
                      <span className="text-[var(--color-brand)]">
                        {match.stage}
                      </span>
                    </div>

                    {/* Opponent & Match Title */}
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        name={opponent.name}
                        shortName={opponent.shortName}
                        initials={opponent.initials}
                        logoUrl={opponent.logoUrl}
                        crestBg={opponent.crestBg}
                        crestText={opponent.crestText}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-[var(--color-ink-muted)] block">
                          vs Opponent
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors truncate">
                          {opponent.name}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Footer */}
                  <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                    <span className="font-medium text-[var(--color-ink)]">
                      {match.formattedDate}
                    </span>
                    <span className="font-semibold text-[var(--color-brand)]">
                      {match.time}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody, StatusBadge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import {
  getMatchesByTeamSync,
  resolveMatchTeam,
} from "@/lib/repository/matches";
import { TeamDetail, getTeamBySlugSync } from "@/lib/repository/teams";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface TeamScheduleSectionProps {
  team: TeamDetail;
}

export function TeamScheduleSection({ team }: TeamScheduleSectionProps) {
  // Live filter from matches repository
  const teamFixtures = getMatchesByTeamSync(team.id);

  return (
    <section aria-labelledby="schedule-heading" className="space-y-4">
      <SectionHeader
        title={`${team.name} — Season 3 Fixtures (${teamFixtures.length} Matches)`}
        action={{ label: "View All 32 Matches", href: "/schedule" }}
      />

      {teamFixtures.length === 0 ? (
        <Card className="border-[var(--color-rule)] bg-[var(--color-surface)] py-8 text-center">
          <CardBody className="space-y-2">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              No fixtures scheduled yet for this team.
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Fixtures will be updated as the official schedule is confirmed.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden border border-[var(--color-rule)] rounded-[var(--radius-lg)] bg-[var(--color-canvas)] shadow-2xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-rule)] bg-[var(--color-surface)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  <th scope="col" className="py-3 px-4 w-20">Match</th>
                  <th scope="col" className="py-3 px-4 w-48">Date & Time</th>
                  <th scope="col" className="py-3 px-4">Clash (Opponent)</th>
                  <th scope="col" className="py-3 px-4">Venue</th>
                  <th scope="col" className="py-3 px-4 w-28 text-center">Status</th>
                  <th scope="col" className="py-3 px-4 w-28 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-rule)]">
                {teamFixtures.map((match) => {
                  const isTeam1 = match.team1Id === team.id;
                  const opponentId = isTeam1 ? match.team2Id : match.team1Id;
                  const opponentPlaceholder = isTeam1 ? match.team2Placeholder : match.team1Placeholder;
                  const opponent = resolveMatchTeam(opponentId, opponentPlaceholder);
                  const opponentDetail = opponentId !== null ? getTeamBySlugSync(opponentId) : undefined;

                  return (
                    <tr
                      key={match.id}
                      className="hover:bg-[var(--color-surface)]/70 transition-colors"
                    >
                      {/* Match # */}
                      <td className="py-3.5 px-4 font-bold text-xs text-[var(--color-ink-muted)] align-middle">
                        <Link href={`/matches/${match.slug}`} className="group block">
                          <span className="block text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors">
                            #{match.matchNumber}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[var(--color-brand)] tracking-wider">
                            {match.stage}
                          </span>
                        </Link>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="font-bold text-xs text-[var(--color-ink)] block">
                          {match.bsDateNepali}
                        </span>
                        <span className="text-[11px] text-[var(--color-ink-muted)] block">
                          {match.dayOfWeek}, {match.formattedDate}
                        </span>
                        <span className="text-xs text-[var(--color-brand)] font-semibold mt-0.5 inline-block">
                          {match.time}
                        </span>
                      </td>

                      {/* Opponent Face-off */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-[var(--color-ink-muted)]">
                            vs
                          </span>
                          <TeamLogo
                            name={opponent.name}
                            shortName={opponent.shortName}
                            initials={opponent.initials}
                            logoUrl={opponent.logoUrl || opponentDetail?.logoUrl}
                            crestBg={opponentDetail?.crestBg}
                            crestText={opponentDetail?.crestText}
                            size="sm"
                          />
                          <div>
                            {opponentDetail ? (
                              <Link
                                href={`/teams/${opponentDetail.slug}`}
                                className="font-bold text-xs sm:text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors block"
                              >
                                {opponent.name}
                              </Link>
                            ) : (
                              <span className="font-bold text-xs sm:text-sm text-[var(--color-ink)] block">
                                {opponent.name}
                              </span>
                            )}
                            <span className="text-[11px] text-[var(--color-ink-muted)]">
                              {opponent.city}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Venue */}
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-muted)] align-middle">
                        <span className="line-clamp-1">{match.venue}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <StatusBadge
                          status={match.status === "tba" ? "neutral" : "upcoming"}
                          label={match.status === "tba" ? "Time TBA" : "Scheduled"}
                        />
                      </td>

                      {/* Match Details Link */}
                      <td className="py-3.5 px-4 text-right align-middle">
                        <Link
                          href={`/matches/${match.slug}`}
                          className="text-xs font-bold text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
                        >
                          Match Page →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Match Cards */}
          <div className="md:hidden space-y-3">
            {teamFixtures.map((match) => {
              const isTeam1 = match.team1Id === team.id;
              const opponentId = isTeam1 ? match.team2Id : match.team1Id;
              const opponentPlaceholder = isTeam1 ? match.team2Placeholder : match.team1Placeholder;
              const opponent = resolveMatchTeam(opponentId, opponentPlaceholder);
              const opponentDetail = opponentId !== null ? getTeamBySlugSync(opponentId) : undefined;

              return (
                <Card key={match.id} className="border-[var(--color-rule)]">
                  <CardBody className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-[11px] border-b border-[var(--color-rule)] pb-2.5">
                      <Link
                        href={`/matches/${match.slug}`}
                        className="font-bold text-[var(--color-ink)] hover:text-[var(--color-brand)] uppercase tracking-wider"
                      >
                        Match #{match.matchNumber} · {match.stage}
                      </Link>
                      <StatusBadge status="upcoming" label="Scheduled" />
                    </div>

                    {/* Opponent clash */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider block">
                          Opponent
                        </span>
                        {opponentDetail ? (
                          <Link
                            href={`/teams/${opponentDetail.slug}`}
                            className="font-bold text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors mt-0.5 block"
                          >
                            {opponent.name}
                          </Link>
                        ) : (
                          <span className="font-bold text-sm text-[var(--color-ink)] mt-0.5 block">
                            {opponent.name}
                          </span>
                        )}
                        <span className="text-[11px] text-[var(--color-ink-muted)]">
                          {opponent.city}
                        </span>
                      </div>

                      <TeamLogo
                        name={opponent.name}
                        shortName={opponent.shortName}
                        initials={opponent.initials}
                        logoUrl={opponent.logoUrl || opponentDetail?.logoUrl}
                        crestBg={opponentDetail?.crestBg}
                        crestText={opponentDetail?.crestText}
                        size="md"
                      />
                    </div>

                    {/* Date & Time */}
                    <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                      <div>
                        <div className="font-bold text-xs text-[var(--color-ink)]">
                          {match.bsDateNepali}
                        </div>
                        <div>
                          {match.dayOfWeek}, {match.formattedDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-xs text-[var(--color-brand)] block">
                          {match.time}
                        </span>
                        <span className="text-[10px]">TU Stadium</span>
                      </div>
                    </div>

                    {/* Match Action */}
                    <div className="pt-2 border-t border-[var(--color-rule)] flex justify-end">
                      <Link
                        href={`/matches/${match.slug}`}
                        className="text-xs font-bold text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
                      >
                        Match Center →
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <LinkButton href="/schedule" variant="secondary" size="sm">
              Explore Complete 32-Match Tournament Schedule →
            </LinkButton>
          </div>
        </div>
      )}
    </section>
  );
}

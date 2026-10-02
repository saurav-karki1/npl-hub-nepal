import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { ScheduleMatch, MatchTeamInfo, resolveMatchTeams } from "@/lib/repository/matches";
import { getTeamBySlugSync, TeamDetail } from "@/lib/repository/teams";

interface MatchTeamsSectionProps {
  match: ScheduleMatch;
}

export function MatchTeamsSection({ match }: MatchTeamsSectionProps) {
  const team1Detail = match.team1Id !== null ? getTeamBySlugSync(match.team1Id) : undefined;
  const team2Detail = match.team2Id !== null ? getTeamBySlugSync(match.team2Id) : undefined;
  const { team1, team2 } = resolveMatchTeams(match);

  return (
    <section aria-labelledby="teams-faceoff-heading" className="space-y-4">
      <div className="border-b border-[var(--color-rule)] pb-2.5">
        <h2 id="teams-faceoff-heading" className="text-lg sm:text-xl font-black text-[var(--color-ink)]">
          Contesting Teams Profile
        </h2>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
          Detailed team overview, leadership profiles, and franchise links for this match.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamProfileCard
          team={team1}
          teamDetail={team1Detail}
          label="Team 1"
          stage={match.stage}
        />
        <TeamProfileCard
          team={team2}
          teamDetail={team2Detail}
          label="Team 2"
          stage={match.stage}
        />
      </div>
    </section>
  );
}

function TeamProfileCard({
  team,
  teamDetail,
  label,
  stage,
}: {
  team: MatchTeamInfo;
  teamDetail?: TeamDetail;
  label: string;
  stage: string;
}) {
  if (teamDetail) {
    // Confirmed Franchise Team
    return (
      <Card className="border-[var(--color-rule)] flex flex-col justify-between">
        <div>
          <CardHeader className="bg-[var(--color-surface)] py-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              {label} · Franchise
            </span>
            <span className="text-[11px] font-bold text-[var(--color-brand)] bg-[var(--color-brand-light)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--color-brand)]/20">
              {teamDetail.shortName}
            </span>
          </CardHeader>

          <CardBody className="p-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <TeamLogo
                name={teamDetail.name}
                shortName={teamDetail.shortName}
                initials={teamDetail.initials}
                logoUrl={teamDetail.logoUrl}
                crestBg={teamDetail.crestBg}
                crestText={teamDetail.crestText}
                size="lg"
              />
              <div>
                <h3 className="font-bold text-base text-[var(--color-ink)]">
                  <Link
                    href={`/teams/${teamDetail.slug}`}
                    className="hover:text-[var(--color-brand)] transition-colors"
                  >
                    {teamDetail.name}
                  </Link>
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {teamDetail.region} · {teamDetail.city}
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              {teamDetail.description}
            </p>

            <dl className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-rule)] text-xs">
              <div className="bg-[var(--color-surface)] p-2.5 rounded-[var(--radius-sm)] border border-[var(--color-rule)]">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  Captain
                </dt>
                <dd className="font-bold text-sm text-[var(--color-ink)] mt-0.5">
                  {teamDetail.captain}
                </dd>
                <span className="text-[10px] text-[var(--color-ink-muted)]">
                  {teamDetail.captainConfidence === "confirmed" ? "Confirmed (S3)" : "Reported"}
                </span>
              </div>

              <div className="bg-[var(--color-surface)] p-2.5 rounded-[var(--radius-sm)] border border-[var(--color-rule)]">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  Squad Roster
                </dt>
                <dd className="font-bold text-xs text-[var(--color-ink)] mt-1">
                  {teamDetail.squadStatus}
                </dd>
                <span className="text-[10px] text-[var(--color-ink-muted)]">Official CAN Auction</span>
              </div>
            </dl>
          </CardBody>
        </div>

        <div className="p-4 pt-0">
          <LinkButton
            href={`/teams/${teamDetail.slug}`}
            variant="secondary"
            size="sm"
            className="w-full justify-center"
          >
            View {teamDetail.name} Profile & Schedule →
          </LinkButton>
        </div>
      </Card>
    );
  }

  // Playoff Placeholder Team (e.g. Rank 1 Team, Winner of Eliminator, etc.)
  return (
    <Card className="border-amber-200 bg-amber-50/30 flex flex-col justify-between">
      <div>
        <CardHeader className="bg-amber-100/50 py-3 flex items-center justify-between border-b border-amber-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
            {label} · Playoff Placeholder
          </span>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-[var(--radius-xs)]">
            {team.initials || "TBD"}
          </span>
        </CardHeader>

        <CardBody className="p-5 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs border border-amber-300">
              {team.initials || "TBD"}
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-950">
                {team.name}
              </h3>
              <p className="text-xs text-amber-800 font-medium">
                Placement: {team.city || "To Be Determined"}
              </p>
            </div>
          </div>

          <p className="text-xs text-amber-900/90 leading-relaxed">
            This position is reserved for the team qualifying via the official NPL Season 3 tournament progression.
            {stage === "Qualifier 1" &&
              " Will be contested by the top 2 teams in the league standings after all 28 preliminary matches are completed."}
            {stage === "Eliminator" &&
              " Will be contested by the 3rd and 4th ranked teams in the league standings after all 28 preliminary matches."}
            {stage === "Qualifier 2" &&
              " Will be contested between the loser of Qualifier 1 and the winner of the Eliminator match."}
            {stage === "Final" &&
              " Will be contested by the winning teams from Qualifier 1 and Qualifier 2."}
          </p>

          <div className="p-3 bg-amber-100/60 rounded-[var(--radius-sm)] border border-amber-200 text-xs text-amber-900">
            <strong>Data Accuracy Notice:</strong> NPL Hub Nepal does not invent or assume playoff finalists before games are officially contested.
          </div>
        </CardBody>
      </div>

      <div className="p-4 pt-0">
        <LinkButton
          href="/points-table"
          variant="secondary"
          size="sm"
          className="w-full justify-center border-amber-300 text-amber-950 hover:bg-amber-100"
        >
          View Current Points Table Standings →
        </LinkButton>
      </div>
    </Card>
  );
}

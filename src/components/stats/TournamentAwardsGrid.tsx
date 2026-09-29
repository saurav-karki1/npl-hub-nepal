import { TournamentAward } from "@/lib/data/stats-types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamMeta } from "@/lib/data/stats-registry";
import Link from "next/link";

interface TournamentAwardsGridProps {
  awards: TournamentAward[];
  seasonName: string;
}

export function TournamentAwardsGrid({ awards, seasonName }: TournamentAwardsGridProps) {
  if (!awards || awards.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="awards-heading" className="space-y-4">
      <SectionHeader
        title={`${seasonName} — Tournament Awards`}
        description="Official individual honors and tournament accolades conferred upon the standout performers of NPL Season 2."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {awards.map((award) => {
          const team = getTeamMeta(award.teamId);

          return (
            <Card
              key={award.id}
              className="border-[var(--color-rule)] flex flex-col justify-between hover:border-[var(--color-brand)] transition-colors"
            >
              <div>
                <CardHeader className="bg-[var(--color-surface)] py-2.5 px-4 border-b border-[var(--color-rule)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      {award.title}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase">
                      Verified
                    </span>
                  </div>
                </CardHeader>

                <CardBody className="p-4 space-y-3">
                  <div>
                    {award.playerSlug ? (
                      <Link
                        href={`/players/${award.playerSlug}`}
                        className="text-base font-bold text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors block leading-snug group"
                      >
                        <span className="group-hover:underline">{award.recipient}</span>
                        <span className="inline-block ml-1 text-xs text-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                          ↗
                        </span>
                      </Link>
                    ) : (
                      <div className="text-base font-bold text-[var(--color-ink)] leading-snug">
                        {award.recipient}
                      </div>
                    )}

                    {/* Team reference */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <TeamLogo
                        name={award.teamName}
                        logoUrl={team?.logoUrl}
                        crestBg={team?.crestBg}
                        crestText={team?.crestText}
                        size="xs"
                      />
                      <Link
                        href={`/teams/${team?.slug || award.teamId}`}
                        className="text-xs text-[var(--color-ink-secondary)] hover:text-[var(--color-brand)] transition-colors"
                      >
                        {award.teamName}
                      </Link>
                    </div>
                  </div>

                  {/* Verified Detail */}
                  <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-rule)] text-xs text-[var(--color-ink)] font-medium">
                    {award.detail}
                  </div>
                </CardBody>
              </div>

              {award.categoryNote && (
                <div className="px-4 pb-3 pt-0 text-[10px] text-[var(--color-ink-muted)] italic leading-tight">
                  {award.categoryNote}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

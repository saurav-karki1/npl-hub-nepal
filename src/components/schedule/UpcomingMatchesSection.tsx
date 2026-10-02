import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody, StatusBadge } from "@/components/ui/Card";
import {
  getUpcomingMatchesSync,
  resolveMatchTeams,
  ScheduleMatch,
} from "@/lib/repository/matches";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function UpcomingMatchesSection() {
  // Grab the first 3 upcoming matches as featured highlights
  const upcomingHighlights = getUpcomingMatchesSync(3);

  return (
    <section aria-labelledby="upcoming-fixtures-heading" className="space-y-4">
      <SectionHeader
        title="Upcoming Matches"
        action={{ label: "View All 32 Fixtures", href: "#all-fixtures" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {upcomingHighlights.map((match, idx) => (
          <UpcomingMatchCard key={match.id} match={match} isFeatured={idx === 0} />
        ))}
      </div>
    </section>
  );
}

function UpcomingMatchCard({
  match,
  isFeatured,
}: {
  match: ScheduleMatch;
  isFeatured: boolean;
}) {
  const { team1, team2 } = resolveMatchTeams(match);

  return (
    <article className="h-full">
      <Card
        className={`h-full flex flex-col justify-between border-[var(--color-rule)] transition-all ${
          isFeatured
            ? "border-[var(--color-brand)] shadow-xs ring-1 ring-[var(--color-brand)]/20"
            : "hover:border-[var(--color-brand)]"
        }`}
      >
        <CardBody className="p-5 flex flex-col justify-between h-full space-y-4">
          {/* Header Bar */}
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-rule)] pb-3 mb-3">
              <span className="text-[11px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">
                Match #{match.matchNumber} · {match.stage}
              </span>
              <StatusBadge
                status={match.status === "tba" ? "neutral" : "upcoming"}
                label={match.status === "tba" ? "Time TBA" : "Scheduled"}
              />
            </div>

            {/* Teams Face-off */}
            <div className="space-y-3 py-1">
              {/* Team 1 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <TeamLogo
                    name={team1.name}
                    shortName={team1.shortName}
                    initials={team1.initials}
                    logoUrl={team1.logoUrl}
                    crestBg={team1.crestBg}
                    crestText={team1.crestText}
                    size="md"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-ink)] leading-snug">
                      {team1.name}
                    </h3>
                    <span className="text-[11px] text-[var(--color-ink-muted)] block">
                      {team1.city}
                    </span>
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-ink-faint)] uppercase tracking-wider pl-10">
                <span>vs</span>
              </div>

              {/* Team 2 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <TeamLogo
                    name={team2.name}
                    shortName={team2.shortName}
                    initials={team2.initials}
                    logoUrl={team2.logoUrl}
                    crestBg={team2.crestBg}
                    crestText={team2.crestText}
                    size="md"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-ink)] leading-snug">
                      {team2.name}
                    </h3>
                    <span className="text-[11px] text-[var(--color-ink-muted)] block">
                      {team2.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date, Time, Venue Footer */}
          <div className="pt-3 border-t border-[var(--color-rule)] space-y-1.5 text-xs text-[var(--color-ink-muted)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-xs text-[var(--color-ink)] block">
                  {match.bsDateNepali}
                </span>
                <span className="text-[11px] text-[var(--color-ink-muted)]">
                  {match.dayOfWeek}, {match.formattedDate}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`font-semibold text-xs block ${
                    match.time === "Time TBA"
                      ? "text-amber-700 font-medium"
                      : "text-[var(--color-brand)]"
                  }`}
                >
                  {match.time === "Time TBA" ? "Time TBA" : match.time}
                </span>
                <span className="text-[10px] text-[var(--color-ink-faint)]">NPT Local</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[var(--color-rule)]/60">
              <span className="text-[11px] text-[var(--color-ink-muted)] truncate max-w-[180px]">
                📍 {match.venue}
              </span>
              <Link
                href={`/matches/${match.slug}`}
                className="font-bold text-xs text-[var(--color-brand)] hover:underline shrink-0"
              >
                Match Center →
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </article>
  );
}

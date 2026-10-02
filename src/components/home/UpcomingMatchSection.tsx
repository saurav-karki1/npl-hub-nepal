import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody, StatusBadge } from "@/components/ui/Card";
import {
  getUpcomingMatchesSync,
  resolveMatchTeams,
} from "@/lib/repository/matches";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function UpcomingMatchSection() {
  const match = getUpcomingMatchesSync(1)[0];

  if (!match) {
    return null;
  }

  const { team1, team2 } = resolveMatchTeams(match);

  return (
    <section>
      <SectionHeader
        title="Upcoming Match"
        action={{ label: "Full Schedule →", href: "/schedule" }}
      />

      <Card className="border-[var(--color-rule)] hover:border-[var(--color-brand)] transition-colors">
        <CardBody className="p-5 sm:p-7">
          {/* Top metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-rule)] pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <StatusBadge status="upcoming" label="Opening Match" />
              <span className="text-xs font-semibold text-[var(--color-ink-muted)]">
                Match #{match.matchNumber} · {match.stage}
              </span>
            </div>
            <div className="text-xs font-medium text-[var(--color-ink-muted)] flex items-center gap-1.5">
              <CalendarIcon />
              <span>{match.dayOfWeek}, {match.formattedDate}</span>
              <span>·</span>
              <span className="font-semibold text-[var(--color-ink)]">{match.time}</span>
            </div>
          </div>

          {/* Teams face-off display */}
          <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-6 py-2">
            {/* Team 1 */}
            <div className="md:col-span-3 flex items-center gap-4">
              <TeamLogo
                name={team1.name}
                shortName={team1.shortName}
                initials={team1.initials}
                logoUrl={team1.logoUrl}
                crestBg={team1.crestBg || "var(--color-brand)"}
                crestText={team1.crestText || "#ffffff"}
                size="xl"
              />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-ink)]">
                  {team1.name}
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">{team1.city}</p>
              </div>
            </div>

            {/* VS separator */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <span className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-rule)] flex items-center justify-center text-xs font-black text-[var(--color-ink-muted)] uppercase tracking-wider">
                VS
              </span>
            </div>

            {/* Team 2 */}
            <div className="md:col-span-3 flex items-center md:justify-end gap-4">
              <div className="order-2 md:order-1 text-left md:text-right">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-ink)]">
                  {team2.name}
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">{team2.city}</p>
              </div>
              <TeamLogo
                name={team2.name}
                shortName={team2.shortName}
                initials={team2.initials}
                logoUrl={team2.logoUrl}
                crestBg={team2.crestBg || "var(--color-brand-mid)"}
                crestText={team2.crestText || "#ffffff"}
                size="xl"
                className="order-1 md:order-2"
              />
            </div>
          </div>

          {/* Venue & actions footer */}
          <div className="mt-6 pt-4 border-t border-[var(--color-rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
              <VenueIcon />
              <span>
                <strong>Venue:</strong> {match.venue}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/matches/${match.slug}`}
                className="inline-flex items-center justify-center text-xs font-semibold text-[var(--color-brand)] hover:underline"
              >
                View Match Details →
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

/* ── Minimal semantic SVG icons ── */

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function VenueIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

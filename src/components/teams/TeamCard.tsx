import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { TeamDetail } from "@/lib/data/teams-data";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface TeamCardProps {
  team: TeamDetail;
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-lg)]"
    >
      <Card
        interactive
        className="h-full border-[var(--color-rule)] group-hover:border-[var(--color-brand)] transition-all flex flex-col justify-between"
      >
        <CardBody className="p-5 flex flex-col justify-between h-full space-y-4">
          <div>
            {/* Header: Crest + Code Badge */}
            <div className="flex items-start justify-between gap-3 mb-4">
              {/* Team Logo */}
              <TeamLogo
                name={team.name}
                shortName={team.shortName}
                initials={team.initials}
                logoUrl={team.logoUrl}
                crestBg={team.crestBg}
                crestText={team.crestText}
                size="xl"
                className="group-hover:scale-105 transition-transform"
              />

              {/* Code + Region Badge */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-black text-[var(--color-ink)] bg-[var(--color-surface)] border border-[var(--color-rule)] px-2 py-0.5 rounded-[var(--radius-sm)]">
                  {team.shortName}
                </span>
                <span className="text-[10px] font-semibold text-[var(--color-ink-muted)]">
                  {team.region}
                </span>
              </div>
            </div>

            {/* Team Name */}
            <h3 className="font-black text-lg text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors leading-snug">
              {team.name}
            </h3>

            {/* Region / City */}
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              {team.city}, Nepal
            </p>
          </div>

          {/* Details Box */}
          <div className="pt-3 border-t border-[var(--color-rule)] text-xs">
            {/* Captain Field with calm metadata */}
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Captain
              </span>
              <div className="text-right">
                <span className="font-bold text-[var(--color-ink)]">
                  {team.captain}
                </span>
                {team.captainConfidence === "confirmed" ? (
                  <span className="block text-[10px] text-emerald-700 font-medium">
                    Confirmed for S3
                  </span>
                ) : (
                  <span className="block text-[10px] text-[var(--color-ink-faint)]">
                    Reported (2025)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card Footer Action */}
          <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-xs font-semibold text-[var(--color-brand)] group-hover:text-[var(--color-brand-dark)]">
            <span>View Profile & Fixtures</span>
            <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
              →
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

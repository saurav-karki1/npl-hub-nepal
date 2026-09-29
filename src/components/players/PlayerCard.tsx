import Link from "next/link";
import { Player, getPlayerTeam } from "@/lib/data/players-data";
import { Card, CardBody } from "@/components/ui/Card";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const team = getPlayerTeam(player);

  // Generate initials for avatar fallback
  const initials = player.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleBadgeColors: Record<string, string> = {
    Batter: "bg-blue-50 text-blue-800 border-blue-200",
    Bowler: "bg-emerald-50 text-emerald-800 border-emerald-200",
    "All-rounder": "bg-purple-50 text-purple-800 border-purple-200",
    Wicketkeeper: "bg-amber-50 text-amber-900 border-amber-200",
  };

  return (
    <Card
      interactive
      className="h-full border-[var(--color-rule)] hover:border-[var(--color-brand)] transition-colors flex flex-col justify-between"
    >
      <CardBody className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
        {/* Top Header: Avatar & Badges */}
        <div className="flex items-start justify-between gap-3">
          {/* Avatar with team brand color accent */}
          <Link
            href={`/players/${player.slug}`}
            className="group/avatar block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-full shrink-0"
            tabIndex={-1}
            aria-hidden="true"
          >
            <div
              style={{
                backgroundColor: team ? team.crestBg : "var(--color-brand)",
                color: team ? team.crestText : "#ffffff",
              }}
              className="w-12 h-12 rounded-full font-black text-sm flex items-center justify-center shadow-2xs group-hover/avatar:scale-105 transition-transform select-none"
            >
              {initials}
            </div>
          </Link>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
            {player.captain && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[#052618] border border-[#b58f22]">
                Captain
              </span>
            )}
            {player.marquee && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-sm)] bg-amber-50 text-amber-800 border border-amber-200">
                Marquee
              </span>
            )}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-sm)] border ${
                roleBadgeColors[player.role] || "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {player.role}
            </span>
          </div>
        </div>

        {/* Middle: Player Name & Team */}
        <div className="space-y-1.5 flex-1">
          <Link
            href={`/players/${player.slug}`}
            className="group/name block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-xs"
          >
            <h3 className="font-bold text-base sm:text-lg text-[var(--color-ink)] group-hover/name:text-[var(--color-brand)] transition-colors leading-snug line-clamp-1">
              {player.name}
            </h3>
          </Link>

          {team ? (
            <Link
              href={`/teams/${team.slug}`}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-brand)] transition-colors font-medium"
            >
              <TeamLogo
                name={team.name}
                shortName={team.shortName}
                initials={team.initials}
                logoUrl={team.logoUrl}
                crestBg={team.crestBg}
                crestText={team.crestText}
                size="xs"
              />
              <span className="truncate">{team.name}</span>
            </Link>
          ) : (
            <span className="text-xs text-[var(--color-ink-muted)]">
              Unassigned
            </span>
          )}

          {/* Quick Specifications */}
          <div className="pt-2 text-[11px] text-[var(--color-ink-muted)] space-y-0.5 leading-tight">
            {player.battingStyle && (
              <div className="truncate">
                <span className="font-semibold text-[var(--color-ink-secondary)]">
                  Bat:
                </span>{" "}
                {player.battingStyle}
              </div>
            )}
            {player.bowlingStyle && (
              <div className="truncate">
                <span className="font-semibold text-[var(--color-ink-secondary)]">
                  Bowl:
                </span>{" "}
                {player.bowlingStyle}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Status & Direct Link */}
        <div className="pt-3 border-t border-[var(--color-rule)] flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[var(--radius-sm)] border border-emerald-200">
            Confirmed Retained
          </span>
          <Link
            href={`/players/${player.slug}`}
            className="font-semibold text-[var(--color-brand)] hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-xs"
          >
            <span>Profile</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

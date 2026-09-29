import Link from "next/link";
import { Player, getPlayerTeam } from "@/lib/data/players-data";
import { ConstellationBackground } from "@/components/ui/ConstellationBackground";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface PlayerHeroProps {
  player: Player;
}

export function PlayerHero({ player }: PlayerHeroProps) {
  const team = getPlayerTeam(player);

  const initials = player.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-emerald-950/60 shadow-sm">
      <ConstellationBackground className="bg-[#052618] text-white px-6 py-8 sm:px-10 sm:py-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar & Basic Information */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            {/* Player Avatar */}
            <div
              style={{
                backgroundColor: team ? team.crestBg : "var(--color-brand)",
                color: team ? team.crestText : "#ffffff",
              }}
              className="w-18 h-18 sm:w-22 sm:h-22 rounded-full font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 ring-4 ring-white/10 shadow-md select-none"
              aria-label={player.name}
            >
              {initials}
            </div>

            <div>
              {/* Badges / Eyebrow */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {player.captain && (
                  <span className="text-xs font-black uppercase tracking-wider bg-[var(--color-accent)] text-[#052618] px-2.5 py-0.5 rounded-[var(--radius-sm)] shadow-2xs">
                    Team Captain
                  </span>
                )}
                {player.marquee && (
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-[var(--radius-sm)] text-[var(--color-accent)]">
                    Marquee Player
                  </span>
                )}
                <span className="text-xs font-semibold text-emerald-200/90">
                  {player.role}
                </span>
                <span className="text-xs text-emerald-500" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-emerald-200/70">
                  {player.nationality}
                </span>
              </div>

              {/* Player Name */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {player.name}
              </h1>

              {/* Team Connection Link */}
              {team && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-xs text-emerald-200/70">Franchise:</span>
                  <Link
                    href={`/teams/${team.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-[var(--color-accent)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-xs"
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
                    <span>{team.name}</span>
                    <span aria-hidden="true" className="text-emerald-400">
                      →
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right: Key Verified Attributes Box */}
          <div className="bg-emerald-950/60 border border-emerald-800/50 rounded-[var(--radius-md)] p-4 space-y-2.5 text-xs min-w-[220px]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 block">
                NPL Season 3 Status
              </span>
              <span className="font-bold text-sm text-white block mt-0.5">
                Confirmed Retained
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-800/50 flex justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 block">
                  Batting
                </span>
                <span className="font-semibold text-emerald-100 text-xs mt-0.5 block">
                  {player.battingStyle || "Not yet available"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 block">
                  Bowling
                </span>
                <span className="font-semibold text-emerald-100 text-xs mt-0.5 block truncate max-w-[120px]">
                  {player.bowlingStyle || "Not yet available"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ConstellationBackground>
    </div>
  );
}

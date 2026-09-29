import { ConstellationBackground } from "@/components/ui/ConstellationBackground";
import { TeamDetail } from "@/lib/data/teams-data";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface TeamHeaderProps {
  team: TeamDetail;
}

export function TeamHeader({ team }: TeamHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-emerald-950/60 shadow-sm">
      <ConstellationBackground className="bg-[#052618] text-white px-6 py-8 sm:px-10 sm:py-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Crest & Team Name */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            {/* Team Logo */}
            <TeamLogo
              name={team.name}
              shortName={team.shortName}
              initials={team.initials}
              logoUrl={team.logoUrl}
              crestBg={team.crestBg}
              crestText={team.crestText}
              size="xl"
              className="w-18 h-18 sm:w-22 sm:h-22 ring-4 ring-white/10 shadow-md text-2xl sm:text-3xl"
              priority
            />

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-[var(--radius-sm)] text-[var(--color-accent)]">
                  {team.shortName}
                </span>
                <span className="text-xs font-semibold text-emerald-200/90">
                  {team.region}
                </span>
                <span className="text-xs text-emerald-500" aria-hidden="true">·</span>
                <span className="text-xs text-emerald-200/70">
                  Est. {team.established}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {team.name}
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
                {team.description}
              </p>
            </div>
          </div>

          {/* Right: Key Facts Badge Box */}
          <div className="bg-emerald-950/60 border border-emerald-800/50 rounded-[var(--radius-md)] p-4 space-y-2.5 text-xs min-w-[240px]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 block">
                Team Captain
              </span>
              <span className="font-bold text-sm text-white block mt-0.5">
                {team.captain}
              </span>
              {team.captainConfidence === "confirmed" ? (
                <span className="text-[10px] text-emerald-300 font-medium">
                  Confirmed for Season 3
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400">
                  Reported (2025 season; unconfirmed for S3)
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-emerald-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 block">
                Head Coach
              </span>
              <span className="text-zinc-400 italic block mt-0.5">
                {team.coach}
              </span>
            </div>
          </div>
        </div>
      </ConstellationBackground>
    </div>
  );
}

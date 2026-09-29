import Link from "next/link";
import { ConstellationBackground } from "@/components/ui/ConstellationBackground";
import { StatusBadge } from "@/components/ui/Card";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { ScheduleMatch, resolveMatchTeams } from "@/lib/repository/matches";
import { getTeamBySlug } from "@/lib/repository/teams";

interface MatchHeaderProps {
  match: ScheduleMatch;
}

export function MatchHeader({ match }: MatchHeaderProps) {
  const team1Detail = match.team1Id !== null ? getTeamBySlug(match.team1Id) : undefined;
  const team2Detail = match.team2Id !== null ? getTeamBySlug(match.team2Id) : undefined;
  const { team1, team2 } = resolveMatchTeams(match);

  // Playoff context strings
  const getPlayoffContext = (stage: string) => {
    switch (stage) {
      case "Qualifier 1":
        return "Page Playoff System: 1st place vs 2nd place in League Stage. The winner advances directly to the NPL Final; the loser moves to Qualifier 2.";
      case "Eliminator":
        return "Page Playoff System: 3rd place vs 4th place in League Stage. Knockout clash: the winner proceeds to Qualifier 2; the loser is eliminated.";
      case "Qualifier 2":
        return "Page Playoff System: Loser of Qualifier 1 meets the Winner of the Eliminator for the second berth in the NPL Final.";
      case "Final":
        return "Grand Finale: Winner of Qualifier 1 vs Winner of Qualifier 2 to determine the Champion of Siddhartha Bank NPL Season 3.";
      default:
        return null;
    }
  };

  const playoffContext = getPlayoffContext(match.stage);

  // Status badge config
  const statusVariant =
    match.status === "completed"
      ? "completed"
      : match.status === "live"
      ? "live"
      : match.status === "tba"
      ? "neutral"
      : "upcoming";

  const statusLabel =
    match.status === "completed"
      ? "Match Result"
      : match.status === "live"
      ? "Live"
      : match.status === "tba"
      ? "Time TBA"
      : "Match Scheduled";

  return (
    <header className="relative overflow-hidden rounded-[var(--radius-lg)] border border-emerald-950/60 shadow-md">
      <ConstellationBackground className="bg-[#052618] text-white px-5 py-6 sm:px-8 sm:py-9">
        <div className="relative z-10 space-y-6">
          {/* Top Metadata Row: Match #, Stage, Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/40 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-[var(--radius-sm)] text-[var(--color-accent)]">
                Match #{match.matchNumber}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                {match.stage} {match.stage === "League" ? "Stage" : "Playoff"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={statusVariant} label={statusLabel} />
            </div>
          </div>

          {/* Teams Face-off & Scoreboard (Result-Ready Structure) */}
          <div className="grid grid-cols-1 lg:grid-cols-11 items-center gap-6 py-2">
            {/* Team 1 Side */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-center justify-center lg:justify-end text-center sm:text-left lg:text-right gap-4">
              <div className="order-2 sm:order-1 lg:order-1">
                {team1Detail ? (
                  <Link
                    href={`/teams/${team1Detail.slug}`}
                    className="group inline-block"
                  >
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white group-hover:text-[var(--color-accent)] transition-colors leading-tight">
                      {team1.name}
                    </h2>
                    <span className="text-xs text-emerald-300/80 block mt-0.5 group-hover:underline">
                      {team1Detail.region} · {team1Detail.city} →
                    </span>
                  </Link>
                ) : (
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                      {team1.name}
                    </h2>
                    <span className="text-xs text-amber-300/90 block mt-0.5">
                      Playoff Placeholder · {team1.city}
                    </span>
                  </div>
                )}

                {/* Score display (if completed) or captain preview (if upcoming) */}
                {match.status === "completed" && match.scores?.team1 ? (
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {match.scores.team1.runs}/{match.scores.team1.wickets}
                    </span>
                    <span className="text-xs text-emerald-300 ml-1.5 font-semibold">
                      ({match.scores.team1.overs} ov)
                    </span>
                  </div>
                ) : team1Detail ? (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Captain: <strong className="text-zinc-200">{team1Detail.captain}</strong>
                  </p>
                ) : null}
              </div>

              {/* Team 1 Logo */}
              <div className="order-1 sm:order-2 lg:order-2 shrink-0">
                <TeamLogo
                  name={team1.name}
                  shortName={team1.shortName}
                  initials={team1.initials}
                  logoUrl={team1.logoUrl || team1Detail?.logoUrl}
                  crestBg={team1Detail?.crestBg || "#1e40af"}
                  crestText={team1Detail?.crestText || "#ffffff"}
                  size="xl"
                  className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-white/10 shadow-md text-xl sm:text-2xl"
                  priority
                />
              </div>
            </div>

            {/* VS Separator & Time Center */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center text-center">
              <span className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black text-[var(--color-accent)] uppercase tracking-wider shadow-inner">
                VS
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/70 mt-1.5">
                20 Overs
              </span>
            </div>

            {/* Team 2 Side */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-center justify-center lg:justify-start text-center sm:text-left gap-4">
              {/* Team 2 Logo */}
              <div className="shrink-0">
                <TeamLogo
                  name={team2.name}
                  shortName={team2.shortName}
                  initials={team2.initials}
                  logoUrl={team2.logoUrl || team2Detail?.logoUrl}
                  crestBg={team2Detail?.crestBg || "#92400e"}
                  crestText={team2Detail?.crestText || "#ffffff"}
                  size="xl"
                  className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-white/10 shadow-md text-xl sm:text-2xl"
                  priority
                />
              </div>

              <div>
                {team2Detail ? (
                  <Link
                    href={`/teams/${team2Detail.slug}`}
                    className="group inline-block"
                  >
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white group-hover:text-[var(--color-accent)] transition-colors leading-tight">
                      {team2.name}
                    </h2>
                    <span className="text-xs text-emerald-300/80 block mt-0.5 group-hover:underline">
                      {team2Detail.region} · {team2Detail.city} →
                    </span>
                  </Link>
                ) : (
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                      {team2.name}
                    </h2>
                    <span className="text-xs text-amber-300/90 block mt-0.5">
                      Playoff Placeholder · {team2.city}
                    </span>
                  </div>
                )}

                {/* Score display (if completed) or captain preview (if upcoming) */}
                {match.status === "completed" && match.scores?.team2 ? (
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {match.scores.team2.runs}/{match.scores.team2.wickets}
                    </span>
                    <span className="text-xs text-emerald-300 ml-1.5 font-semibold">
                      ({match.scores.team2.overs} ov)
                    </span>
                  </div>
                ) : team2Detail ? (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Captain: <strong className="text-zinc-200">{team2Detail.captain}</strong>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Completed Match Result or Pre-Match Scheduled State */}
          {match.status === "completed" ? (
            <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-[var(--radius-md)] p-3.5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                Match Result
              </span>
              <p className="text-base sm:text-lg font-black text-white mt-0.5">
                {match.resultDetails?.statement || match.result || "Match Completed"}
              </p>
              {match.resultDetails?.playerOfTheMatch && (
                <p className="text-xs text-emerald-200 mt-1">
                  Player of the Match: <strong>{match.resultDetails.playerOfTheMatch}</strong>
                </p>
              )}
            </div>
          ) : (
            <div className="bg-emerald-950/60 border border-emerald-800/50 rounded-[var(--radius-md)] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Pre-Match State:</strong> Official match scheduled for NPL Season 3. Toss details, starting XIs, and live scores will be published when the match begins.
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 shrink-0 bg-white/5 px-2.5 py-1 rounded-[var(--radius-xs)] border border-white/10">
                Zero Fabricated Scores
              </span>
            </div>
          )}

          {/* Playoff Progression Explanation Notice (Only for playoff fixtures) */}
          {playoffContext && (
            <div className="bg-blue-950/40 border border-blue-800/40 rounded-[var(--radius-md)] p-3 text-xs text-blue-100 flex items-start gap-2.5">
              <span className="text-blue-400 text-sm leading-none shrink-0" aria-hidden="true">
                ℹ
              </span>
              <div>
                <strong className="text-blue-200 font-semibold block mb-0.5">
                  Playoff Qualification Stakes ({match.stage})
                </strong>
                <p className="text-blue-200/90 leading-relaxed">
                  {playoffContext}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Bar: Dual Date, Local Time & Venue */}
          <div className="pt-4 border-t border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-100/90">
            {/* Dual Calendar Dates */}
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>📅 {match.bsDateNepali}</span>
                <span className="text-emerald-400/80 font-normal text-xs">({match.bsDate})</span>
              </div>
              <div className="text-[11px] text-emerald-200/70">
                {match.dayOfWeek}, {match.formattedDate}
              </div>
            </div>

            {/* Time & Venue */}
            <div className="text-left sm:text-right space-y-0.5">
              <div className="font-bold text-sm text-[var(--color-accent)]">
                ⏰ {match.time === "Time TBA" ? "Time TBA (To Be Announced)" : match.time}
              </div>
              <div className="text-[11px] text-emerald-200/70 flex items-center sm:justify-end gap-1">
                <span>📍</span>
                <span>{match.venue}</span>
              </div>
            </div>
          </div>
        </div>
      </ConstellationBackground>
    </header>
  );
}

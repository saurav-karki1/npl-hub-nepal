"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody, StatusBadge } from "@/components/ui/Card";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { ScheduleMatch, resolveMatchTeams } from "@/lib/repository/matches";
import { getTeamBySlugSync } from "@/lib/repository/teams";
import { oversToDecimal } from "@/lib/data/standings";

interface MatchScoreboardProps {
  match: ScheduleMatch;
}

export function MatchScoreboard({ match }: MatchScoreboardProps) {
  const team1Detail = match.team1Id !== null ? getTeamBySlugSync(match.team1Id) : undefined;
  const team2Detail = match.team2Id !== null ? getTeamBySlugSync(match.team2Id) : undefined;
  const { team1, team2 } = resolveMatchTeams(match);

  const [matchStatus, setMatchStatus] = useState(match.status);
  const [liveScores, setLiveScores] = useState(match.scores);
  const [resultStatement, setResultStatement] = useState<string | null>(
    match.resultDetails?.statement || match.result || null
  );
  const [liveSummary, setLiveSummary] = useState<string | null>(null);

  const isCompleted = matchStatus === "completed";
  const isLive = matchStatus === "live";
  const isPostponed = matchStatus === "postponed";

  useEffect(() => {
    if (!isLive) return;

    let isMounted = true;
    const fetchLive = async () => {
      try {
        const res = await fetch(`/api/matches/${match.slug}/live-score`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.isCompleted) {
              setMatchStatus("completed");
              if (data.resultStatement) {
                setResultStatement(data.resultStatement);
              }
            } else if (data.live) {
              setMatchStatus("live");
            }
            if (data.scores) {
              setLiveScores(data.scores);
            }
            if (data.summary) {
              setLiveSummary(data.summary);
            }
          }
        }
      } catch {
        // Keep existing score on transient fetch error
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive, match.slug]);

  const hasScores = Boolean(
    liveScores?.team1?.runs != null || liveScores?.team2?.runs != null
  );

  return (
    <section aria-labelledby="scoreboard-heading" className="space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--color-rule)] pb-2.5">
        <div>
          <h2 id="scoreboard-heading" className="text-lg sm:text-xl font-black text-[var(--color-ink)]">
            {isCompleted ? "Match Scorecard & Result" : isLive ? "Live Match Scoreboard" : isPostponed ? "Match Postponed" : "Pre-Match Scoreboard & Status"}
          </h2>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            {isCompleted
              ? "Official match outcome, innings scores, and match metrics."
              : isLive
              ? "Live match in progress. Scores updated in real-time."
              : isPostponed
              ? "This match has been postponed due to heavy rainfall. Rescheduling details to follow."
              : "Pre-match fixture state. Official scores and lineups will activate once the match is underway."}
          </p>
        </div>

        <StatusBadge
          status={isCompleted ? "completed" : isLive ? "live" : isPostponed ? "postponed" : "upcoming"}
          label={isCompleted ? "Final Result" : isLive ? "Live" : isPostponed ? "Postponed" : "Scheduled"}
        />
      </div>

      <Card className="border-[var(--color-rule)] bg-[var(--color-canvas)]">
        {/* If Completed or Live or has scores: Result-ready scoreboard */}
        {isCompleted || isLive || hasScores ? (
          <CardBody className="p-5 sm:p-6 space-y-6">
            {/* Winner Announcement or Live Banner */}
            {isCompleted ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand)] block mb-1">
                  Official Result
                </span>
                <p className="text-lg sm:text-xl font-black text-[var(--color-ink)]">
                  {resultStatement || match.resultDetails?.statement || match.result || "Match Completed"}
                </p>
                {match.resultDetails?.winMargin && (
                  <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                    Margin: <strong>{match.resultDetails.winMargin}</strong>
                  </p>
                )}
              </div>
            ) : isLive ? (
              <div className="bg-[#120406] border border-red-500/50 rounded-xl p-4 text-center space-y-1.5 shadow-md">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-red-400">
                    LIVE MATCH IN PROGRESS
                  </span>
                </div>
                {liveSummary && (
                  <p className="text-sm sm:text-base font-black text-white font-mono tracking-tight">
                    {liveSummary}
                  </p>
                )}
              </div>
            ) : null}

            {/* Innings Score Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-rule)] bg-[var(--color-surface)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    <th scope="col" className="py-2.5 px-4">Team</th>
                    <th scope="col" className="py-2.5 px-4 text-center">Runs</th>
                    <th scope="col" className="py-2.5 px-4 text-center">Wickets</th>
                    <th scope="col" className="py-2.5 px-4 text-center">Overs</th>
                    <th scope="col" className="py-2.5 px-4 text-right">Run Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)]">
                  {/* Team 1 */}
                  {(() => {
                    const isTeam1Batting = (Number(liveScores?.team1?.runs) > 0) || (liveScores?.team1?.overs && liveScores.team1.overs !== "0.0");
                    const isTeam2Active = (Number(liveScores?.team2?.runs) > 0) || (liveScores?.team2?.overs && liveScores.team2.overs !== "0.0");
                    const isTeam1YetToBat = isLive && !isTeam1Batting && isTeam2Active;

                    return (
                      <tr>
                        <td className="py-3 px-4 font-bold text-xs text-[var(--color-ink)] flex items-center gap-2">
                          <TeamLogo
                            name={team1.name}
                            shortName={team1.shortName}
                            initials={team1.initials}
                            logoUrl={team1.logoUrl || team1Detail?.logoUrl}
                            crestBg={team1Detail?.crestBg}
                            crestText={team1Detail?.crestText}
                            size="xs"
                          />
                          {team1.name}
                        </td>
                        {isTeam1YetToBat ? (
                          <td colSpan={4} className="py-3 px-4 text-center text-xs font-semibold text-[var(--color-ink-muted)] italic">
                            Yet to bat
                          </td>
                        ) : (
                          <>
                            <td className="py-3 px-4 text-center font-black text-sm text-[var(--color-ink)]">
                              {liveScores?.team1?.runs ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-[var(--color-ink-secondary)]">
                              {liveScores?.team1?.wickets ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-[var(--color-ink-secondary)]">
                              {liveScores?.team1?.overs ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-right text-xs font-mono text-[var(--color-ink)]">
                              {(() => {
                                if (!liveScores?.team1 || liveScores.team1.runs == null) return "—";
                                const dec = oversToDecimal(liveScores.team1.overs, liveScores.team1.wickets);
                                return dec > 0 ? (liveScores.team1.runs / dec).toFixed(2) : "—";
                              })()}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })()}

                  {/* Team 2 */}
                  {(() => {
                    const isTeam2Batting = (Number(liveScores?.team2?.runs) > 0) || (liveScores?.team2?.overs && liveScores.team2.overs !== "0.0");
                    const isTeam1Active = (Number(liveScores?.team1?.runs) > 0) || (liveScores?.team1?.overs && liveScores.team1.overs !== "0.0");
                    const isTeam2YetToBat = isLive && !isTeam2Batting && isTeam1Active;

                    return (
                      <tr>
                        <td className="py-3 px-4 font-bold text-xs text-[var(--color-ink)] flex items-center gap-2">
                          <TeamLogo
                            name={team2.name}
                            shortName={team2.shortName}
                            initials={team2.initials}
                            logoUrl={team2.logoUrl || team2Detail?.logoUrl}
                            crestBg={team2Detail?.crestBg}
                            crestText={team2Detail?.crestText}
                            size="xs"
                          />
                          {team2.name}
                        </td>
                        {isTeam2YetToBat ? (
                          <td colSpan={4} className="py-3 px-4 text-center text-xs font-semibold text-[var(--color-ink-muted)] italic">
                            Yet to bat
                          </td>
                        ) : (
                          <>
                            <td className="py-3 px-4 text-center font-black text-sm text-[var(--color-ink)]">
                              {liveScores?.team2?.runs ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-[var(--color-ink-secondary)]">
                              {liveScores?.team2?.wickets ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-[var(--color-ink-secondary)]">
                              {liveScores?.team2?.overs ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-right text-xs font-mono text-[var(--color-ink)]">
                              {(() => {
                                if (!liveScores?.team2 || liveScores.team2.runs == null) return "—";
                                const dec = oversToDecimal(liveScores.team2.overs, liveScores.team2.wickets);
                                return dec > 0 ? (liveScores.team2.runs / dec).toFixed(2) : "—";
                              })()}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Match Awards & Highlights */}
            {match.resultDetails?.playerOfTheMatch && (
              <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">
                  Player of the Match
                </span>
                <span className="font-bold text-[var(--color-brand)]">
                  {match.resultDetails.playerOfTheMatch}
                </span>
              </div>
            )}
          </CardBody>
        ) : (
          /* Pre-Match State: Season 3 upcoming matches with zero invented scores */
          <CardBody className="p-6 sm:p-8 space-y-6">
            {/* Pre-Match Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team 1 Standby Card */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TeamLogo
                    name={team1.name}
                    shortName={team1.shortName}
                    initials={team1.initials}
                    logoUrl={team1.logoUrl || team1Detail?.logoUrl}
                    crestBg={team1Detail?.crestBg || "#1e40af"}
                    crestText={team1Detail?.crestText || "#ffffff"}
                    size="md"
                  />
                  <div>
                    {team1Detail ? (
                      <Link
                        href={`/teams/${team1Detail.slug}`}
                        className="font-bold text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors block"
                      >
                        {team1.name}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm text-[var(--color-ink)] block">
                        {team1.name}
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--color-ink-muted)]">
                      {team1.city}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-[var(--color-ink-muted)] block">
                    Score
                  </span>
                  <span className="text-sm font-bold text-[var(--color-ink-faint)]">
                    Upcoming
                  </span>
                </div>
              </div>

              {/* Team 2 Standby Card */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TeamLogo
                    name={team2.name}
                    shortName={team2.shortName}
                    initials={team2.initials}
                    logoUrl={team2.logoUrl || team2Detail?.logoUrl}
                    crestBg={team2Detail?.crestBg || "#92400e"}
                    crestText={team2Detail?.crestText || "#ffffff"}
                    size="md"
                  />
                  <div>
                    {team2Detail ? (
                      <Link
                        href={`/teams/${team2Detail.slug}`}
                        className="font-bold text-sm text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors block"
                      >
                        {team2.name}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm text-[var(--color-ink)] block">
                        {team2.name}
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--color-ink-muted)]">
                      {team2.city}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-[var(--color-ink-muted)] block">
                    Score
                  </span>
                  <span className="text-sm font-bold text-[var(--color-ink-faint)]">
                    Upcoming
                  </span>
                </div>
              </div>
            </div>

            {/* Pre-Match Guarantee Callout */}
            <div className="border border-dashed border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 bg-[var(--color-canvas)] text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-rule)] text-sm font-bold text-[var(--color-ink-muted)] flex items-center justify-center mx-auto">
                🏏
              </div>
              <h3 className="font-bold text-sm text-[var(--color-ink)]">
                Match Scheduled · Siddhartha Bank NPL Season 3
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)] max-w-lg mx-auto leading-relaxed">
                This fixture is scheduled for {match.formattedDate} ({match.bsDateNepali}) at {match.venue}.
                Official toss result, starting playing XIs, ball-by-ball scorecards, and player-of-the-match awards will be updated as soon as the match commences.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[var(--color-ink-muted)]">
                <span className="bg-[var(--color-surface)] px-2.5 py-0.5 rounded-xs border border-[var(--color-rule)]">
                  Format: 20 Overs T20
                </span>
                <span className="bg-[var(--color-surface)] px-2.5 py-0.5 rounded-xs border border-[var(--color-rule)]">
                  Venue: TU Stadium, Kirtipur
                </span>
                <span className="bg-[var(--color-surface)] px-2.5 py-0.5 rounded-xs border border-[var(--color-rule)]">
                  Time: {match.time}
                </span>
              </div>
            </div>
          </CardBody>
        )}
      </Card>
    </section>
  );
}

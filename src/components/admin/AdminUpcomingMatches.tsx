import React from "react";
import Link from "next/link";
import { ScheduleMatch } from "@/lib/repository/matches";
import { resolveMatchTeams } from "@/lib/data/schedule-data";

interface AdminUpcomingMatchesProps {
  matches: ScheduleMatch[];
  isLoading?: boolean;
}

export function AdminUpcomingMatches({ matches, isLoading }: AdminUpcomingMatchesProps) {
  if (isLoading) {
    return (
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="w-36 h-4 bg-slate-800 rounded animate-pulse" />
          <div className="w-24 h-4 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-slate-900/60 rounded-lg animate-pulse h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Upcoming Fixtures
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Next scheduled matches from Season 3 calendar
          </p>
        </div>

        <Link
          href="/admin/matches"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
        >
          <span>View all matches</span>
          <span>→</span>
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No upcoming matches scheduled.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {matches.map((match) => {
            const { team1, team2 } = resolveMatchTeams(match);

            return (
              <div
                key={match.id}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors"
              >
                {/* Match Number & Teams */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Match {match.matchNumber} · {match.stage}
                    </span>
                    <span className="text-xs text-slate-400">
                      {match.formattedDate || match.date}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-slate-100">{team1.name}</span>
                    <span className="text-xs text-slate-500 font-normal">vs</span>
                    <span className="text-slate-100">{team2.name}</span>
                  </div>
                </div>

                {/* Match Time, Venue & Status */}
                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0">
                  <div className="sm:text-right">
                    <span className="text-slate-300 font-mono block">
                      {match.time}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      TU Stadium, Kirtipur
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                    {match.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

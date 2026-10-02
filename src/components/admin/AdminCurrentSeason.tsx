import React from "react";
import { AdminSeasonInfo } from "@/lib/repository/admin";

interface AdminCurrentSeasonProps {
  seasonInfo: AdminSeasonInfo;
  isLoading?: boolean;
}

export function AdminCurrentSeason({ seasonInfo, isLoading }: AdminCurrentSeasonProps) {
  if (isLoading) {
    return (
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 animate-pulse space-y-4">
        <div className="w-32 h-4 bg-slate-800 rounded" />
        <div className="w-64 h-8 bg-slate-800 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="w-16 h-3 bg-slate-800 rounded" />
              <div className="w-24 h-5 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Format tournament status from database
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("in-progress") || s.includes("live")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Live Tournament
        </span>
      );
    }
    if (s.includes("completed")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a5c36]/30 border border-[#0a5c36] text-[#34d399] text-xs font-bold uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        Pre-Tournament (Scheduled)
      </span>
    );
  };

  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="text-amber-400">🏆</span>
            <span>Current Competition</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Siddhartha Bank Nepal Premier League
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            {seasonInfo.seasonTitle} · Year {seasonInfo.year} ({seasonInfo.edition})
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          {getStatusBadge(seasonInfo.status)}
        </div>
      </div>

      {/* Season Fact Sheet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Tournament Status
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1 block capitalize">
            {seasonInfo.status}
          </span>
          <span className="text-[11px] text-slate-500">Verified from DB</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Scheduled Dates
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1 block">
            {seasonInfo.projectedDates}
          </span>
          <span className="text-[11px] text-slate-500">Season 3 window</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Tournament Venue
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1 block truncate" title={seasonInfo.venue}>
            TU Stadium, Kirtipur
          </span>
          <span className="text-[11px] text-slate-500">Official Ground</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Structure
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1 block">
            {seasonInfo.totalTeams} Teams · {seasonInfo.totalMatches} Matches
          </span>
          <span className="text-[11px] text-slate-500">28 League + 4 Playoffs</span>
        </div>
      </div>
    </div>
  );
}

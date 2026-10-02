import React from "react";
import Link from "next/link";

export default function AdminStatsPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span>📈</span>
              <span>Statistics & Historical Archives</span>
            </div>
            <h1 className="text-2xl font-black text-white">Stats Module</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage tournament awards, player season stats, and verified historical records.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-[#0c121e] border border-dashed border-slate-800 rounded-xl p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#0a5c36]/20 border border-[#0a5c36]/40 flex items-center justify-center text-xl mx-auto">
          📈
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">
            Stats Module — Scheduled for CRUD Phase
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tournament award additions, player season record adjustments, and multi-season archive management workflows will be enabled in the upcoming CRUD phase.
          </p>
        </div>
        <div className="pt-2">
          <span className="text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full">
            Database: 8 Season 2 Awards & 4 Verified Player Stats in PostgreSQL
          </span>
        </div>
      </div>
    </div>
  );
}

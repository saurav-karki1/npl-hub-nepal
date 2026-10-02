import React from "react";
import Link from "next/link";

interface QuickActionItem {
  title: string;
  description: string;
  icon: string;
  href: string;
  accentColor: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: "Manage Teams",
    description: "Review franchise details, squad sizes, and leadership",
    icon: "🛡️",
    href: "/admin/teams",
    accentColor: "border-emerald-800/60 hover:border-emerald-600",
  },
  {
    title: "Manage Players",
    description: "Inspect verified rosters, retain lists, and marquee cards",
    icon: "🏏",
    href: "/admin/players",
    accentColor: "border-sky-800/60 hover:border-sky-600",
  },
  {
    title: "Manage Matches",
    description: "Verify Season 3 calendar, match timings, and TU venues",
    icon: "📅",
    href: "/admin/matches",
    accentColor: "border-amber-800/60 hover:border-amber-600",
  },
  {
    title: "Manage News",
    description: "Review published articles, categories, and tags",
    icon: "📰",
    href: "/admin/news",
    accentColor: "border-purple-800/60 hover:border-purple-600",
  },
  {
    title: "Manage Stats",
    description: "Browse historical Season 2 awards and tournament records",
    icon: "📈",
    href: "/admin/stats",
    accentColor: "border-rose-800/60 hover:border-rose-600",
  },
];

export function AdminQuickActions() {
  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Quick Management Actions
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct navigation into platform management modules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`group bg-slate-900/80 hover:bg-slate-800/90 border ${action.accentColor} p-4 rounded-lg flex flex-col justify-between transition-all hover:scale-[1.01]`}
          >
            <div>
              <span className="text-2xl block mb-2">{action.icon}</span>
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                {action.title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {action.description}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-300">
              <span>Open module</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

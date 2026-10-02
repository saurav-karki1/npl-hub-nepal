import React from "react";
import Link from "next/link";
import { AdminCounts } from "@/lib/repository/admin";

interface AdminSummaryCardsProps {
  counts: AdminCounts;
  isLoading?: boolean;
}

export function AdminSummaryCards({ counts, isLoading }: AdminSummaryCardsProps) {
  const cards = [
    {
      title: "Franchise Teams",
      count: counts.teams,
      subtitle: "Season 3 active franchises",
      icon: "🛡️",
      href: "/admin/teams",
      tag: "Verified",
    },
    {
      title: "Verified Players",
      count: counts.players,
      subtitle: "Confirmed squad & marquee players",
      icon: "🏏",
      href: "/admin/players",
      tag: "Active",
    },
    {
      title: "Tournament Matches",
      count: counts.matches,
      subtitle: "28 League + 4 Playoff fixtures",
      icon: "📅",
      href: "/admin/matches",
      tag: "Season 3",
    },
    {
      title: "Published News",
      count: counts.publishedNews,
      subtitle: "Verified editorial articles",
      icon: "📰",
      href: "/admin/news",
      tag: "Live",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#0c121e] border border-slate-800 p-5 rounded-xl animate-pulse space-y-3"
          >
            <div className="w-8 h-8 bg-slate-800 rounded-lg" />
            <div className="w-16 h-3 bg-slate-800 rounded" />
            <div className="w-24 h-7 bg-slate-800 rounded" />
            <div className="w-32 h-3 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="group block bg-[#0c121e] border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all hover:bg-[#0f172a]/70 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <span className="text-2xl p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-slate-700 transition-colors">
              {card.icon}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              {card.tag}
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300">
              {card.title}
            </h3>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">
              {card.count}
            </p>
            <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-[#34d399] transition-colors">
            <span>View {card.title.toLowerCase()}</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

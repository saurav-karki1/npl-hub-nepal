import React from "react";
import Link from "next/link";
import { NewsArticle } from "@/lib/repository/news";

interface AdminRecentNewsProps {
  articles: NewsArticle[];
  isLoading?: boolean;
}

export function AdminRecentNews({ articles, isLoading }: AdminRecentNewsProps) {
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
            <span className="text-sm">📰</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Recent News & Editorial
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Published tournament coverage and announcements
          </p>
        </div>

        <Link
          href="/admin/news"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
        >
          <span>Manage news</span>
          <span>→</span>
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No published articles found.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    {article.displayDate || article.publishedAt}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100 truncate hover:text-white">
                  {article.title}
                </h4>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Published
                </span>
                <Link
                  href={`/news/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-300 text-xs transition-colors p-1"
                  title="View live article"
                >
                  ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

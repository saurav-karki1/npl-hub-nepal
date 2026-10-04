"use client";

/**
 * NPL Hub Nepal — Admin Dashboard Home
 *
 * Authenticated administration dashboard shell showing real database metrics,
 * current season status, upcoming matches, recent news, quick actions,
 * and Supabase connection health.
 */

import React, { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import {
  getAdminDashboardData,
  AdminDashboardData,
} from "@/lib/repository/admin";
import { AdminSummaryCards } from "@/components/admin/AdminSummaryCards";
import { AdminCurrentSeason } from "@/components/admin/AdminCurrentSeason";
import { AdminUpcomingMatches } from "@/components/admin/AdminUpcomingMatches";
import { AdminRecentNews } from "@/components/admin/AdminRecentNews";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { AdminDatabaseStatus } from "@/components/admin/AdminDatabaseStatus";
import { AdminLiveSyncCard } from "@/components/admin/AdminLiveSyncCard";

export default function AdminDashboardPage() {
  const { user } = useAdminAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminDashboardData();
      setData(result);
    } catch {
      setError("Unable to load complete dashboard information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getAdminDashboardData()
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load complete dashboard information. Please try again.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Page Header & Admin Identity ── */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Authenticated Session
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Admin Panel Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              NPL Hub Nepal administration console for Season 3 (2026). Monitor database health, oversee fixtures, and manage platform editorial content.
            </p>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Active Administrator
              </span>
              <span className="text-xs font-semibold text-slate-200 block truncate max-w-[200px]">
                {user?.email}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                Supabase Auth · Active
              </span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh dashboard data"
            >
              <svg
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner (if any) ── */}
      {error && (
        <div className="bg-amber-950/60 border border-amber-800/80 text-amber-200 p-4 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-xs font-bold bg-amber-900/60 hover:bg-amber-800 px-3 py-1 rounded text-amber-100 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Live Sync Card ── */}
      <AdminLiveSyncCard />

      {/* ── Database Status Indicator ── */}
      <AdminDatabaseStatus
        dbStatus={
          data?.dbStatus || {
            isConnected: false,
            provider: "Evaluating...",
            message: "Checking database health status...",
          }
        }
        isLoading={isLoading}
      />

      {/* ── Real Database Summary Counters ── */}
      <AdminSummaryCards
        counts={
          data?.counts || {
            teams: 8,
            players: 53,
            matches: 32,
            publishedNews: 4,
          }
        }
        isLoading={isLoading}
      />

      {/* ── Current Season Overview ── */}
      <AdminCurrentSeason
        seasonInfo={
          data?.seasonInfo || {
            name: "Siddhartha Bank Nepal Premier League",
            seasonTitle: "Season 3",
            year: 2026,
            status: "Pre-Tournament",
            edition: "2026 Edition",
            venue: "TU International Cricket Stadium, Kirtipur",
            projectedDates: "26 October – 21 November 2026",
            totalTeams: 8,
            totalMatches: 32,
          }
        }
        isLoading={isLoading}
      />

      {/* ── Quick Actions Section ── */}
      <AdminQuickActions />

      {/* ── Two-Column Operational Grids: Matches & News ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminUpcomingMatches
          matches={data?.upcomingMatches || []}
          isLoading={isLoading}
        />
        <AdminRecentNews
          articles={data?.recentNews || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

"use client";

/**
 * NPL Hub Nepal — Live Cricket Data & Ingestion Dashboard
 *
 * Displays real-time infrastructure telemetry for:
 * - Provider: ESPN Live Cricket API (series 1558581)
 * - Automation: Render Background Worker (continuous 15s sync loop)
 * - Storage: Supabase Database (matches, match_commentary, team_seasons)
 *
 * Real Health Status:
 * - Green: Healthy / Running
 * - Yellow: Delayed / Warning (No recent synchronization)
 * - Red: Failed / Error / Stopped
 * - Gray: Unknown / Not verified
 */

import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";

interface WorkerTelemetry {
  status: "running" | "delayed" | "error" | "stopped" | "unknown";
  statusLabel: string;
  indicatorColor: "green" | "yellow" | "red" | "gray";
  message: string;
  lastPollAt: string | null;
  lastSuccessfulSync: string | null;
  uptimeSeconds: number | null;
  syncCount: number;
  lastError: string | null;
  source: string;
}

interface DatabaseCounts {
  connected: boolean;
  totalMatches: number;
  liveMatches: number;
  completedMatches: number;
  ballByBallEvents: number;
  lastCommentaryAt: string | null;
}

interface PipelineStatusData {
  provider: {
    name: string;
    displayName: string;
    seriesId: string;
    engine: string;
    workerType: string;
    database: string;
  };
  worker: WorkerTelemetry;
  database: DatabaseCounts;
  timestamp: string;
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "No record";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Invalid date";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatExactTime(isoString: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function AdminLiveSyncCard() {
  const { session } = useAdminAuth();
  const [data, setData] = useState<PipelineStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cricket/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setFeedback({
          type: "error",
          message: `Status check failed: ${errJson.error || res.statusText}`,
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Network error while connecting to cricket status API.",
      });
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh status every 30 seconds for live visibility
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleSync = async () => {
    if (!session?.access_token || syncing) return;
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/cricket/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setFeedback({
          type: "success",
          message:
            resData.message ||
            `Sync completed successfully via ESPN. Processed ${resData.summary?.totalMatchesProcessed || 0} match(es).`,
        });
        await fetchStatus();
      } else {
        setFeedback({
          type: "error",
          message: resData.error || "Sync request failed.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Network error during live synchronization.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRecalculateStandings = async () => {
    if (!session?.access_token || recalculating) return;
    setRecalculating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/cricket/standings/recalculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ seasonId: "season-3" }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setFeedback({
          type: "success",
          message: `Standings recalculated successfully! Updated ${resData.updatedTeams} franchise standings based on ${resData.totalCompletedMatches} completed matches.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: `Recalculation error: ${resData.error || "Failed"}`,
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Network error during standings recalculation.",
      });
    } finally {
      setRecalculating(false);
    }
  };

  const worker = data?.worker;
  const db = data?.database;
  const color = worker?.indicatorColor || "gray";

  // Visual status pill classes
  const colorClasses = {
    green: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse",
      text: "text-emerald-400",
    },
    yellow: {
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
      text: "text-amber-400",
    },
    red: {
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
      text: "text-rose-400",
    },
    gray: {
      badge: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      dot: "bg-slate-500",
      text: "text-slate-400",
    },
  }[color];

  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* ── Top Header: Identity & Actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`w-2.5 h-2.5 rounded-full ${colorClasses.dot}`} />
            <h3 className="font-bold text-base text-white tracking-tight">
              Live Cricket Data &amp; Ingestion
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/40">
              ESPN API
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              Render Worker
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              Supabase
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time pipeline monitoring for ball-by-ball commentary, live scores, and automated standings.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            title="Refresh current status without triggering sync"
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
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
            <span>Refresh Status</span>
          </button>

          <button
            type="button"
            onClick={handleRecalculateStandings}
            disabled={recalculating}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {recalculating ? (
              <>
                <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Calculating…</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Recalculate Standings</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {syncing ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Syncing Live Data…</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Sync Live Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Diagnostic Status Banner ── */}
      <div className="bg-[#080e1a] border border-slate-800/80 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${colorClasses.badge}`}
          >
            <span className={`w-2 h-2 rounded-full ${colorClasses.dot}`} />
            Worker: {worker?.statusLabel || "Checking…"}
          </span>
          <p className="text-slate-300 font-medium">
            {worker?.message || (loading ? "Verifying background worker health…" : "Status unavailable")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
          <span>
            Telemetry Source:{" "}
            <b className="text-slate-300 font-mono">
              {worker?.source === "http-probe"
                ? "HTTP Direct Probe"
                : worker?.source === "database-heartbeat"
                ? "Supabase Heartbeat"
                : "Awaiting Verification"}
            </b>
          </span>
        </div>
      </div>

      {/* ── 8 Metrics Grid (As specified in requirement table) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Provider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Provider
          </span>
          <div className="text-sm font-black text-white flex items-center gap-1.5">
            <span>ESPN</span>
            <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/40">
              Live REST
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Series ID: 1558581</span>
        </div>

        {/* Metric 2: Worker Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Worker Status
          </span>
          <div className="text-sm font-black flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${colorClasses.dot}`} />
            <span className={colorClasses.text}>{worker?.statusLabel || "Unknown"}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {worker?.uptimeSeconds != null
              ? `Uptime: ${Math.floor(worker.uptimeSeconds / 60)} mins`
              : "15s polling daemon"}
          </span>
        </div>

        {/* Metric 3: Last Successful Sync */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Last Successful Sync
          </span>
          <div className="text-sm font-black text-white">
            {formatRelativeTime(worker?.lastSuccessfulSync || null)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {formatExactTime(worker?.lastSuccessfulSync || null)}
          </span>
        </div>

        {/* Metric 4: Last API Poll */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Last API Poll
          </span>
          <div className="text-sm font-black text-white">
            {formatRelativeTime(worker?.lastPollAt || null)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {formatExactTime(worker?.lastPollAt || null)}
          </span>
        </div>

        {/* Metric 5: Total Matches */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Total Matches
          </span>
          <div className="text-sm font-black text-white">
            {db?.totalMatches ?? "—"}
          </div>
          <span className="text-[10px] text-slate-500 block">Supabase matches table</span>
        </div>

        {/* Metric 6: Live Matches */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Live Matches
          </span>
          <div className="text-sm font-black flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                (db?.liveMatches ?? 0) > 0 ? "bg-emerald-500 animate-ping" : "bg-slate-600"
              }`}
            />
            <span className={(db?.liveMatches ?? 0) > 0 ? "text-emerald-400" : "text-white"}>
              {db?.liveMatches ?? 0}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Active in play</span>
        </div>

        {/* Metric 7: Completed Matches */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Completed Matches
          </span>
          <div className="text-sm font-black text-white">
            {db?.completedMatches ?? "—"}
          </div>
          <span className="text-[10px] text-slate-500 block">Final results verified</span>
        </div>

        {/* Metric 8: Ball-by-Ball Events */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
            Ball-by-Ball Events
          </span>
          <div className="text-sm font-black text-emerald-400 font-mono">
            {db?.ballByBallEvents?.toLocaleString() ?? "—"}
          </div>
          <span className="text-[10px] text-slate-500 block">match_commentary rows</span>
        </div>
      </div>

      {/* ── Feedback Message Toast ── */}
      {feedback && (
        <div
          className={`text-xs p-3 rounded-lg border flex items-start justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : feedback.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-sky-500/10 border-sky-500/30 text-sky-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === "success" ? "✓" : feedback.type === "error" ? "⚠️" : "ℹ"}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";

interface ProviderStatus {
  activeProvider: string;
  verification: {
    provider: string;
    configured: boolean;
    supported: boolean;
    teamsFound: number;
    matchesFound: number;
    message: string;
    testedAt: string;
  };
}

export function AdminLiveSyncCard() {
  const { session } = useAdminAuth();
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cricket/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const handleSync = async (providerOverride?: string) => {
    if (!session?.access_token) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/admin/cricket/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(providerOverride ? { provider: providerOverride } : {}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const s = data.summary;
        setSyncMessage(
          `Sync successful via ${s.provider}: ${s.matchesChecked} matches checked, ${s.matchesUpdated} updated. ${
            s.standingsRecalculated ? "Standings automatically updated!" : ""
          }`
        );
      } else {
        setSyncMessage(`Sync failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      setSyncMessage("Network error during sync.");
    } finally {
      setSyncing(false);
    }
  };

  const handleRecalculateStandings = async () => {
    if (!session?.access_token) return;
    setRecalculating(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/admin/cricket/standings/recalculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ seasonId: "season-3" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncMessage(
          `Points table recalculated successfully! Updated ${data.updatedTeams} teams. Completed league matches: ${data.totalCompletedMatches}.`
        );
      } else {
        setSyncMessage(`Recalculation error: ${data.error || "Failed"}`);
      }
    } catch {
      setSyncMessage("Network error during standings recalculation.");
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-semibold text-sm text-white">Live Cricket Data &amp; Ingestion</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {status?.activeProvider?.toUpperCase() || "PROVIDER ACTIVE"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSync()}
            disabled={syncing}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
          >
            {syncing ? "Syncing Live Scores…" : "⚡ Sync Live Data"}
          </button>
          <button
            type="button"
            onClick={handleRecalculateStandings}
            disabled={recalculating}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {recalculating ? "Calculating…" : "🔄 Recalculate Standings"}
          </button>
        </div>
      </div>

      {status?.verification ? (
        <div className="text-xs text-slate-300 space-y-2 bg-[#080e1a] p-3 rounded-md border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Coverage Status:</span>
            <span
              className={`font-semibold ${
                status.verification.supported ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {status.verification.supported
                ? "✓ Live Coverage Verified"
                : "⚠️ Pre-Tournament / Fallback Active"}
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">{status.verification.message}</p>
          <div className="flex gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Teams Found: <b className="text-white">{status.verification.teamsFound}</b></span>
            <span>Fixtures: <b className="text-white">{status.verification.matchesFound}</b></span>
            <span>Tested: <b className="text-slate-300">{new Date(status.verification.testedAt).toLocaleTimeString()}</b></span>
          </div>
        </div>
      ) : loading ? (
        <p className="text-xs text-slate-400">Testing cricket data provider connection…</p>
      ) : null}

      {syncMessage && (
        <div className="text-xs p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          {syncMessage}
        </div>
      )}
    </div>
  );
}

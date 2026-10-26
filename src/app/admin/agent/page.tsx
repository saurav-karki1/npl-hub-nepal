"use client";

/**
 * NPL Hub Nepal — Admin AI News Agent Management
 *
 * Dedicated control console for the automated news gathering agent:
 * - Start / stop automation toggle
 * - Check interval & external scheduler guidance (cron-job.org)
 * - Source list & toggles
 * - Immediate manual scan trigger
 * - Run logs, error monitoring & token metrics
 * - Direct link to drafted articles review
 */

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import type { AgentConfig, AgentRun, NewsSource } from "@/lib/agent/types";

export default function AdminAgentPage() {
  const { session } = useAdminAuth();
  const token = session?.access_token;

  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [runningScan, setRunningScan] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Refresh agent config and recent runs (for manual refresh / after scan)
  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [configRes, runsRes] = await Promise.all([
        fetch("/api/admin/agent/config", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/agent/runs", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (configRes.ok) {
        const configJson = await configRes.json();
        setConfig(configJson.config);
      }
      if (runsRes.ok) {
        const runsJson = await runsRes.json();
        setRuns(runsJson.runs ?? []);
      }
    } catch {
      setMessage({ text: "Failed to load agent settings.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load on mount
  useEffect(() => {
    let ignore = false;
    if (!token) return;

    async function loadInitial() {
      try {
        const [configRes, runsRes] = await Promise.all([
          fetch("/api/admin/agent/config", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/agent/runs", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (ignore) return;

        if (configRes.ok) {
          const configJson = await configRes.json();
          setConfig(configJson.config);
        }
        if (runsRes.ok) {
          const runsJson = await runsRes.json();
          setRuns(runsJson.runs ?? []);
        }
      } catch {
        if (!ignore) {
          setMessage({ text: "Failed to load agent settings.", type: "error" });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      ignore = true;
    };
  }, [token]);

  // Toggle agent master switch
  const handleToggleEnabled = async () => {
    if (!config || !token || saving) return;
    const newEnabled = !config.enabled;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/agent/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update status");
      }

      const updated = await res.json();
      setConfig(updated.config);
      setMessage({
        text: `Automation ${newEnabled ? "enabled" : "stopped"}.`,
        type: "success",
      });
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error saving configuration",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle an individual source
  const handleToggleSource = async (sourceId: string) => {
    if (!config || !token || saving) return;
    const updatedSources = (config.sources ?? []).map((s) =>
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    );

    setSaving(true);
    try {
      const res = await fetch("/api/admin/agent/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sources: updatedSources }),
      });

      if (!res.ok) throw new Error("Failed to update source");
      const updated = await res.json();
      setConfig(updated.config);
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error updating source",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Trigger manual scan
  const handleRunManualScan = async () => {
    if (!token || runningScan) return;
    setRunningScan(true);
    setMessage({
      text: "Scanning sources and generating drafts... This may take up to 30 seconds.",
      type: "info",
    });

    try {
      const res = await fetch("/api/admin/agent/trigger", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Scan failed.");
      }

      const summary = data.summary;
      setMessage({
        text: `Scan complete: ${summary?.itemsFound ?? 0} found, ${summary?.itemsSaved ?? 0} new draft(s) created.`,
        type: summary?.itemsSaved > 0 ? "success" : "info",
      });

      // Refresh data
      refreshData();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Manual scan encountered an error.",
        type: "error",
      });
    } finally {
      setRunningScan(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#c89f2a]/10 text-[#c89f2a] border border-[#c89f2a]/20 rounded">
              AI Automation
            </span>
            <span className="text-xs text-slate-500">Gemini 2.5 / 2.0 Flash</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
            NPL AI News Agent
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated monitoring, deduplication, and draft generation grounded strictly in official NPL news.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/news"
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition"
          >
            Review Drafts &rarr;
          </Link>
          <button
            onClick={handleRunManualScan}
            disabled={runningScan || saving}
            className="px-4 py-2 text-xs font-bold text-white bg-[#0a5c36] hover:bg-[#0d6e41] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-2"
          >
            {runningScan ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Scan Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {message && (
        <div
          className={`p-3.5 text-xs rounded-lg border ${
            message.type === "success"
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
              : message.type === "error"
              ? "bg-rose-950/40 text-rose-300 border-rose-800/50"
              : "bg-cyan-950/40 text-cyan-300 border-cyan-800/50"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Master Control Card */}
        <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Agent Status
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                config?.enabled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  config?.enabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
              {config?.enabled ? "Active" : "Stopped"}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            When enabled, incoming cron checks from your scheduler will scan sources and prepare drafts for review.
          </p>

          <button
            onClick={handleToggleEnabled}
            disabled={saving || loading}
            className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              config?.enabled
                ? "bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60"
                : "bg-emerald-900/40 hover:bg-emerald-800/40 text-emerald-300 border border-emerald-700/60"
            }`}
          >
            {config?.enabled ? "Stop Automation" : "Start Automation"}
          </button>
        </div>

        {/* Schedule & Limits */}
        <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Execution Schedule
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Interval</span>
              <span className="font-semibold text-slate-200">
                Every {config?.interval_hours ?? 2} hour(s)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Max Articles / Run</span>
              <span className="font-semibold text-slate-200">3 drafts</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Auto-Publish</span>
              <span className="font-semibold text-amber-400">Off (Drafts Only)</span>
            </div>
          </div>
          <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800/80 text-[11px] text-slate-400">
            <strong>Scheduler:</strong> Set up a free task on{" "}
            <a
              href="https://cron-job.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c89f2a] underline font-medium"
            >
              cron-job.org
            </a>{" "}
            calling <code className="text-slate-300">/api/agent/news-scan</code> with your <code className="text-slate-300">x-cron-secret</code> header.
          </div>
        </div>

        {/* Safeguards Summary */}
        <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Safety Guardrails
          </h2>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Zero-hallucination prompt constraint</li>
            <li>Source URL & title deduplication</li>
            <li>Overlap lock prevents concurrent execution</li>
            <li>All articles created with <code className="text-slate-300">status=&apos;draft&apos;</code></li>
            <li>No hard publishing without human sign-off</li>
          </ul>
        </div>
      </div>

      {/* Sources Configuration */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              News Sources ({config?.sources?.length ?? 0})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured feeds checked during each automation pass.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {(config?.sources ?? []).map((source: NewsSource) => (
            <div
              key={source.id}
              className="py-3 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  {source.name}
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                    {source.type}
                  </span>
                </div>
                {source.query && (
                  <div className="text-slate-400 text-[11px] font-mono">
                    Query: &quot;{source.query}&quot;
                  </div>
                )}
              </div>

              <button
                onClick={() => handleToggleSource(source.id)}
                disabled={saving}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  source.enabled
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                }`}
              >
                {source.enabled ? "Active" : "Disabled"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Runs Audit Log */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Scan History & Audit Logs
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Recent automated and manual scan runs.
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="text-xs text-[#c89f2a] hover:underline"
          >
            Refresh Logs
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
            No scan runs recorded yet. Use &quot;Run Scan Now&quot; above to initiate a test run.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Time</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Items Found</th>
                  <th className="py-2.5 px-3 font-semibold">Drafts Saved</th>
                  <th className="py-2.5 px-3 font-semibold">Tokens</th>
                  <th className="py-2.5 px-3 font-semibold">Errors / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-900/30 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(run.ran_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          run.status === "success"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                            : run.status === "partial"
                            ? "bg-amber-950/60 text-amber-400 border border-amber-800/60"
                            : "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{run.items_found}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      {run.items_saved}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {run.tokens_used ? run.tokens_used.toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                      {run.errors && run.errors.length > 0 ? (
                        <span className="text-rose-400" title={run.errors.join("; ")}>
                          {run.errors[0]}
                          {run.errors.length > 1 && ` (+${run.errors.length - 1} more)`}
                        </span>
                      ) : (
                        <span className="text-slate-600">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

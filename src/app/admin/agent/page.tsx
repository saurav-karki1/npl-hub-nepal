"use client";

/**
 * NPL Hub Nepal — Admin AI News Agent & Multi-Provider Editorial Control Room
 *
 * Dedicated control console for:
 * 1. Multi-Provider AI Editorial Pipeline:
 *    - Deep research, fact verification, 11 article types, zero-cost guarantee,
 *      7-stage sequential stepper, Fact Dossier inspection, and draft ingestion.
 * 2. Automated News Scanner:
 *    - Phase 10 RSS scanner, source configuration, and run history.
 */

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import type { AgentConfig, AgentRun, NewsSource } from "@/lib/agent/types";
import type {
  EditorialJob,
  EditorialArticleType,
  ArticleLength,
  FactDossier,
  FactClaim,
} from "@/lib/agent/editorial/types";

const ARTICLE_TYPES: Array<{ id: EditorialArticleType; label: string; desc: string }> = [
  { id: "breaking_news", label: "Breaking News", desc: "Urgent confirmed developments — official sources only" },
  { id: "tournament_news", label: "Tournament News", desc: "Schedule, standings, venues, qualification scenarios" },
  { id: "match_preview", label: "Match Preview", desc: "Head-to-head, pitch & weather, key tactical matchups" },
  { id: "match_report", label: "Match Report", desc: "Post-match scorecard highlights, partnerships, turning points" },
  { id: "match_analysis", label: "Match Analysis", desc: "Data breakdown: powerplay, death overs, spin vs pace" },
  { id: "team_news", label: "Team News", desc: "Franchise updates, training, selection decisions" },
  { id: "player_news", label: "Player News", desc: "Individual form, fitness, contract, or milestone news" },
  { id: "squad_analysis", label: "Squad Analysis", desc: "Roster composition, marquee signings, squad balance" },
  { id: "points_table_update", label: "Points Table Updates", desc: "Standings, NRR, playoff qualification scenarios" },
  { id: "official_announcement", label: "Official Announcements", desc: "CAN and franchise verified announcements" },
  { id: "feature_story", label: "Feature Stories", desc: "In-depth editorial narrative, broader NPL themes" },
];

const ARTICLE_LENGTHS: Array<{ id: ArticleLength; label: string; desc: string }> = [
  { id: "standard", label: "Standard Story (500 – 800 words)", desc: "Balanced match reports & team news" },
  { id: "short", label: "Short / News Flash (300 – 500 words)", desc: "Quick updates & official announcements" },
  { id: "comprehensive", label: "Comprehensive (800 – 1,200 words)", desc: "Deep tactical breakdown, previews & data" },
  { id: "longform", label: "In-Depth Feature (1,200 – 1,800+ words)", desc: "Extensive narrative & investigative stories" },
];

const STAGE_NAMES = [
  "Search",
  "Extract",
  "Fact Dossier",
  "Journalism",
  "SEO & Links",
  "Image Compositing",
  "Quality Gate",
];

export default function AdminAgentPage() {
  const { session } = useAdminAuth();
  const token = session?.access_token;

  // Active view tab
  const [activeTab, setActiveTab] = useState<"editorial" | "scanner">("editorial");

  // Scanner state
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [runningScan, setRunningScan] = useState<boolean>(false);

  // Editorial Pipeline state
  const [editorialJobs, setEditorialJobs] = useState<EditorialJob[]>([]);
  const [creatingJob, setCreatingJob] = useState<boolean>(false);
  const [steppingJobId, setSteppingJobId] = useState<string | null>(null);
  const [selectedJobForModal, setSelectedJobForModal] = useState<EditorialJob | null>(null);

  // New assignment form fields
  const [topicInput, setTopicInput] = useState<string>("");
  const [articleTypeInput, setArticleTypeInput] = useState<EditorialArticleType>("breaking_news");
  const [articleLengthInput, setArticleLengthInput] = useState<ArticleLength>("standard");
  const [targetKeywordInput, setTargetKeywordInput] = useState<string>("");

  // Status banner message
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Refresh scanner data
  const refreshScannerData = useCallback(async () => {
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

  // Refresh editorial jobs
  const refreshEditorialJobs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/agent/editorial/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setEditorialJobs(json.jobs ?? []);
      }
    } catch {
      console.warn("Failed to load editorial jobs");
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (!token) return;
    refreshScannerData();
    refreshEditorialJobs();
  }, [token, refreshScannerData, refreshEditorialJobs]);

  // Create editorial assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || creatingJob || !topicInput.trim()) return;

    setCreatingJob(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/agent/editorial/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: topicInput.trim(),
          articleType: articleTypeInput,
          targetKeyword: targetKeywordInput.trim() || undefined,
          targetLength: articleLengthInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to launch assignment.");
      }

      setMessage({
        text: `Editorial assignment launched! Job queued at Stage 1.`,
        type: "success",
      });
      setTopicInput("");
      setTargetKeywordInput("");
      refreshEditorialJobs();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Error creating assignment.",
        type: "error",
      });
    } finally {
      setCreatingJob(false);
    }
  };

  // Step a single stage manually
  const handleStepStage = async (jobId: string) => {
    if (!token || steppingJobId) return;
    setSteppingJobId(jobId);
    setMessage({
      text: "Executing next stage... Please wait (10-60s).",
      type: "info",
    });

    try {
      const res = await fetch(`/api/admin/agent/editorial/jobs/${jobId}/step`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Stage execution failed.");
      }

      setMessage({
        text: data.stepResult?.summary || "Stage completed successfully.",
        type: data.success ? "success" : "error",
      });

      refreshEditorialJobs();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to execute stage.",
        type: "error",
      });
    } finally {
      setSteppingJobId(null);
    }
  };

  // Auto-run all stages sequentially — no manual clicking required
  const handleRunAllStages = async (jobId: string) => {
    if (!token || steppingJobId) return;
    setSteppingJobId(jobId);
    setMessage({ text: "Auto-running all stages… This may take several minutes.", type: "info" });

    const MAX_STAGES = 7;
    let lastSummary = "";

    try {
      for (let attempt = 0; attempt < MAX_STAGES; attempt++) {
        // Fetch current job state
        const statusRes = await fetch(`/api/admin/agent/editorial/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          const currentJob: EditorialJob | undefined = (statusJson.jobs ?? []).find(
            (j: EditorialJob) => j.id === jobId
          );
          if (currentJob) {
            if (currentJob.status === "completed") {
              setMessage({ text: `✅ All 7 stages completed! Article draft is ready for review.`, type: "success" });
              refreshEditorialJobs();
              return;
            }
            if (currentJob.status.startsWith("paused") || currentJob.status === "failed") {
              setMessage({
                text: `⚠️ Pipeline paused at Stage ${currentJob.current_stage}: ${currentJob.pause_reason || currentJob.status}`,
                type: "error",
              });
              refreshEditorialJobs();
              return;
            }
          }
        }

        // Execute the next stage
        setMessage({
          text: `Running Stage ${attempt + 1} of ${MAX_STAGES}… Please wait.`,
          type: "info",
        });

        const res = await fetch(`/api/admin/agent/editorial/jobs/${jobId}/step`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        lastSummary = data.stepResult?.summary || "";

        if (!res.ok) {
          throw new Error(data.error || "Stage execution failed.");
        }

        // Check the returned job state
        const returnedJob: EditorialJob | undefined = data.job;
        if (returnedJob?.status === "completed") {
          setMessage({ text: `✅ All stages complete! Draft article is ready.`, type: "success" });
          refreshEditorialJobs();
          return;
        }
        if (returnedJob?.status?.startsWith("paused") || returnedJob?.status === "failed") {
          setMessage({
            text: `⚠️ Paused at Stage ${returnedJob.current_stage}: ${returnedJob.pause_reason || lastSummary}`,
            type: "error",
          });
          refreshEditorialJobs();
          return;
        }

        // Refresh UI between stages
        refreshEditorialJobs();

        // Brief pause between stages to avoid rate-limit collisions
        await new Promise((r) => setTimeout(r, 2500));
      }

      // If we exit the loop without completing
      setMessage({ text: lastSummary || "Auto-run loop finished — check job status.", type: "info" });
      refreshEditorialJobs();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Auto-run encountered an error.",
        type: "error",
      });
      refreshEditorialJobs();
    } finally {
      setSteppingJobId(null);
    }
  };

  // Retry or resume job
  const handleRetryJob = async (jobId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/agent/editorial/jobs/${jobId}/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetStage: 1 }),
      });

      if (res.ok) {
        setMessage({ text: "Job reset to Stage 1 (Pending).", type: "success" });
        refreshEditorialJobs();
      }
    } catch {
      setMessage({ text: "Failed to reset job.", type: "error" });
    }
  };

  // Permanently delete an editorial assignment
  const handleDeleteJob = async (jobId: string, topic: string) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete assignment:\n\n"${topic}"?\n\nThis will remove the assignment from the queue.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/agent/editorial/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete assignment.");
      }

      setMessage({ text: "Assignment deleted successfully.", type: "success" });
      refreshEditorialJobs();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to delete assignment.",
        type: "error",
      });
    }
  };

  // Scanner toggles
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

      if (!res.ok) throw new Error("Failed to update status");
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
      if (!res.ok) throw new Error(data.error || "Scan failed.");

      const summary = data.summary;
      setMessage({
        text: `Scan complete: ${summary?.itemsFound ?? 0} found, ${summary?.itemsSaved ?? 0} new draft(s) created.`,
        type: summary?.itemsSaved > 0 ? "success" : "info",
      });
      refreshScannerData();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#c89f2a]/10 text-[#c89f2a] border border-[#c89f2a]/20 rounded">
              AI Editorial Suite
            </span>
            <span className="text-xs text-slate-500 font-mono">Tavily • Groq • Gemini • Cloudflare / Sharp</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
            NPL AI News Agent & Control Room
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Multi-provider investigative cricket journalism, fact verification matrix, and automated RSS scanning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/news"
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition"
          >
            Review Drafts &rarr;
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("editorial")}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "editorial"
              ? "border-[#c89f2a] text-[#c89f2a]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          Multi-Provider Editorial Pipeline
          <span className="px-1.5 py-0.2 bg-[#c89f2a]/20 text-[#c89f2a] text-[10px] rounded font-mono">
            {editorialJobs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("scanner")}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "scanner"
              ? "border-[#c89f2a] text-[#c89f2a]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          Automated News Scanner (RSS)
        </button>
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

      {/* TAB 1: EDITORIAL PIPELINE CONTROL ROOM */}
      {activeTab === "editorial" && (
        <div className="space-y-8">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Zero-Cost Budget Guarantee
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  $0.00 Strict
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operates exclusively within free-tier allowances: Tavily (1k/mo), Groq (30 RPM), Gemini free quota, Cloudflare Flux / Sharp WebP. If any quota is reached, jobs safely pause without incurring any charges.
              </p>
            </div>

            <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Evidence Verification
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                  Matrix Active
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Primary sources (CAN, scorecards) require 1 source. Secondary media requires 2 independent corroborations. Conflicting rumors flagged; insufficient evidence pauses the job.
              </p>
            </div>

            <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Worker Scheduler
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  Cron Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Worker endpoint: <code className="text-slate-300 text-[11px]">/api/agent/editorial/worker</code> with <code className="text-slate-300 text-[11px]">x-cron-secret</code>. Claims 1 job and advances 1 stage per call.
              </p>
            </div>
          </div>

          {/* New Assignment Launcher Card */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Launch New Editorial Assignment
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch an investigative article assignment into the 7-stage multi-provider pipeline.
              </p>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Topic / News Headline Brief *
                  </label>
                  <input
                    type="text"
                    required
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. Janakpur Bolts announce marquee overseas signing for NPL 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#c89f2a]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Article Type (11 Specialists)
                  </label>
                  <select
                    value={articleTypeInput}
                    onChange={(e) => setArticleTypeInput(e.target.value as EditorialArticleType)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#c89f2a]"
                  >
                    {ARTICLE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Target SEO Keyword (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetKeywordInput}
                    onChange={(e) => setTargetKeywordInput(e.target.value)}
                    placeholder="e.g. Janakpur Bolts NPL squad 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#c89f2a]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Article Depth & Word Target
                  </label>
                  <select
                    value={articleLengthInput}
                    onChange={(e) => setArticleLengthInput(e.target.value as ArticleLength)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#c89f2a]"
                  >
                    {ARTICLE_LENGTHS.map((len) => (
                      <option key={len.id} value={len.id}>
                        {len.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={creatingJob || !topicInput.trim()}
                    className="w-full py-2.5 px-4 bg-[#c89f2a] hover:bg-[#b58f24] text-slate-950 font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creatingJob ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Launching...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Launch Assignment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Active & Recent Assignments Table */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Editorial Assignments ({editorialJobs.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track stages, inspect fact dossiers, step through execution, or review completed drafts.
                </p>
              </div>
              <button
                onClick={refreshEditorialJobs}
                className="text-xs text-[#c89f2a] hover:underline"
              >
                Refresh List
              </button>
            </div>

            {editorialJobs.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No editorial assignments active yet. Use the launcher above to start one.
              </div>
            ) : (
              <div className="space-y-4">
                {editorialJobs.map((job) => {
                  const typeObj = ARTICLE_TYPES.find((t) => t.id === job.article_type);
                  const isSteppingThis = steppingJobId === job.id;

                  return (
                    <div
                      key={job.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3"
                    >
                      {/* Top Bar: Topic & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-slate-800 text-[#c89f2a] font-bold text-[10px] rounded uppercase font-mono">
                              {typeObj?.label || job.article_type}
                            </span>
                            {(() => {
                              const targetLen = job.stage_data?.target_length || job.target_length || "standard";
                              const wordCount = job.stage_data?.draft?.word_count;
                              const lenBadgeText =
                                targetLen === "short"
                                  ? "300-500w"
                                  : targetLen === "comprehensive"
                                  ? "800-1200w"
                                  : targetLen === "longform"
                                  ? "1200-1800w"
                                  : "500-800w";

                              return (
                                <span className="px-2 py-0.5 bg-cyan-950/60 text-cyan-300 font-semibold text-[10px] rounded font-mono border border-cyan-800/40">
                                  {wordCount ? `${wordCount} words` : lenBadgeText}
                                </span>
                              );
                            })()}
                            <span className="text-xs text-slate-400 font-mono">
                              {new Date(job.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-100">
                            {job.topic}
                          </h3>
                        </div>

                        <div>
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              job.status === "completed"
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                                : job.status === "running"
                                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800 animate-pulse"
                                : job.status === "paused_quota_limit"
                                ? "bg-orange-950/80 text-orange-300 border border-orange-800"
                                : job.status === "paused_insufficient_evidence"
                                ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                                : job.status === "failed"
                                ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {job.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {/* 7-Stage Stepper Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">
                            Stage {job.current_stage} of 7:{" "}
                            <strong className="text-slate-200">
                              {STAGE_NAMES[job.current_stage - 1]}
                            </strong>
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {job.status === "completed"
                              ? "100% Ingested"
                              : `${Math.round((job.current_stage / 7) * 100)}%`}
                          </span>
                        </div>

                        <div className="grid grid-cols-7 gap-1 h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                          {STAGE_NAMES.map((name, idx) => {
                            const stageNum = idx + 1;
                            const isDone = job.status === "completed" || stageNum < job.current_stage;
                            const isCurrent = stageNum === job.current_stage && job.status !== "completed";

                            return (
                              <div
                                key={name}
                                title={`Stage ${stageNum}: ${name}`}
                                className={`h-full rounded-sm transition-all ${
                                  isDone
                                    ? "bg-emerald-500"
                                    : isCurrent
                                    ? job.status.startsWith("paused")
                                      ? "bg-amber-500"
                                      : job.status === "failed"
                                      ? "bg-rose-500"
                                      : "bg-cyan-400 animate-pulse"
                                    : "bg-slate-800/80"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Pause or Error Note if applicable */}
                      {job.pause_reason && (
                        <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded text-xs text-amber-300">
                          <strong>Pause Notice:</strong> {job.pause_reason}
                        </div>
                      )}
                      {job.status === "failed" && job.error_log && job.error_log.length > 0 && (
                        <div className="p-2.5 bg-rose-950/30 border border-rose-800/40 rounded text-xs text-rose-300">
                          <strong>Error:</strong> {job.error_log[job.error_log.length - 1]}
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedJobForModal(job)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Inspect Dossier & Data
                          </button>

                          {(job.status.startsWith("paused") || job.status === "failed") && (
                            <button
                              onClick={() => handleRetryJob(job.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-800/60 rounded transition"
                            >
                              Reset & Retry
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteJob(job.id, job.topic)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-400 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 rounded transition flex items-center gap-1"
                            title="Delete this assignment from queue"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {job.status !== "completed" && (
                            <>
                              {/* Auto-run all remaining stages with one click */}
                              <button
                                onClick={() => handleRunAllStages(job.id)}
                                disabled={!!steppingJobId}
                                className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-[#c89f2a] hover:bg-[#b58f24] disabled:opacity-50 rounded transition flex items-center gap-1.5"
                                title="Automatically runs all remaining stages without manual clicking"
                              >
                                {isSteppingThis ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Running Stage {job.current_stage}…
                                  </>
                                ) : (
                                  <span>▶ Run All Stages</span>
                                )}
                              </button>

                              {/* Manual single-step button (fine-grained control) */}
                              <button
                                onClick={() => handleStepStage(job.id)}
                                disabled={!!steppingJobId}
                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 rounded transition flex items-center gap-1.5"
                                title="Execute only the next single stage"
                              >
                                <span>Step {job.current_stage} →</span>
                              </button>
                            </>
                          )}

                          {job.status === "completed" && job.article_id && (
                            <Link
                              href="/admin/news"
                              className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition flex items-center gap-1.5"
                            >
                              <span>Open Draft in News Editor &rarr;</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED NEWS SCANNER (PHASE 10 RSS) */}
      {activeTab === "scanner" && (
        <div className="space-y-8">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <strong>Scheduler:</strong> Call <code className="text-slate-300">/api/agent/news-scan</code> with your <code className="text-slate-300">x-cron-secret</code> header.
              </div>
            </div>

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

          {/* Sources List */}
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
              <button
                onClick={handleRunManualScan}
                disabled={runningScan || saving}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0a5c36] hover:bg-[#0d6e41] disabled:opacity-50 rounded-lg transition"
              >
                {runningScan ? "Scanning..." : "Run Scan Now"}
              </button>
            </div>

            <div className="divide-y divide-slate-800">
              {(config?.sources ?? []).map((source: NewsSource) => (
                <div key={source.id} className="py-3 flex items-center justify-between text-xs">
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

          {/* Runs Table */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Scan History & Audit Logs
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Recent automated and manual scan runs.</p>
              </div>
              <button onClick={refreshScannerData} disabled={loading} className="text-xs text-[#c89f2a] hover:underline">
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
                        <td className="py-2.5 px-3 font-bold text-emerald-400">{run.items_saved}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          {run.tokens_used ? run.tokens_used.toLocaleString() : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                          {run.errors && run.errors.length > 0 ? (
                            <span className="text-rose-400" title={run.errors.join("; ")}>
                              {run.errors[0]}
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
      )}

      {/* INSPECTOR MODAL: Fact Dossier, Image Preview, & Telemetry */}
      {selectedJobForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1322] border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-slate-800 text-[#c89f2a] font-bold text-[10px] rounded uppercase font-mono">
                  {selectedJobForModal.article_type}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  {selectedJobForModal.topic}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {/* Telemetry Bar */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono">
                <div>
                  <span className="text-slate-500">Total Tokens:</span>{" "}
                  <strong className="text-slate-200">
                    {selectedJobForModal.telemetry?.total_tokens?.toLocaleString() || 0}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">API Cost:</span>{" "}
                  <strong className="text-emerald-400">$0.00 (Zero-Cost Policy)</strong>
                </div>
                <div>
                  <span className="text-slate-500">Provider Calls:</span>{" "}
                  <strong className="text-cyan-400">
                    {selectedJobForModal.telemetry?.calls?.length || 0}
                  </strong>
                </div>
              </div>

              {/* Stage 6 Image Preview */}
              {selectedJobForModal.stage_data?.image && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Composited Feature Image ({selectedJobForModal.stage_data.image.generator_used})
                  </h4>
                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedJobForModal.stage_data.image.image_url}
                      alt={selectedJobForModal.stage_data.image.image_alt}
                      className="w-full h-auto max-h-60 object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    {selectedJobForModal.stage_data.image.image_caption}
                  </p>
                </div>
              )}

              {/* Fact Dossier Section */}
              {selectedJobForModal.stage_data?.dossier ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Fact Dossier & Corroborated Evidence
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Primary Entity</span>
                      <strong className="text-slate-200">{selectedJobForModal.stage_data.dossier.primary_entity}</strong>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Related Franchises</span>
                      <strong className="text-slate-200">
                        {selectedJobForModal.stage_data.dossier.related_teams?.join(", ") || "None"}
                      </strong>
                    </div>
                  </div>

                  {/* Claims List */}
                  <div className="space-y-2">
                    <span className="text-slate-400 font-semibold block">
                      Extracted Claims ({selectedJobForModal.stage_data.dossier.claims?.length || 0}):
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(selectedJobForModal.stage_data.dossier.claims || []).map((claim: FactClaim) => (
                        <div
                          key={claim.id}
                          className={`p-2.5 rounded border ${
                            claim.verification_status === "verified"
                              ? "bg-emerald-950/20 border-emerald-900/40 text-slate-200"
                              : claim.verification_status === "conflicting"
                              ? "bg-rose-950/20 border-rose-900/40 text-rose-200"
                              : "bg-amber-950/20 border-amber-900/40 text-amber-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-bold uppercase tracking-wider">
                              [{claim.source_type}] {claim.verification_status}
                            </span>
                            <span className="font-mono text-slate-400">
                              Confidence: {Math.round(claim.confidence * 100)}%
                            </span>
                          </div>
                          <p>{claim.statement}</p>
                          {claim.conflict_details && (
                            <p className="text-[10px] text-rose-400 mt-1 font-mono">
                              Conflict: {claim.conflict_details}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conflicts Warning */}
                  {selectedJobForModal.stage_data.dossier.conflicts?.length > 0 && (
                    <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded space-y-1">
                      <span className="text-rose-400 font-bold block">
                        Factual Conflicts Detected:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-rose-300 text-[11px]">
                        {selectedJobForModal.stage_data.dossier.conflicts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded">
                  Fact dossier will appear once Stage 3 completes.
                </div>
              )}

              {/* Stage 4/5 Draft Preview */}
              {selectedJobForModal.stage_data?.draft && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Generated Article Preview
                  </h4>
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                    <h5 className="text-sm font-bold text-slate-100">
                      {selectedJobForModal.stage_data.draft.title}
                    </h5>
                    <p className="text-slate-400 italic">
                      {selectedJobForModal.stage_data.draft.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                      <span>Words: {selectedJobForModal.stage_data.draft.word_count}</span>
                      <span>Read Time: {selectedJobForModal.stage_data.draft.read_time}</span>
                      <span>Category: {selectedJobForModal.stage_data.draft.category}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";

interface LiveScoreData {
  live: boolean;
  rawScore?: string;
  teamCode?: string | null;
  score?: string | null;
  overs?: string | null;
  batter1?: string | null;
  batter2?: string | null;
  bowler?: string | null;
  fullTitle?: string;
  updatedAt?: string;
}

interface LiveScoreEmbedProps {
  matchSlug: string;
  espnMatchPath: string;
  matchStatus: string;
}

/**
 * Live Score component that:
 * 1. Automatically polls /api/matches/[slug]/live-score every 15s to display
 *    verified live figures (score, overs, active batters, bowler).
 * 2. Embeds the official ESPN Cricinfo interactive scorecard iframe below.
 */
export function LiveScoreEmbed({
  matchSlug,
  espnMatchPath,
  matchStatus,
}: LiveScoreEmbedProps) {
  const [data, setData] = useState<LiveScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveScore = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/matches/${matchSlug}/live-score`);
      if (res.ok) {
        const json = await res.json();
        if (json.live) {
          setData(json);
        }
      }
    } catch {
      // Keep previous data on transient network error
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [matchSlug]);

  useEffect(() => {
    setLoading(true);
    fetchLiveScore();
    // Auto-poll live score every 15 seconds during live match
    const interval = setInterval(fetchLiveScore, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveScore]);

  if (matchStatus !== "live") return null;

  const espnUrl = `https://www.espncricinfo.com${espnMatchPath}`;

  return (
    <section className="space-y-4">
      {/* ── Real-Time Native Live Score Card (shown when data is parsed) ── */}
      {data?.score && (
        <div className="rounded-xl border-2 border-[var(--color-brand)] bg-[#051c12] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--color-brand)]/30 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Live Match Centre
              </span>
              {isRefreshing && (
                <span className="text-[10px] text-[var(--color-brand)] animate-pulse">
                  Syncing…
                </span>
              )}
            </div>
            {data?.updatedAt && (
              <span className="text-[11px] text-emerald-300/80 font-mono">
                Updated: {data.updatedAt} NPT
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Score & Overs */}
            <div className="space-y-1">
              <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
                Current Innings
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                  {data.score}
                </span>
                {data.overs && (
                  <span className="text-base font-semibold text-emerald-300/90 font-mono">
                    ({data.overs} ov)
                  </span>
                )}
              </div>
              {data.teamCode && (
                <p className="text-xs font-medium text-slate-300">
                  Batting:{" "}
                  {data.teamCode === "SPR"
                    ? "Sudurpaschim Royals"
                    : data.teamCode === "LUL"
                    ? "Lumbini Lions"
                    : data.teamCode}
                </p>
              )}
            </div>

            {/* Current Batters */}
            <div className="space-y-1 bg-[#09261a] p-3 rounded-lg border border-[var(--color-brand)]/20">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                Batters at Crease
              </span>
              <p className="text-xs font-semibold text-white truncate">
                {data.batter1 || "—"}
              </p>
              <p className="text-xs text-slate-300 truncate">
                {data.batter2 || "—"}
              </p>
            </div>

            {/* Current Bowler */}
            <div className="space-y-1 bg-[#09261a] p-3 rounded-lg border border-[var(--color-brand)]/20">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block">
                Current Bowler
              </span>
              <p className="text-xs font-semibold text-white">
                {data.bowler || "Bowler in action"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Full Scorecard Header & Action ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[var(--color-ink)]">
            Full Ball-by-Ball Scorecard
          </h3>
          <span className="text-[10px] text-[var(--color-ink-muted)]">
            (Interactive Feed)
          </span>
        </div>
        <a
          href={espnUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-[#0c1a14] border border-emerald-500/30 px-3 py-1.5 rounded-lg"
        >
          Open on ESPN Cricinfo ↗
        </a>
      </div>

      {/* ── ESPN Cricinfo Iframe Feed ── */}
      <div className="relative w-full rounded-xl overflow-hidden border border-[var(--color-rule)] bg-[#0c121e] shadow-md">
        <iframe
          src={espnUrl}
          title="Live Cricket Score — ESPN Cricinfo"
          className="w-full"
          style={{ height: "650px", border: "none" }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      <p className="text-[10px] text-[var(--color-ink-muted)]/50 text-center">
        Live data verified via{" "}
        <a
          href="https://www.espncricinfo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[var(--color-ink-muted)]"
        >
          ESPN Cricinfo
        </a>{" "}
        · Polling every 15s · NPL Season 3 Official Match #1
      </p>
    </section>
  );
}

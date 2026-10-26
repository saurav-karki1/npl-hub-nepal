"use client";

import { useEffect, useState, useCallback } from "react";
import type { LiveScorePayload, LiveBatter, LiveBowler } from "@/app/api/matches/[slug]/live-score/route";

interface LiveScoreEmbedProps {
  matchSlug: string;
  espnMatchPath: string;
  matchStatus: string;
}

/**
 * Live In-Play Match Centre Component:
 * Displays active batters at the crease, active bowlers, and live match situation.
 * Only rendered when matchStatus === "live".
 */
export function LiveScoreEmbed({
  matchSlug,
  espnMatchPath,
  matchStatus,
}: LiveScoreEmbedProps) {
  const [data, setData] = useState<LiveScorePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveScore = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/matches/${matchSlug}/live-score`);
      if (res.ok) {
        const json: LiveScorePayload = await res.json();
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
    const interval = setInterval(fetchLiveScore, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveScore]);

  // Only show the active in-play widgets during a live match
  if (matchStatus !== "live") return null;

  const espnUrl = `https://www.espncricinfo.com${espnMatchPath}`;

  const hasBatters = Boolean(data?.batters && data.batters.length > 0);
  const hasBowlers = Boolean(data?.bowlers && data.bowlers.length > 0);

  if (!hasBatters && !hasBowlers && !data?.toss && !loading) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[var(--color-rule)] bg-[#051c12] p-4 sm:p-5 shadow-lg space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--color-brand)]/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              In-Play Statistics
            </span>
            {isRefreshing && (
              <span className="text-[10px] text-[var(--color-brand)] animate-pulse">
                Syncing…
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {data?.updatedAt && (
              <span className="text-[11px] text-emerald-300/80 font-mono">
                Updated: {data.updatedAt} NPT
              </span>
            )}
            <button
              type="button"
              onClick={fetchLiveScore}
              disabled={isRefreshing}
              className="text-xs px-2.5 py-1 rounded bg-[#0c121e] border border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:text-white transition-colors"
            >
              {isRefreshing ? "…" : "Refresh"}
            </button>
            <a
              href={espnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              ESPN Cricinfo ↗
            </a>
          </div>
        </div>

        {/* Toss & Match Note */}
        {data?.toss && (
          <div className="text-xs text-emerald-300 bg-[#09261a] border border-[var(--color-brand)]/30 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
            <span className="text-sm">🪙</span>
            <span>
              <strong>Match Note:</strong> {data.toss}
            </span>
          </div>
        )}

        {/* ── Active Batters Table ── */}
        {hasBatters && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Batters at the Crease
            </h4>
            <div className="overflow-x-auto rounded-lg border border-[var(--color-rule)] bg-[#0c121e]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-rule)] bg-black/40 text-[10px] font-bold uppercase text-[var(--color-ink-muted)]">
                    <th className="py-2.5 px-3">Batter</th>
                    <th className="py-2.5 px-3 text-center">R</th>
                    <th className="py-2.5 px-3 text-center">B</th>
                    <th className="py-2.5 px-3 text-center">4s</th>
                    <th className="py-2.5 px-3 text-center">6s</th>
                    <th className="py-2.5 px-3 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)] text-slate-200">
                  {data?.batters?.map((b: LiveBatter, idx: number) => (
                    <tr key={idx} className={b.isStriker ? "bg-emerald-950/20" : ""}>
                      <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                        {b.isStriker && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                            title="On strike"
                          />
                        )}
                        {b.name}
                        {b.isStriker && <span className="text-[10px] text-emerald-400 font-bold">*</span>}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-white">{b.runs}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{b.balls}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{b.fours}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{b.sixes}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-300">{b.strikeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Active Bowlers Table ── */}
        {hasBowlers && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Current Bowlers
            </h4>
            <div className="overflow-x-auto rounded-lg border border-[var(--color-rule)] bg-[#0c121e]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-rule)] bg-black/40 text-[10px] font-bold uppercase text-[var(--color-ink-muted)]">
                    <th className="py-2.5 px-3">Bowler</th>
                    <th className="py-2.5 px-3 text-center">O</th>
                    <th className="py-2.5 px-3 text-center">M</th>
                    <th className="py-2.5 px-3 text-center">R</th>
                    <th className="py-2.5 px-3 text-center">W</th>
                    <th className="py-2.5 px-3 text-right">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)] text-slate-200">
                  {data?.bowlers?.map((bw: LiveBowler, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-white">{bw.name}</td>
                      <td className="py-2 px-3 text-center text-slate-300 font-mono">{bw.overs}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{bw.maidens}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{bw.runs}</td>
                      <td className="py-2 px-3 text-center font-bold text-red-400">{bw.wickets}</td>
                      <td className="py-2 px-3 text-right font-mono text-sky-300">{bw.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

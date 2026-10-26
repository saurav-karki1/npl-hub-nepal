"use client";

import { useEffect, useState, useCallback } from "react";
import type { LiveScorePayload, LiveBatter, LiveBowler, LiveBallEvent } from "@/app/api/matches/[slug]/live-score/route";

interface LiveScoreEmbedProps {
  matchSlug: string;
  espnMatchPath: string;
  matchStatus: string;
}

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
    // Auto-poll live score every 15 seconds during live match
    const interval = setInterval(fetchLiveScore, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveScore]);

  if (matchStatus !== "live") return null;

  const espnUrl = `https://www.espncricinfo.com${espnMatchPath}`;

  const getEventBadgeClass = (event: string) => {
    const ev = event.toLowerCase();
    if (ev.includes("out") || ev.includes("w")) {
      return "bg-red-500/20 text-red-400 border-red-500/40";
    }
    if (ev.includes("6") || ev.includes("six")) {
      return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    }
    if (ev.includes("4") || ev.includes("four")) {
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    }
    return "bg-slate-700/50 text-slate-300 border-slate-600";
  };

  return (
    <section className="space-y-4">
      {/* ── Top Match Situation & Header ── */}
      <div className="rounded-xl border border-[var(--color-rule)] bg-[#051c12] p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--color-brand)]/30 pb-3">
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

        {/* Toss & Live Summary */}
        {data?.toss && (
          <div className="text-xs text-emerald-300 bg-[#09261a] border border-[var(--color-brand)]/30 rounded-lg px-3 py-2">
            <strong>Match Note:</strong> {data.toss}
          </div>
        )}

        {/* ── Active Batters Table ── */}
        {data?.batters && data.batters.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Batters at the Crease
            </h4>
            <div className="overflow-x-auto rounded-lg border border-[var(--color-rule)] bg-[#0c121e]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-rule)] bg-black/40 text-[10px] font-bold uppercase text-[var(--color-ink-muted)]">
                    <th className="py-2 px-3">Batter</th>
                    <th className="py-2 px-3 text-center">R</th>
                    <th className="py-2 px-3 text-center">B</th>
                    <th className="py-2 px-3 text-center">4s</th>
                    <th className="py-2 px-3 text-center">6s</th>
                    <th className="py-2 px-3 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)] text-slate-200">
                  {data.batters.map((b: LiveBatter, idx: number) => (
                    <tr key={idx} className={b.isStriker ? "bg-emerald-950/20" : ""}>
                      <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                        {b.isStriker && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="On strike" />
                        )}
                        {b.name}
                        {b.isStriker && <span className="text-[10px] text-emerald-400">*</span>}
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
        {data?.bowlers && data.bowlers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Current Bowlers
            </h4>
            <div className="overflow-x-auto rounded-lg border border-[var(--color-rule)] bg-[#0c121e]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-rule)] bg-black/40 text-[10px] font-bold uppercase text-[var(--color-ink-muted)]">
                    <th className="py-2 px-3">Bowler</th>
                    <th className="py-2 px-3 text-center">O</th>
                    <th className="py-2 px-3 text-center">M</th>
                    <th className="py-2 px-3 text-center">R</th>
                    <th className="py-2 px-3 text-center">W</th>
                    <th className="py-2 px-3 text-right">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)] text-slate-200">
                  {data.bowlers.map((bw: LiveBowler, idx: number) => (
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

        {/* ── Ball-by-Ball Live Timeline ── */}
        {data?.recentBalls && data.recentBalls.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[var(--color-rule)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Recent Deliveries & Ball-by-Ball Timeline
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {data.recentBalls.map((ball: LiveBallEvent, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-[#0c121e] border border-[var(--color-rule)] px-3 py-1.5 rounded-lg text-xs"
                >
                  <span className="font-mono text-[10px] text-slate-400 min-w-[28px]">
                    {ball.over}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getEventBadgeClass(
                      ball.dismissal || ball.event
                    )}`}
                  >
                    {ball.dismissal ? "WICKET" : ball.event || "•"}
                  </span>
                  <span className="text-slate-300 truncate">
                    {ball.dismissal || ball.text || ball.event}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && !data && (
          <div className="py-4 text-center text-xs text-emerald-300 animate-pulse">
            Connecting to official match feed…
          </div>
        )}
      </div>

      <p className="text-[10px] text-[var(--color-ink-muted)]/50 text-center">
        Live ball-by-ball feed synced with official match data · Updated automatically every 15s · Zero third-party cookies
      </p>
    </section>
  );
}

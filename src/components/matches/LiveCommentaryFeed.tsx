"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface CommentaryItem {
  id: string;
  matchId: string;
  eventId: string;
  overNumber: number;
  ballNumber: number;
  eventType: string;
  text: string;
  headline?: string;
  runs: number;
  isWicket: boolean;
  isBoundary: boolean;
  isSix: boolean;
  batterName?: string;
  bowlerName?: string;
  provider: string;
  createdAt: string;
}

interface LiveCommentaryFeedProps {
  matchSlug: string;
  matchId: string;
  isLive: boolean;
  matchStatus: string;
}

export function LiveCommentaryFeed({
  matchSlug,
  isLive,
  matchStatus,
}: LiveCommentaryFeedProps) {
  const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "wickets" | "boundaries">("all");
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const isUpcoming = matchStatus === "upcoming" || matchStatus === "tba";
  const isCompleted = matchStatus === "completed";

  const fetchCommentary = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchSlug}/commentary`);
      const data = await res.json();
      if (res.ok && data.commentary) {
        setCommentary(data.commentary);
        setLastFetched(
          new Date().toLocaleTimeString("en-US", {
            timeZone: "Asia/Kathmandu",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    } catch {
      // Keep previous commentary on network error
    } finally {
      setLoading(false);
    }
  }, [matchSlug, loading]);

  useEffect(() => {
    if (isUpcoming) return;
    fetchCommentary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchSlug]);

  // Live polling every 15s during live match
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchCommentary, 15000);
    return () => clearInterval(interval);
  }, [isLive, fetchCommentary]);

  const filteredList = useMemo(() => {
    if (filter === "wickets") {
      return commentary.filter((c) => c.isWicket || c.eventType === "wicket");
    }
    if (filter === "boundaries") {
      return commentary.filter((c) => c.isBoundary || c.isSix || c.runs >= 4);
    }
    return commentary;
  }, [commentary, filter]);

  const wicketCount = useMemo(
    () => commentary.filter((c) => c.isWicket || c.eventType === "wicket").length,
    [commentary]
  );
  const boundaryCount = useMemo(
    () => commentary.filter((c) => c.isBoundary || c.isSix || c.runs >= 4).length,
    [commentary]
  );

  // Pre-match state
  if (isUpcoming) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-black text-[var(--color-ink)]">
          Ball-by-Ball Match Commentary
        </h2>
        <div className="bg-[var(--color-canvas)] border border-dashed border-[var(--color-rule)] rounded-xl p-8 text-center space-y-2">
          <span className="text-2xl block">🎙️</span>
          <p className="text-sm font-bold text-[var(--color-ink)]">
            Live Commentary Scheduled
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] max-w-md mx-auto leading-relaxed">
            Ball-by-ball commentary, key milestones, boundary calls, and dismissal breakdowns will activate automatically as soon as the match starts at TU Cricket Ground.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* ── Section Header with Real-Time Meta & Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-rule)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[var(--color-ink)]">
              Ball-by-Ball Commentary
            </h2>
            {isLive && (
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Live Feed
              </span>
            )}
            {isCompleted && (
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800/60 border border-slate-700 px-2.5 py-0.5 rounded-full">
                Final Match Log
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Real-time delivery breakdown, key boundary moments, and wickets.
          </p>
        </div>

        {/* Action Controls & Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {lastFetched && (
            <span className="text-[10px] text-[var(--color-ink-muted)] font-mono">
              Synced {lastFetched} NPT
            </span>
          )}
          {isLive && (
            <button
              type="button"
              onClick={fetchCommentary}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-rule)] text-[var(--color-ink-secondary)] hover:text-white hover:border-[var(--color-brand)] transition-colors"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Tabs Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filter === "all"
              ? "bg-[var(--color-brand)] text-white shadow-sm"
              : "bg-[var(--color-surface)] border border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:text-white"
          }`}
        >
          All Deliveries ({commentary.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("wickets")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
            filter === "wickets"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-[var(--color-surface)] border border-[var(--color-rule)] text-red-400 hover:bg-red-950/30"
          }`}
        >
          <span>🚨 Wickets</span>
          <span className="bg-black/30 px-1.5 py-0.2 rounded-full text-[10px]">
            {wicketCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("boundaries")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
            filter === "boundaries"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-[var(--color-surface)] border border-[var(--color-rule)] text-amber-400 hover:bg-amber-950/30"
          }`}
        >
          <span>💥 Boundaries</span>
          <span className="bg-black/30 px-1.5 py-0.2 rounded-full text-[10px]">
            {boundaryCount}
          </span>
        </button>
      </div>

      {/* ── Commentary Cards Feed ── */}
      {filteredList.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-xl p-8 text-center space-y-1">
          <p className="text-sm font-bold text-[var(--color-ink)]">
            No deliveries found for this filter
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Try switching to &quot;All Deliveries&quot; to review the complete match timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredList.map((item) => {
            const isWicket = item.isWicket || item.eventType === "wicket";
            const isSix = item.isSix;
            const isFour = item.isBoundary && !isSix;

            return (
              <div
                key={item.id}
                className={`group relative rounded-xl border p-4 sm:p-4.5 transition-all duration-150 ${
                  isWicket
                    ? "bg-gradient-to-r from-red-950/40 via-red-900/10 to-[var(--color-surface)] border-red-500/40 shadow-sm"
                    : isSix
                    ? "bg-gradient-to-r from-purple-950/40 via-purple-900/10 to-[var(--color-surface)] border-purple-500/40 shadow-sm"
                    : isFour
                    ? "bg-gradient-to-r from-amber-950/40 via-amber-900/10 to-[var(--color-surface)] border-amber-500/40 shadow-sm"
                    : "bg-[var(--color-surface)] border-[var(--color-rule)] hover:border-slate-600"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Over Pill */}
                  <div className="shrink-0 flex flex-col items-center">
                    <span className="text-xs font-black font-mono tracking-tight px-2 py-1 rounded-md bg-black/60 border border-white/10 text-white min-w-[42px] text-center shadow-xs">
                      {item.overNumber.toFixed(1)}
                    </span>
                    {/* Badge */}
                    <span
                      className={`mt-1.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border text-center ${
                        isWicket
                          ? "bg-red-500 text-white border-red-600 shadow-xs"
                          : isSix
                          ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                          : isFour
                          ? "bg-amber-500 text-black border-amber-600 shadow-xs font-black"
                          : item.runs > 0
                          ? "bg-slate-800 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {isWicket ? "WICKET" : isSix ? "SIX!" : isFour ? "FOUR!" : `${item.runs} RUN`}
                    </span>
                  </div>

                  {/* Text & Player Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Editorial Headline */}
                    {item.headline ? (
                      <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                        {item.headline}
                      </h4>
                    ) : isWicket ? (
                      <h4 className="text-sm font-bold text-red-300 tracking-tight leading-snug">
                        WICKET!
                      </h4>
                    ) : null}

                    {/* Commentary Text */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                      {item.text}
                    </p>

                    {/* Match Entities (Bowler to Batter) */}
                    {(item.batterName || item.bowlerName) && (
                      <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px] text-slate-400 font-medium">
                        {item.bowlerName && (
                          <span className="flex items-center gap-1 bg-black/30 border border-white/5 px-2 py-0.5 rounded-xs">
                            <span className="text-[10px] text-sky-400 font-bold">Bowler:</span>
                            <span className="text-slate-300">{item.bowlerName}</span>
                          </span>
                        )}
                        {item.batterName && (
                          <span className="flex items-center gap-1 bg-black/30 border border-white/5 px-2 py-0.5 rounded-xs">
                            <span className="text-[10px] text-amber-400 font-bold">Batter:</span>
                            <span className="text-slate-300">{item.batterName}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Disclaimer */}
      <p className="text-[10px] text-[var(--color-ink-muted)]/60 text-center pt-2">
        Verified Ball-by-Ball Match Data · Siddhartha Bank NPL Season 3
      </p>
    </section>
  );
}

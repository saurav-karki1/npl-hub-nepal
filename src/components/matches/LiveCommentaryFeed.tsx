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

interface LiveScoreData {
  summary?: string;
  resultStatement?: string;
  scores?: {
    team1?: { runs: number; overs: string; wickets: number };
    team2?: { runs: number; overs: string; wickets: number };
  };
}

interface LiveCommentaryFeedProps {
  matchSlug: string;
  matchId: string;
  isLive: boolean;
  matchStatus: string;
}

function formatEasyCommentary(item: CommentaryItem): string {
  const isWicket = item.isWicket || item.eventType === "wicket";
  const isSix = item.isSix;
  const isFour = item.isBoundary && !isSix;
  const batter = item.batterName || "The batter";
  const bowler = item.bowlerName || "the bowler";

  // Wicket dismissal formatting
  if (isWicket) {
    const raw = item.text || "";
    const match = raw.match(/^([A-Za-z\s]+?)\s+([bc]\s+[A-Za-z\s]+)?\s*(\d+)\s*\((.*?)\)/);
    if (match) {
      const name = match[1].trim();
      const howOut = match[2]?.trim() || `bowled by ${bowler}`;
      const runs = match[3];
      const balls = match[4];
      return `OUT! ${name} is dismissed (${howOut}) for ${runs} runs off ${balls}. Crucial wicket for the bowling side!`;
    }
    return `WICKET! ${batter} is out! Key breakthrough taken by ${bowler}.`;
  }

  // Boundaries
  if (isSix) {
    return `SIX! Smashed high and handsome over the ropes by ${batter}! Huge maximum off ${bowler}.`;
  }

  if (isFour) {
    return `FOUR! Beautifully timed by ${batter}, finding the boundary rope with precision off ${bowler}.`;
  }

  // Runs
  if (item.runs === 1) {
    return `1 run. ${batter} works it into the gap off ${bowler} and comfortably rotates the strike.`;
  }

  if (item.runs === 2) {
    return `2 runs. Nicely placed into the outfield by ${batter}; good sharp running between the wickets.`;
  }

  if (item.runs === 3) {
    return `3 runs. Driven deep into the gap; excellent running allows three runs.`;
  }

  // Dot balls
  if (item.runs === 0 || item.text.toLowerCase().includes("no run")) {
    return `No run. Dot ball. Disciplined line and length by ${bowler}; defended cleanly by ${batter}.`;
  }

  return item.text;
}

export function LiveCommentaryFeed({
  matchSlug,
  isLive,
  matchStatus,
}: LiveCommentaryFeedProps) {
  const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
  const [liveMeta, setLiveMeta] = useState<LiveScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "wickets" | "boundaries">("all");
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const isUpcoming = matchStatus === "upcoming" || matchStatus === "tba";
  const isCompleted = matchStatus === "completed";

  const fetchCommentary = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 1. Fetch Commentary
      const res = await fetch(`/api/matches/${matchSlug}/commentary`);
      if (res.ok) {
        const data = await res.json();
        if (data.commentary) {
          setCommentary(data.commentary);
        }
      }

      // 2. Fetch Live Score & Equation
      const scoreRes = await fetch(`/api/matches/${matchSlug}/live-score`);
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setLiveMeta(scoreData);
      }

      setLastFetched(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Kathmandu",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      // Keep previous state on network error
    } finally {
      setLoading(false);
    }
  }, [matchSlug, loading]);

  useEffect(() => {
    if (isUpcoming) return;
    fetchCommentary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchSlug]);

  // Live polling every 15s during active match
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

  // Default to showing only 4-5 latest deliveries; user can toggle full log if desired
  const displayedList = useMemo(() => {
    if (showAll) return filteredList;
    return filteredList.slice(0, 5);
  }, [filteredList, showAll]);

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
            Ball-by-ball commentary, match equations, boundary alerts, and dismissal breakdowns will activate automatically as soon as the match starts at TU Cricket Ground.
          </p>
        </div>
      </section>
    );
  }

  // Derive human-friendly match equation banner
  const equationText = useMemo(() => {
    if (isCompleted) {
      return liveMeta?.resultStatement || "Match completed.";
    }
    if (liveMeta?.summary) {
      return liveMeta.summary;
    }
    return null;
  }, [isCompleted, liveMeta]);

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
              <span className="text-[11px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                Final Match Summary
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Latest delivery updates and match situation.
          </p>
        </div>

        {/* Action Controls */}
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
              {loading ? "…" : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* ── Match Situation & Equation Banner (Prominent & Clear) ── */}
      {equationText && (
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-[#062417] via-[#08301f] to-[#041b11] p-3.5 sm:p-4 shadow-md flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">
              {isCompleted ? "🏆" : "🏏"}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 block">
                {isCompleted ? "Match Result" : "Current Match Equation"}
              </span>
              <p className="text-sm font-black text-white tracking-tight">
                {equationText}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-300/80 bg-black/40 border border-emerald-500/20 px-2.5 py-1 rounded-md shrink-0">
            {isLive ? "● In Progress" : "Official Outcome"}
          </span>
        </div>
      )}

      {/* ── Filter Tabs Bar ── */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-2">
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

        {/* View Mode Indicator */}
        <div className="shrink-0 text-[11px] text-[var(--color-ink-muted)] font-medium">
          Showing {displayedList.length} of {filteredList.length}
        </div>
      </div>

      {/* ── Commentary Cards Feed (Compact 4-5 Items by Default) ── */}
      {filteredList.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-xl p-8 text-center space-y-1">
          <p className="text-sm font-bold text-[var(--color-ink)]">
            No deliveries found for this filter
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Switch back to &quot;All Deliveries&quot; to review the complete match timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedList.map((item, idx) => {
            const isWicket = item.isWicket || item.eventType === "wicket";
            const isSix = item.isSix;
            const isFour = item.isBoundary && !isSix;
            const isLatest = idx === 0;

            const easyText = formatEasyCommentary(item);

            return (
              <div
                key={item.id}
                className={`group relative rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${
                  isWicket
                    ? "bg-gradient-to-r from-red-950/50 via-red-900/15 to-[#0b101b] border-red-500/40 shadow-sm"
                    : isSix
                    ? "bg-gradient-to-r from-purple-950/50 via-purple-900/15 to-[#0b101b] border-purple-500/40 shadow-sm"
                    : isFour
                    ? "bg-gradient-to-r from-amber-950/50 via-amber-900/15 to-[#0b101b] border-amber-500/40 shadow-sm"
                    : isLatest
                    ? "bg-gradient-to-r from-emerald-950/40 via-emerald-900/10 to-[#0b101b] border-emerald-500/40 shadow-sm"
                    : "bg-[#0b101b] border-[var(--color-rule)] hover:border-slate-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Over Pill & Event Badge */}
                  <div className="shrink-0 flex flex-col items-center">
                    <span className="text-xs font-black font-mono tracking-tight px-2 py-1 rounded-md bg-black/70 border border-white/10 text-white min-w-[42px] text-center shadow-xs">
                      {item.overNumber.toFixed(1)}
                    </span>
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

                  {/* Easy Commentary Text & Tags */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Easy Friendly Text */}
                    <p className={`text-xs sm:text-sm leading-relaxed ${
                      isWicket
                        ? "text-red-200 font-semibold"
                        : isSix
                        ? "text-purple-200 font-semibold"
                        : isFour
                        ? "text-amber-200 font-semibold"
                        : "text-slate-200"
                    }`}>
                      {easyText}
                    </p>

                    {/* Match Entities (Bowler to Batter) */}
                    {(item.batterName || item.bowlerName) && (
                      <div className="pt-0.5 flex items-center gap-2 flex-wrap text-[11px] text-slate-400 font-medium">
                        {item.bowlerName && (
                          <span className="flex items-center gap-1 bg-black/40 border border-white/5 px-2 py-0.5 rounded">
                            <span className="text-[10px] text-sky-400 font-bold">Bowler:</span>
                            <span className="text-slate-300">{item.bowlerName}</span>
                          </span>
                        )}
                        {item.batterName && (
                          <span className="flex items-center gap-1 bg-black/40 border border-white/5 px-2 py-0.5 rounded">
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

      {/* ── Expand / Collapse Full Deliveries Button ── */}
      {filteredList.length > 5 && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-rule)] text-[var(--color-ink)] hover:text-white hover:border-[var(--color-brand)] transition-all shadow-xs"
          >
            {showAll ? (
              <>▲ Collapse to Latest 5 Deliveries</>
            ) : (
              <>▼ View All Deliveries ({filteredList.length} Total)</>
            )}
          </button>
        </div>
      )}

      {/* Footer Disclaimer */}
      <p className="text-[10px] text-[var(--color-ink-muted)]/60 text-center pt-1">
        Real-Time Delivery Feed · Siddhartha Bank NPL Season 3
      </p>
    </section>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

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

export function LiveCommentaryFeed({ matchSlug, matchId, isLive, matchStatus }: LiveCommentaryFeedProps) {
  const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchCommentary = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchSlug}/commentary`);
      const data = await res.json();
      if (res.ok && data.commentary) {
        setCommentary(data.commentary);
        setLastFetched(new Date().toLocaleTimeString());
      }
    } catch {
      setError("Could not load commentary.");
    } finally {
      setLoading(false);
    }
  }, [matchSlug, loading]);

  useEffect(() => {
    fetchCommentary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchSlug]);

  // Live polling every 25s when match is live
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchCommentary, 25000);
    return () => clearInterval(interval);
  }, [isLive, fetchCommentary]);

  const handleSimulate = async () => {
    setSimulating(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchSlug}/commentary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulateSample: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchCommentary();
      } else {
        setError(data.error || "Simulation failed.");
      }
    } catch {
      setError("Network error during simulation.");
    } finally {
      setSimulating(false);
    }
  };

  const getEventBadge = (item: CommentaryItem) => {
    if (item.isWicket) return { label: "WICKET", class: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (item.isSix) return { label: "SIX!", class: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    if (item.isBoundary) return { label: "FOUR!", class: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    if (item.eventType === "over_summary") return { label: "END OF OVER", class: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    if (item.eventType === "wicket") return { label: "WICKET", class: "bg-red-500/20 text-red-400 border-red-500/30" };
    return { label: `${item.runs}`, class: "bg-slate-700/50 text-slate-300 border-slate-700" };
  };

  const isUpcoming = matchStatus === "upcoming" || matchStatus === "tba";

  if (isUpcoming) {
    return (
      <div className="bg-[#0c121e] border border-[var(--color-rule)] rounded-lg p-6 text-center space-y-2">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Live Commentary</p>
        <p className="text-xs text-[var(--color-ink-muted)] max-w-md mx-auto">
          Ball-by-ball commentary powered by Gemini will appear here once the match begins.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[var(--color-ink)]">Live Commentary</h2>
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-[10px] text-[var(--color-ink-muted)]">Updated {lastFetched}</span>
          )}
          <button
            type="button"
            onClick={fetchCommentary}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded bg-[#0c121e] border border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand)] transition-colors"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={handleSimulate}
            disabled={simulating}
            className="text-xs px-2.5 py-1 rounded bg-[var(--color-brand-light)] border border-[var(--color-brand)]/30 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/20 transition-colors font-semibold"
          >
            {simulating ? "Generating…" : "✦ Test AI Commentary"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      {commentary.length === 0 && !loading ? (
        <div className="bg-[#0c121e] border border-[var(--color-rule)] rounded-lg p-6 text-center space-y-2">
          <p className="text-sm text-[var(--color-ink-muted)]">
            No commentary yet. Click &ldquo;Test AI Commentary&rdquo; to generate verified sample events.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {commentary.map((item) => {
            const badge = getEventBadge(item);
            return (
              <div
                key={item.id}
                className={`bg-[#0c121e] border rounded-lg px-4 py-3 flex gap-3 items-start ${
                  item.isWicket
                    ? "border-red-500/30 bg-red-950/20"
                    : item.isSix
                    ? "border-purple-500/20"
                    : item.isBoundary
                    ? "border-amber-500/20"
                    : "border-[var(--color-rule)]"
                }`}
              >
                {/* Over badge */}
                <div className="shrink-0 text-center min-w-[40px]">
                  <span className="text-[10px] font-mono text-[var(--color-ink-muted)] block">
                    {item.overNumber.toFixed(1)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      badge.class
                    } block mt-0.5`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Commentary text */}
                <div className="flex-1 space-y-0.5">
                  {item.headline && (
                    <p className="text-xs font-bold text-[var(--color-ink)]">{item.headline}</p>
                  )}
                  <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{item.text}</p>
                  {(item.batterName || item.bowlerName) && (
                    <p className="text-[10px] text-[var(--color-ink-muted)]/60 mt-1">
                      {item.batterName && <span>{item.batterName}</span>}
                      {item.batterName && item.bowlerName && <span> · </span>}
                      {item.bowlerName && <span>{item.bowlerName}</span>}
                    </p>
                  )}
                </div>

                {/* Provider badge */}
                <div className="shrink-0">
                  <span className="text-[9px] text-[var(--color-ink-muted)]/50 uppercase tracking-wide">
                    {item.provider === "gemini" ? "✦ Gemini" : item.provider}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-[var(--color-ink-muted)]/50 text-center pt-1">
        AI Commentary powered by Gemini · Generated strictly from verified match events · Zero fabricated data
      </p>
    </section>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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
  live?: boolean;
  isCompleted?: boolean;
  summary?: string;
  resultStatement?: string;
  battingTeam?: string;
  bowlingTeam?: string;
  target?: number;
  runsNeeded?: number;
  ballsLeft?: number;
  scores?: {
    team1?: { runs: number; overs: string; wickets: number };
    team2?: { runs: number; overs: string; wickets: number };
  };
  batters?: Array<{
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: string;
    isStriker: boolean;
  }>;
  bowlers?: Array<{
    name: string;
    overs: string;
    maidens: number;
    runs: number;
    wickets: number;
    economy: string;
  }>;
}

interface LiveCommentaryFeedProps {
  matchSlug: string;
  matchId: string;
  isLive: boolean;
  matchStatus: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template fallback — instant, no API needed
// ─────────────────────────────────────────────────────────────────────────────
function pickVariant(variants: string[], seed: number): string {
  return variants[seed % variants.length];
}

function templateCommentary(
  item: CommentaryItem,
  fallbackBatter?: string,
  fallbackBowler?: string
): string {
  const isWicket = item.isWicket || item.eventType === "wicket";
  const isSix = item.isSix;
  const isFour = item.isBoundary && !isSix;
  const batter = item.batterName || fallbackBatter || "The batter";
  const bowler = item.bowlerName || fallbackBowler || "the bowler";
  const textSeed = item.text
    ? item.text.charCodeAt(0) + (item.text.charCodeAt(4) || 0)
    : 0;
  const seed = Math.round(item.overNumber * 10) + textSeed;

  if (isWicket) {
    const raw = item.text || "";
    const m = raw.match(
      /([A-Za-z .'-]+?)\s+(b\s+[A-Za-z .'-]+|c\s+[A-Za-z .'-]+\s+b\s+[A-Za-z .'-]+|lbw b\s+[A-Za-z .'-]+|run out|st\s+[A-Za-z .'-]+)[\s]*(\d+)\s*\((\d+)\)/i
    );
    if (m) {
      return `OUT! ${m[1].trim()} is dismissed (${m[2].trim()}) for ${m[3]} runs off ${m[4]} balls. Big moment — the bowling side celebrate!`;
    }
    return pickVariant(
      [
        `WICKET! ${batter} is out! A big breakthrough for the bowling side. ${bowler} is thrilled!`,
        `OUT! ${batter} has to walk back. That is a massive wicket! ${bowler} deserves full credit.`,
        `${batter} is gone! A crucial dismissal — ${bowler} strikes at the perfect time.`,
      ],
      seed
    );
  }

  if (isSix)
    return pickVariant(
      [
        `SIX! ${batter} sends it sailing over the boundary! Massive hit off ${bowler} — the crowd goes wild!`,
        `MAXIMUM! ${batter} clears the ropes with ease. ${bowler} can only watch as that disappears into the stands!`,
        `SIX! What a shot by ${batter}! Picked up the length early and launched it out of the ground off ${bowler}.`,
        `BANG! Over the fence! ${batter} hits ${bowler} for a huge SIX — pure timing and power!`,
      ],
      seed
    );

  if (isFour)
    return pickVariant(
      [
        `FOUR! Cracking shot from ${batter}! Finds the gap and races to the boundary off ${bowler}.`,
        `BOUNDARY! ${batter} times it perfectly through the covers off ${bowler}. No chance for the fielders!`,
        `FOUR runs! ${batter} clips it off the pads and the ball speeds away to the fence.`,
        `That's a FOUR! ${batter} reads the line well and flicks it past the fielder — great shot!`,
      ],
      seed
    );

  if (item.runs === 3)
    return pickVariant(
      [
        `3 runs! ${batter} hits it into the deep and they run hard between the wickets. Good effort!`,
        `Three runs! Sharp running by both batters off ${bowler}.`,
      ],
      seed
    );

  if (item.runs === 2)
    return pickVariant(
      [
        `2 runs. ${batter} places it wide of mid-on and they scamper back for two. Quick between the wickets!`,
        `Two runs. ${batter} pushes it through the gap off ${bowler} — good running converts one into two.`,
        `A couple of runs. ${batter} and partner communicate well and pick up two off ${bowler}.`,
      ],
      seed
    );

  if (item.runs === 1)
    return pickVariant(
      [
        `1 run. ${batter} tucks it off the hip off ${bowler} and takes a single to rotate the strike.`,
        `Single taken. ${batter} nudges it into the leg side off ${bowler} — keeps the scoreboard ticking.`,
        `1 run. ${batter} pushes ${bowler} into the covers and calls for a quick single.`,
        `Just a run. ${batter} steers it to fine leg off ${bowler} — sensible cricket.`,
        `1 run. Nicely worked by ${batter} off the pads of ${bowler} — easy single taken.`,
      ],
      seed
    );

  if (item.runs === 0)
    return pickVariant(
      [
        `Dot ball! ${bowler} bowls a tight line and ${batter} can only block it back down the wicket.`,
        `No run. Good delivery by ${bowler} — ${batter} has no option but to defend solidly.`,
        `Dot! ${bowler} hits the right length and keeps ${batter} quiet. Pressure building.`,
        `Defended! ${batter} plays it safe against ${bowler}. No run — scoreboard pressure rising.`,
      ],
      seed
    );

  return item.text || `${item.runs} run(s) scored.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Determine if a ball qualifies for AI enhancement
// ─────────────────────────────────────────────────────────────────────────────
function getAIEventType(
  item: CommentaryItem
): "wicket" | "six" | "four" | "dot_pressure" | null {
  if (item.isWicket || item.eventType === "wicket") return "wicket";
  if (item.isSix) return "six";
  if (item.isBoundary && !item.isSix) return "four";
  return null; // normal balls use templates
}

function formatEasyCommentary(
  item: CommentaryItem,
  fallbackBatter?: string,
  fallbackBowler?: string
): string {
  return templateCommentary(item, fallbackBatter, fallbackBowler);
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

  // AI commentary cache: eventId → AI text (or null if failed/pending)
  const aiCache = useRef<Map<string, string | null>>(new Map());
  // Track which eventIds are currently being fetched to avoid duplicate calls
  const aiFetching = useRef<Set<string>>(new Set());
  // Re-render trigger when AI text arrives
  const [aiVersion, setAiVersion] = useState(0);

  const isUpcoming = matchStatus === "upcoming" || matchStatus === "tba";
  const isMatchCompleted = matchStatus === "completed" || Boolean(liveMeta?.isCompleted);
  const isMatchLive = (isLive || Boolean(liveMeta?.live)) && !isMatchCompleted;

  const fetchCommentary = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [commRes, scoreRes] = await Promise.all([
        fetch(`/api/matches/${matchSlug}/commentary`),
        fetch(`/api/matches/${matchSlug}/live-score`),
      ]);

      if (commRes.ok) {
        const data = await commRes.json();
        if (data.commentary) setCommentary(data.commentary);
      }
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
      // Keep previous state on error
    } finally {
      setLoading(false);
    }
  }, [matchSlug, loading]);

  useEffect(() => {
    if (isUpcoming) return;
    fetchCommentary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchSlug]);

  useEffect(() => {
    if (!isMatchLive) return;
    const interval = setInterval(fetchCommentary, 15000);
    return () => clearInterval(interval);
  }, [isMatchLive, fetchCommentary]);

  // ── AI enrichment: fire-and-forget for key moments ───────────────────────
  // Runs whenever commentary list changes; fetches AI text for wickets/6s/4s
  // that haven't been requested yet. Updates aiCache and triggers re-render.
  useEffect(() => {
    const toEnrich = commentary.filter((item) => {
      const eventType = getAIEventType(item);
      if (!eventType) return false;
      if (aiCache.current.has(item.id)) return false;
      if (aiFetching.current.has(item.id)) return false;
      return true;
    });

    if (toEnrich.length === 0) return;

    toEnrich.forEach((item) => {
      const eventType = getAIEventType(item)!;
      aiFetching.current.add(item.id);

      const scoreStr = liveMeta?.scores?.team2
        ? `${liveMeta.scores.team2.runs}/${liveMeta.scores.team2.wickets} (${liveMeta.scores.team2.overs} ov)`
        : liveMeta?.scores?.team1
        ? `${liveMeta.scores.team1.runs}/${liveMeta.scores.team1.wickets} (${liveMeta.scores.team1.overs} ov)`
        : "Unknown";

      fetch(`/api/matches/${matchSlug}/ai-commentary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          over: item.overNumber,
          runs: item.runs,
          batterName: item.batterName || "",
          bowlerName: item.bowlerName || "",
          rawText: item.text || "",
          matchContext: {
            battingTeam: liveMeta?.battingTeam || "Batting team",
            bowlingTeam: liveMeta?.bowlingTeam || "Bowling team",
            score: scoreStr,
            target: liveMeta?.target,
            runsNeeded: liveMeta?.runsNeeded,
            ballsLeft: liveMeta?.ballsLeft,
            matchStatus: isMatchLive ? "live" : "completed",
          },
        }),
      })
        .then((r) => r.json())
        .then((data: { commentary: string | null }) => {
          aiFetching.current.delete(item.id);
          aiCache.current.set(item.id, data.commentary ?? null);
          if (data.commentary) {
            // Trigger re-render to show AI text
            setAiVersion((v) => v + 1);
          }
        })
        .catch(() => {
          aiFetching.current.delete(item.id);
          aiCache.current.set(item.id, null); // mark as tried, use template
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentary, matchSlug]);

  // Live polling every 15s during active match
  useEffect(() => {
    if (!isMatchLive) return;
    const interval = setInterval(fetchCommentary, 15000);
    return () => clearInterval(interval);
  }, [isMatchLive, fetchCommentary]);

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

  // ── Build a crystal-clear, plain-English match situation sentence ──────────
  // Replaces the raw ESPN string like "Janakpur Bolts (NPL)66/5 (10.4 ov, Harmeet Singh 7*...)"
  // with something every fan instantly understands on first read.
  const equationBanner = useMemo(() => {
    if (isMatchCompleted) {
      const result = liveMeta?.resultStatement || "Match completed.";
      return { headline: "Final Result", body: result, icon: "🏆" };
    }

    const s1 = liveMeta?.scores?.team1;
    const s2 = liveMeta?.scores?.team2;
    const batters = liveMeta?.batters || [];
    const bowlers = liveMeta?.bowlers || [];
    const striker = batters.find((b) => b.isStriker) || batters[0];
    const nonStriker = batters.find((b) => !b.isStriker) || batters[1];
    const currentBowler = bowlers[0];

    // ── 2nd innings chase: give a clear "X runs needed in Y balls" message ──
    if (
      liveMeta?.runsNeeded !== undefined &&
      liveMeta?.ballsLeft !== undefined &&
      liveMeta.runsNeeded > 0
    ) {
      const team = liveMeta.battingTeam || "Batting team";
      const overs = liveMeta.scores?.team2
        ? liveMeta.scores.team2.overs
        : liveMeta.scores?.team1?.overs;
      const oversRemaining = overs
        ? (() => {
            const parts = overs.split(".");
            const completedOvers = parseInt(parts[0], 10);
            const ballsThisOver = parseInt(parts[1] || "0", 10);
            const ballsBowled = completedOvers * 6 + ballsThisOver;
            const ballsLeft = 120 - ballsBowled;
            const oversLeft = Math.floor(ballsLeft / 6);
            const extraBalls = ballsLeft % 6;
            return extraBalls > 0
              ? `${oversLeft}.${extraBalls} overs`
              : `${oversLeft} overs`;
          })()
        : `${Math.ceil(liveMeta.ballsLeft / 6)} overs`;

      const rr = liveMeta.ballsLeft > 0
        ? ((liveMeta.runsNeeded / liveMeta.ballsLeft) * 6).toFixed(2)
        : null;

      let paceNote = "";
      if (rr) {
        const rrNum = parseFloat(rr);
        if (rrNum <= 6) paceNote = "— well within reach";
        else if (rrNum <= 9) paceNote = "— a tough chase, needs boundaries";
        else if (rrNum <= 12) paceNote = "— very difficult from here";
        else paceNote = "— almost impossible now";
      }

      const strikerLine = striker
        ? `${striker.name} ${striker.runs}* (${striker.balls}b)`
        : "";
      const nonStrikerLine = nonStriker
        ? `${nonStriker.name} ${nonStriker.runs}* (${nonStriker.balls}b)`
        : "";
      const batsmenNote =
        strikerLine && nonStrikerLine
          ? `${strikerLine} & ${nonStrikerLine} at the crease`
          : strikerLine || "";

      const bowlerNote =
        currentBowler
          ? `${currentBowler.name} bowling (${currentBowler.overs} ov, ${currentBowler.wickets}W)`
          : "";

      const bodyLines = [
        `${team} need ${liveMeta.runsNeeded} more runs from ${liveMeta.ballsLeft} balls (${oversRemaining}) ${paceNote}`,
        rr ? `Required run rate: ${rr} per over` : "",
        batsmenNote,
        bowlerNote,
      ].filter(Boolean);

      return {
        headline: "Chase In Progress",
        body: bodyLines,
        icon: "🎯",
      };
    }

    // ── 1st innings or no target yet: show a clean scorecard summary ──
    const activeScore = s2 && (Number(s2.runs) > 0 || s2.overs !== "0.0") ? s2 : s1;
    const battingTeam = liveMeta?.battingTeam || "Batting team";
    const bowlingTeam = liveMeta?.bowlingTeam || "";

    if (activeScore) {
      const oversStr = activeScore.overs;
      const parts = oversStr.split(".");
      const completedOvers = parseInt(parts[0], 10);
      const ballsThisOver = parseInt(parts[1] || "0", 10);
      const ballsBowled = completedOvers * 6 + ballsThisOver;
      const ballsLeft = 120 - ballsBowled;
      const oversRemaining =
        ballsLeft > 0
          ? `${Math.floor(ballsLeft / 6)}.${ballsLeft % 6} overs remaining`
          : "Last over";

      const strikerLine = striker
        ? `${striker.name} ${striker.runs}* off ${striker.balls} balls`
        : "";
      const nonStrikerLine = nonStriker
        ? `${nonStriker.name} ${nonStriker.runs}* (${nonStriker.balls}b)`
        : "";
      const batsmenNote =
        strikerLine && nonStrikerLine
          ? `${strikerLine} · ${nonStrikerLine} at the other end`
          : strikerLine || "";

      const bowlerNote =
        currentBowler
          ? `${currentBowler.name} bowling — ${currentBowler.overs} ov, ${currentBowler.runs}R, ${currentBowler.wickets}W`
          : "";

      const bodyLines = [
        `${battingTeam}: ${activeScore.runs}/${activeScore.wickets} in ${activeScore.overs} overs`,
        oversRemaining,
        batsmenNote,
        bowlerNote,
        bowlingTeam ? `${bowlingTeam} bowling` : "",
      ].filter(Boolean);

      return {
        headline: "Live Match — 1st Innings",
        body: bodyLines,
        icon: "🏏",
      };
    }

    // Fallback: show the raw summary if we have nothing better
    if (liveMeta?.summary) {
      return { headline: "Match Update", body: [liveMeta.summary], icon: "🏏" };
    }

    return null;
  }, [isMatchCompleted, liveMeta]);

  return (
    <section className="space-y-4">
      {/* ── Section Header with Real-Time Meta & Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-rule)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[var(--color-ink)]">
              Ball-by-Ball Commentary
            </h2>
            {isMatchLive && (
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Live Feed
              </span>
            )}
            {isMatchCompleted && (
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
          {isMatchLive && (
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

      {/* ── Match Situation Banner — Plain English, fan-first ── */}
      {equationBanner && (
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-[#062417] via-[#08301f] to-[#041b11] p-4 sm:p-5 shadow-md">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="text-2xl shrink-0 mt-0.5">{equationBanner.icon}</span>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/90 block mb-1">
                  {equationBanner.headline}
                </span>
                {/* Render each line separately for maximum readability */}
                {Array.isArray(equationBanner.body) ? (
                  <div className="space-y-1">
                    {equationBanner.body.map((line, i) => (
                      <p
                        key={i}
                        className={
                          i === 0
                            ? "text-base font-black text-white leading-snug"
                            : i === 1
                            ? "text-xs font-semibold text-emerald-300"
                            : "text-xs text-slate-300 font-medium"
                        }
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-black text-white">{equationBanner.body}</p>
                )}
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-300/80 bg-black/40 border border-emerald-500/20 px-2.5 py-1 rounded-md shrink-0 self-start">
              {isMatchLive ? "● In Progress" : "Official Outcome"}
            </span>
          </div>
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
            const isKeyMoment = isWicket || isSix || isFour;

            // Fallback active batter and bowler from in-play stats if delivery lacks names
            const activeStriker =
              liveMeta?.batters?.find((b) => b.isStriker)?.name ||
              liveMeta?.batters?.[0]?.name;
            const activeBowler = liveMeta?.bowlers?.[0]?.name;
            const effectiveBatter = item.batterName || (isLatest ? activeStriker : undefined);
            const effectiveBowler = item.bowlerName || (isLatest ? activeBowler : undefined);

            // Hybrid: use AI text if ready, else template, show ✨ badge for AI
            const cachedAI = aiCache.current.get(item.id);
            const aiReady = isKeyMoment && cachedAI !== undefined;
            const aiPending = isKeyMoment && !aiReady;
            const displayText =
              isKeyMoment && cachedAI
                ? cachedAI
                : (item.text && item.text.trim().length > 0)
                ? item.text
                : templateCommentary(item, effectiveBatter, effectiveBowler);
            // suppress unused var warning — aiVersion used to force re-render
            void aiVersion;

            return (
              <div
                key={item.id}
                className={`group relative rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${
                  isWicket
                    ? "bg-[#1a0505] border-red-500/50"
                    : isSix
                    ? "bg-[#110a1c] border-purple-500/40"
                    : isFour
                    ? "bg-[#1a1000] border-amber-500/40"
                    : isLatest
                    ? "bg-[#071410] border-emerald-500/30"
                    : "bg-[#0b101b] border-[var(--color-rule)] hover:border-slate-600"
                }`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                  isWicket ? "bg-red-500" :
                  isSix ? "bg-purple-500" :
                  isFour ? "bg-amber-500" :
                  isLatest ? "bg-emerald-500" :
                  "bg-slate-700"
                }`} />
                <div className="flex items-start gap-3 pl-2">
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
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Commentary text: AI (with badge) or template */}
                    <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
                      isWicket
                        ? "text-white"
                        : isSix
                        ? "text-white"
                        : isFour
                        ? "text-white"
                        : isLatest
                        ? "text-slate-100"
                        : "text-slate-300"
                    }`}>
                      {displayText}
                    </p>

                    {/* AI / Pending badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isKeyMoment && cachedAI && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-violet-300 bg-violet-950/60 border border-violet-500/30 px-1.5 py-0.5 rounded">
                          ✨ AI Commentary
                        </span>
                      )}
                      {aiPending && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 italic">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
                          enhancing…
                        </span>
                      )}

                      {/* Bowler / Batter chips */}
                      {effectiveBowler && (
                        <span className="flex items-center gap-1 bg-black/40 border border-white/5 px-2 py-0.5 rounded text-[11px]">
                          <span className="text-[10px] text-sky-400 font-bold">Bowler:</span>
                          <span className="text-slate-300">{effectiveBowler}</span>
                        </span>
                      )}
                      {effectiveBatter && (
                        <span className="flex items-center gap-1 bg-black/40 border border-white/5 px-2 py-0.5 rounded text-[11px]">
                          <span className="text-[10px] text-amber-400 font-bold">Batter:</span>
                          <span className="text-slate-300">{effectiveBatter}</span>
                        </span>
                      )}
                    </div>
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

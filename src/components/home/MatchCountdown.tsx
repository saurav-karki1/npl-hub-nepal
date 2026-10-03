"use client";

/**
 * MatchCountdown
 *
 * Live countdown card displayed in the hero section of the homepage.
 * Powered by useSyncExternalStore for hydration safety and clean timer
 * updates without cascading renders.
 *
 * Timezone: all calculations are in Nepal Standard Time (UTC +05:45).
 * No dependency on the visitor's device timezone.
 */

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  resolveCountdownState,
  computeTimeRemaining,
  parseMatchStartMs,
  accessibleCountdownLabel,
  formatMatchDisplay,
  pad2,
  type CountdownState,
} from "@/lib/countdown";
import type { ScheduleMatch, MatchTeamInfo } from "@/lib/data/schedule-data";

// ---------------------------------------------------------------------------
// External Store for second-by-second wall-clock time
// ---------------------------------------------------------------------------

function subscribeToSeconds(callback: () => void) {
  const interval = setInterval(callback, 1000);
  const onVisible = () => {
    if (!document.hidden) callback();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

function useNowMs(): number | null {
  return useSyncExternalStore(
    subscribeToSeconds,
    () => Date.now(),
    () => null // null on server / pre-hydration
  );
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatchCountdownProps {
  /** All matches passed from a server component — no client-side fetching */
  matches: ScheduleMatch[];
  /** Resolved team info for every match keyed by match id */
  teamsByMatchId: Record<string, { team1: MatchTeamInfo; team2: MatchTeamInfo }>;
}

// ---------------------------------------------------------------------------
// Digit box (single unit cell)
// ---------------------------------------------------------------------------

interface DigitBoxProps {
  value: number;
  label: string;
  pulse?: boolean;
  reducedMotion: boolean;
}

function DigitBox({ value, label, pulse, reducedMotion }: DigitBoxProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[68px]">
      <div
        key={pulse ? value : undefined}
        className={cn(
          "w-full h-12 sm:h-14 rounded-[4px] flex items-center justify-center",
          "bg-black/40 border border-white/10 shadow-inner",
          "font-black text-xl sm:text-2xl text-white leading-none",
          "font-[var(--font-display)] [font-variant-numeric:tabular-nums]",
          !reducedMotion && pulse && "animate-tick"
        )}
        aria-hidden="true"
      >
        {pad2(value)}
      </div>
      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.06em] text-emerald-300/80">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton placeholder (server + pre-hydration)
// ---------------------------------------------------------------------------

function CountdownSkeleton() {
  return (
    <div
      className="rounded-[6px] border border-[#c89f2a]/25 bg-white/5 backdrop-blur-sm p-4 sm:p-5 shadow-lg w-full"
      aria-hidden="true"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 rounded-xs bg-white/10 animate-pulse" />
        <div className="h-5 w-24 rounded-full bg-white/10 animate-pulse" />
      </div>
      {/* Teams */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse shrink-0" />
          <div className="h-4 w-20 rounded-xs bg-white/10 animate-pulse" />
        </div>
        <div className="text-[10px] font-black text-white/30 px-2 py-0.5">VS</div>
        <div className="flex items-center gap-2.5 flex-1 justify-end flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse shrink-0" />
          <div className="h-4 w-20 rounded-xs bg-white/10 animate-pulse" />
        </div>
      </div>
      {/* Digit boxes */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4">
        {["DAYS", "HOURS", "MINUTES", "SECONDS"].map((l, idx) => (
          <div key={l} className="contents">
            {idx > 0 && <Colon />}
            <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[68px]">
              <div className="w-full h-12 sm:h-14 rounded-[4px] bg-white/10 animate-pulse" />
              <div className="h-2 w-10 rounded-xs bg-white/10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-3/4 rounded-xs bg-white/10 animate-pulse" />
          <div className="h-3 w-1/2 rounded-xs bg-white/10 animate-pulse" />
        </div>
        <div className="h-7 w-24 rounded-[4px] bg-white/10 animate-pulse shrink-0" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MatchCountdown({ matches, teamsByMatchId }: MatchCountdownProps) {
  const nowMs = useNowMs();
  const reducedMotion = useReducedMotion();

  // On server or before client mount, render identical skeleton
  if (nowMs === null) {
    return <CountdownSkeleton />;
  }

  const state = resolveCountdownState(matches, nowMs);

  return (
    <CountdownCard
      state={state}
      teamsByMatchId={teamsByMatchId}
      nowMs={nowMs}
      reducedMotion={reducedMotion}
    />
  );
}

// ---------------------------------------------------------------------------
// CountdownCard — renders the active state
// ---------------------------------------------------------------------------

interface CountdownCardProps {
  state: CountdownState;
  teamsByMatchId: Record<string, { team1: MatchTeamInfo; team2: MatchTeamInfo }>;
  nowMs: number;
  reducedMotion: boolean;
}

function CountdownCard({ state, teamsByMatchId, nowMs, reducedMotion }: CountdownCardProps) {
  const baseCardClass =
    "rounded-[6px] border border-[#c89f2a]/30 bg-[#052618]/70 backdrop-blur-md p-4 sm:p-5 shadow-xl shadow-black/40 w-full";

  // ---------------------------------------------------------------------------
  // 1. SEASON COMPLETE
  // ---------------------------------------------------------------------------
  if (state.type === "season_complete") {
    return (
      <div className={baseCardClass} role="region" aria-label="Season status">
        <div className="text-center py-4 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#c89f2a]/20 border border-[#c89f2a]/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#c89f2a]">
            <span className="w-2 h-2 rounded-full bg-[#c89f2a]" aria-hidden="true" />
            NPL Season 3
          </div>
          <h3 className="text-lg font-black text-white">Season 3 Complete</h3>
          <p className="text-xs text-emerald-200/80">
            Thank you for following Nepal Premier League Season 3.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/stats"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-[4px] bg-[#c89f2a] text-zinc-950 hover:bg-[#b58f23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c89f2a]"
            >
              Season Stats
            </Link>
            <Link
              href="/points-table"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-[4px] border border-white/25 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Points Table
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. LIVE NOW
  // ---------------------------------------------------------------------------
  if (state.type === "live") {
    const match = state.match;
    const teams = teamsByMatchId[match.id];
    const matchUrl = `/matches/${match.slug}`;
    return (
      <div className={baseCardClass} role="region" aria-label={`Match ${match.matchNumber} is live`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider",
              !reducedMotion && "animate-pulse"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full bg-red-500", !reducedMotion && "animate-pulse")} aria-hidden="true" />
            LIVE NOW
          </div>
          <MatchPill match={match} />
        </div>

        {/* Teams */}
        {teams && <TeamsDisplay team1={teams.team1} team2={teams.team2} />}

        {/* Footer */}
        <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-emerald-200/70 truncate max-w-[150px]">
            📍 {match.venue.split(",")[0]}
          </span>
          <Link
            href={matchUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-[4px] bg-red-600 text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 shadow-sm"
          >
            Follow Match →
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. TBA — date known, start time not announced
  // ---------------------------------------------------------------------------
  if (state.type === "tba") {
    const match = state.match;
    const teams = teamsByMatchId[match.id];
    const matchUrl = `/matches/${match.slug}`;
    return (
      <div className={baseCardClass} role="region" aria-label="Next match — time to be announced">
        <div className="flex items-center justify-between mb-4">
          <HeaderLabel label="Next Match" />
          <MatchPill match={match} />
        </div>
        {teams && <TeamsDisplay team1={teams.team1} team2={teams.team2} />}
        <div className="mt-4 py-3 text-center bg-black/20 rounded-[4px] border border-white/5">
          <span className="text-xs text-[#c89f2a] font-semibold">
            ⏳ Time to be announced
          </span>
          <p className="text-[11px] text-emerald-200/70 mt-1">
            {formatMatchDisplay(match)}
          </p>
        </div>
        <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-2 mt-4">
          <span className="text-[11px] text-emerald-200/70 truncate max-w-[150px]">
            📍 {match.venue.split(",")[0]}
          </span>
          <Link
            href={matchUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[4px] bg-[#c89f2a] text-zinc-950 hover:bg-[#b58f23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c89f2a]"
          >
            Match Details →
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. COUNTDOWN (kickoff | today | next)
  // ---------------------------------------------------------------------------
  const match = state.match;
  const teams = teamsByMatchId[match.id];
  const matchUrl = `/matches/${match.slug}`;
  const startMs = parseMatchStartMs(match.date, match.time)!;
  const tr = computeTimeRemaining(startMs, nowMs);
  const accessibleLabel = accessibleCountdownLabel(tr);

  const labelText =
    state.type === "kickoff"
      ? "NPL Season 3 Kicks Off In"
      : state.type === "today"
      ? "Today's NPL"
      : "Next Match";

  return (
    <div
      className={baseCardClass}
      role="region"
      aria-label={`${labelText} — ${accessibleLabel}`}
    >
      {/* Screen-reader summary */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {match.team1Id ? teams?.team1.name ?? "Team 1" : "Team 1"} vs{" "}
        {match.team2Id ? teams?.team2.name ?? "Team 2" : "Team 2"}.{" "}
        {accessibleLabel}
      </p>

      {/* Header row */}
      <div className="flex items-center justify-between mb-3.5">
        <HeaderLabel label={labelText} />
        <MatchPill match={match} />
      </div>

      {/* Teams face-off */}
      {teams && <TeamsDisplay team1={teams.team1} team2={teams.team2} />}

      {/* Countdown digits */}
      <div className="mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
        <DigitBox value={tr.days} label="DAYS" reducedMotion={reducedMotion} />
        <Colon />
        <DigitBox value={tr.hours} label="HOURS" reducedMotion={reducedMotion} />
        <Colon />
        <DigitBox value={tr.minutes} label="MINUTES" reducedMotion={reducedMotion} />
        <Colon />
        <DigitBox value={tr.seconds} label="SECONDS" pulse reducedMotion={reducedMotion} />
      </div>

      {/* Today's other scheduled matches */}
      {state.type === "today" && state.otherToday.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
            Also Scheduled Today
          </p>
          {state.otherToday.map((m) => {
            const t = teamsByMatchId[m.id];
            return (
              <Link
                key={m.id}
                href={`/matches/${m.slug}`}
                className="flex items-center justify-between text-[11px] text-emerald-100/80 hover:text-white transition-colors py-0.5 rounded-xs focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60"
              >
                <span className="truncate mr-2">
                  #{m.matchNumber} {t?.team1.shortName ?? "TBD"} vs {t?.team2.shortName ?? "TBD"}
                </span>
                <span className="text-[#c89f2a] font-semibold shrink-0">{m.time}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between gap-2">
        <div className="text-[11px] text-emerald-200/70 leading-snug min-w-0">
          <div className="font-medium text-white/90">{formatMatchDisplay(match)}</div>
          <div className="truncate text-emerald-200/60 mt-0.5">
            📍 {match.venue.split(",")[0]}
          </div>
        </div>
        <Link
          href={matchUrl}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-[4px] bg-[#c89f2a] text-zinc-950 hover:bg-[#b58f23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c89f2a] transition-colors"
        >
          Match Details
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HeaderLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-1.5 h-1.5 rounded-full bg-[#c89f2a] animate-pulse"
        aria-hidden="true"
      />
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c89f2a]">
        {label}
      </span>
    </div>
  );
}

function MatchPill({ match }: { match: ScheduleMatch }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[10px] font-bold text-white/80 uppercase tracking-wider whitespace-nowrap">
      Match #{match.matchNumber} · {match.stage}
    </span>
  );
}

function TeamsDisplay({ team1, team2 }: { team1: MatchTeamInfo; team2: MatchTeamInfo }) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      {/* Team 1 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TeamLogo
          name={team1.name}
          shortName={team1.shortName}
          initials={team1.initials}
          logoUrl={team1.logoUrl}
          crestBg={team1.crestBg}
          crestText={team1.crestText}
          size="lg"
          priority
        />
        <span className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
          {team1.name}
        </span>
      </div>

      {/* VS Badge */}
      <span className="text-[10px] font-black text-[#c89f2a] bg-black/40 px-2 py-0.5 rounded-xs uppercase tracking-wider border border-[#c89f2a]/30 shrink-0 select-none">
        VS
      </span>

      {/* Team 2 */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end flex-row-reverse text-right">
        <TeamLogo
          name={team2.name}
          shortName={team2.shortName}
          initials={team2.initials}
          logoUrl={team2.logoUrl}
          crestBg={team2.crestBg}
          crestText={team2.crestText}
          size="lg"
          priority
        />
        <span className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 text-right">
          {team2.name}
        </span>
      </div>
    </div>
  );
}

function Colon() {
  return (
    <span className="text-white/30 font-black text-sm sm:text-base self-start mt-3" aria-hidden="true">
      :
    </span>
  );
}

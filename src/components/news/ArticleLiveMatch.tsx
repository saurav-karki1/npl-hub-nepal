"use client";

/**
 * ArticleLiveMatch — Embedded Live Match Centre for News Articles
 *
 * Renders the existing MatchScoreboard, LiveScoreEmbed, and LiveCommentaryFeed
 * components directly inside a news article. Receives match data as a prop
 * from the server component (news/[slug]/page.tsx), which already fetches
 * getAllMatches(). No duplicate data-fetching, no separate API layer.
 *
 * Usage: Rendered when the article renderer detects a
 * [[LIVE_MATCH:<slug>]] token in a paragraph block.
 */

import Link from "next/link";
import { MatchScoreboard } from "@/components/matches/MatchScoreboard";
import { LiveScoreEmbed } from "@/components/matches/LiveScoreEmbed";
import { LiveCommentaryFeed } from "@/components/matches/LiveCommentaryFeed";
import type { ScheduleMatch } from "@/lib/repository/matches";

interface ArticleLiveMatchProps {
  match: ScheduleMatch;
}

export function ArticleLiveMatch({ match }: ArticleLiveMatchProps) {
  const matchPageUrl = `/matches/${match.slug}`;
  const isLive = match.status === "live";

  return (
    <section
      aria-labelledby="article-live-match-heading"
      className="my-6 space-y-5"
    >
      {/* ── Section heading ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-[var(--color-brand)] pb-3">
        <div className="min-w-0">
          <h2
            id="article-live-match-heading"
            className="text-xl sm:text-2xl font-black text-[var(--color-ink)] leading-tight"
          >
            Janakpur Bolts vs Kathmandu Gorkhas — Live Score
          </h2>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            NPL 2026 Match 5 · TU International Cricket Stadium, Kirtipur ·{" "}
            <span className="font-semibold text-[var(--color-brand)]">
              {match.time}
            </span>
          </p>
        </div>
        {isLive && (
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full uppercase tracking-wider shrink-0 mt-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Live
          </span>
        )}
      </div>

      {/* ── Live Scoreboard ─────────────────────────────────────────────── */}
      {/* Same component used on /matches/[slug] — polls every 15 s when live */}
      <MatchScoreboard match={match} />

      {/* ── In-Play Statistics (batters / bowlers) ───────────────────────── */}
      {/* Only visible during live matches — same gate as the dedicated page */}
      {match.espnMatchPath && (
        <LiveScoreEmbed
          matchSlug={match.slug}
          espnMatchPath={match.espnMatchPath}
          matchStatus={match.status}
        />
      )}

      {/* ── Live Commentary Feed ─────────────────────────────────────────── */}
      {/* Same component, same 15 s polling interval, same data source */}
      <LiveCommentaryFeed
        matchSlug={match.slug}
        matchId={match.id}
        isLive={isLive}
        matchStatus={match.status}
      />

      {/* ── Fallback Navigation Button ───────────────────────────────────── */}
      <div className="pt-3 border-t border-[var(--color-rule)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed max-w-prose">
            For the full match experience — expanded scorecard, complete
            ball-by-ball commentary, match details, and adjacent match
            navigation:
          </p>
          <Link
            href={matchPageUrl}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-mid)] text-white text-sm font-bold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          >
            Open Full Live Match Centre →
          </Link>
        </div>
      </div>
    </section>
  );
}

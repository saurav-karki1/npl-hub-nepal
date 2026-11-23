"use client";

import { useState } from "react";
import { Leaderboards, LeaderboardItem } from "@/lib/data/stats-types";

type LeaderboardCategory = { title: string; metric: string; items: LeaderboardItem[] };
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamMeta } from "@/lib/data/stats-registry";
import Link from "next/link";

/** How many rows are visible before "Show all" */
const DEFAULT_VISIBLE = 5;

interface PlayerLeaderboardsSectionProps {
  leaderboards: Leaderboards;
  seasonName: string;
}

// ─── Single collapsible leaderboard card ────────────────────────────────────
function LeaderboardCard({
  categoryKey,
  category,
  accentColor,
}: {
  categoryKey: string;
  category: LeaderboardCategory;
  accentColor: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const totalItems = category.items.length;
  const visibleItems = expanded
    ? category.items
    : category.items.slice(0, DEFAULT_VISIBLE);
  const hasMore = totalItems > DEFAULT_VISIBLE;

  return (
    <Card key={categoryKey} className="border-[var(--color-rule)]">
      {/* Card header */}
      <CardHeader className="bg-[var(--color-surface)] py-2 px-3.5 border-b border-[var(--color-rule)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
            {category.title}
          </span>
          <span className="text-[10px] font-semibold text-[var(--color-ink-muted)]">
            {category.metric}
          </span>
        </div>
      </CardHeader>

      {/* Rows */}
      <CardBody className="p-3 space-y-0">
        {visibleItems.map((item) => {
          const team = getTeamMeta(item.teamId);
          return (
            <div
              key={`${item.rank}-${item.playerName}`}
              className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-rule)] last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono font-bold text-[var(--color-ink-muted)] w-4 text-center shrink-0">
                  #{item.rank}
                </span>
                <TeamLogo
                  name={item.teamName}
                  logoUrl={team?.logoUrl}
                  crestBg={team?.crestBg}
                  crestText={team?.crestText}
                  size="xs"
                />
                <div className="min-w-0 truncate">
                  {item.playerSlug ? (
                    <Link
                      href={`/players/${item.playerSlug}`}
                      className="font-bold text-xs text-[var(--color-ink)] hover:text-[var(--color-brand)] truncate block transition-colors"
                    >
                      {item.playerName}
                    </Link>
                  ) : (
                    <span className="font-bold text-xs text-[var(--color-ink)] truncate block">
                      {item.playerName}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--color-ink-muted)] truncate block">
                    {item.secondaryDetail || item.teamName}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-sm font-black ${accentColor}`}>
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}

        {/* Show all / Show less button */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="w-full mt-2 pt-2 text-[11px] font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] border-t border-[var(--color-rule)] flex items-center justify-center gap-1 transition-colors"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <span>Show less</span>
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </>
            ) : (
              <>
                <span>See all {totalItems}</span>
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function PlayerLeaderboardsSection({
  leaderboards,
  seasonName,
}: PlayerLeaderboardsSectionProps) {
  const battingCategories = Object.entries(leaderboards.batting || {});
  const bowlingCategories = Object.entries(leaderboards.bowling || {});

  if (battingCategories.length === 0 && bowlingCategories.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="leaderboards-heading" className="space-y-6">
      <SectionHeader
        title={`${seasonName} — Verified Player Leaderboards`}
        description="Individual performance leaders across batting and bowling categories. Sourced strictly from verified tournament scorecards."
      />

      {/* Verification Notice */}
      <div className="rounded-[var(--radius-md)] border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <strong className="font-semibold block mb-0.5">
            Authoritative Source Notice:
          </strong>
          Final tournament leaderboards sourced from nplt20league.com,
          risingnepaldaily.com, statsnpl.com, and kantipurmax.com. Golden Cap
          (Most Wickets): Rijan Dhakal — 17 wickets. Platinum Cap (Most Runs):
          Yuvraaj Samra — 294 runs.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── BATTING LEADERS ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-rule)] pb-2">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand)]"
              aria-hidden="true"
            />
            <h3 className="text-base font-bold text-[var(--color-ink)]">
              Batting Leaders
            </h3>
            <span className="text-xs text-[var(--color-ink-muted)] ml-auto">
              {battingCategories.length} Verified{" "}
              {battingCategories.length === 1 ? "Category" : "Categories"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {battingCategories.map(([key, category]) => (
              <LeaderboardCard
                key={key}
                categoryKey={key}
                category={category}
                accentColor="text-[var(--color-brand)]"
              />
            ))}
          </div>
        </div>

        {/* ── BOWLING LEADERS ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-rule)] pb-2">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            <h3 className="text-base font-bold text-[var(--color-ink)]">
              Bowling Leaders
            </h3>
            <span className="text-xs text-[var(--color-ink-muted)] ml-auto">
              {bowlingCategories.length} Verified{" "}
              {bowlingCategories.length === 1 ? "Category" : "Categories"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {bowlingCategories.map(([key, category]) => (
              <LeaderboardCard
                key={key}
                categoryKey={key}
                category={category}
                accentColor="text-emerald-700"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

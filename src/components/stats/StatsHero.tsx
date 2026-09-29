"use client";

import { ConstellationBackground } from "@/components/ui/ConstellationBackground";
import { SeasonSelector } from "./SeasonSelector";
import type { SeasonId, SeasonStatsDataset, SeasonOption } from "@/lib/data/stats-types";
import type { TeamDetail } from "@/lib/data/teams-data";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface StatsHeroProps {
  currentDataset: SeasonStatsDataset;
  selectedSeasonId: SeasonId;
  onSelectSeason: (seasonId: SeasonId) => void;
  availableSeasons: SeasonOption[];
  allTeams?: TeamDetail[];
}

export function StatsHero({
  currentDataset,
  selectedSeasonId,
  onSelectSeason,
  availableSeasons,
  allTeams,
}: StatsHeroProps) {
  const { summary, status } = currentDataset;

  const findTeamMeta = (teamId?: string | null) => {
    if (!teamId || !allTeams) return undefined;
    const normalized = teamId.trim().toLowerCase().replace(/[\s_]+/g, "-");
    return allTeams.find(
      (t) =>
        t.id === normalized ||
        t.slug === normalized ||
        normalized.includes(t.slug) ||
        t.slug.includes(normalized)
    );
  };

  const championTeam = summary.champion ? findTeamMeta(summary.champion.teamId) : null;
  const runnerUpTeam = summary.runnerUp ? findTeamMeta(summary.runnerUp.teamId) : null;

  return (
    <header className="relative overflow-hidden rounded-[var(--radius-lg)] border border-emerald-950/60 shadow-sm">
      <ConstellationBackground className="bg-[#052618] text-white px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="relative z-10 space-y-6 max-w-4xl">
          {/* Eyebrow / Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-[var(--radius-sm)] text-[var(--color-accent)]">
              Statistics Hub
            </span>
            <span className="text-xs font-semibold text-emerald-200/90">
              {summary.shortName}
            </span>
            <span className="text-xs text-emerald-500" aria-hidden="true">
              ·
            </span>
            <span className="text-xs text-emerald-200/70">
              {summary.venueCity}
            </span>
          </div>

          {/* Main Title & Subtitle */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              NPL Statistics & Records
            </h1>
            <p className="mt-3 text-sm sm:text-base text-emerald-100/80 leading-relaxed max-w-3xl">
              Authoritative records, verified tournament statistics, player leaderboards,
              and points tables for the Nepal Premier League. Choose a season below to inspect verified tournament data.
            </p>
          </div>

          {/* Season Selector */}
          <div className="pt-2">
            <span className="text-xs uppercase font-bold text-emerald-300/80 block mb-2 tracking-wider">
              Select Tournament Season
            </span>
            <SeasonSelector
              selectedSeasonId={selectedSeasonId}
              onSelectSeason={onSelectSeason}
              availableSeasons={availableSeasons}
            />
          </div>

          {/* Season Status Ribbon */}
          {status === "completed" && summary.champion && (
            <div className="rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-950/40 p-3 sm:p-4 text-xs sm:text-sm text-emerald-100 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-sm bg-amber-400/10 border border-amber-400/20">
                  Defending Champions
                </span>
                <div className="flex items-center gap-2">
                  <TeamLogo
                    name={summary.champion.teamName}
                    logoUrl={championTeam?.logoUrl}
                    crestBg={championTeam?.crestBg}
                    crestText={championTeam?.crestText}
                    size="xs"
                  />
                  <span className="font-bold text-white">
                    {summary.champion.teamName}
                  </span>
                </div>
              </div>

              {summary.runnerUp && (
                <div className="flex items-center gap-2 text-emerald-200/80 pl-2 sm:border-l sm:border-emerald-800">
                  <span className="text-[11px] text-emerald-300/70">Runner-Up:</span>
                  <TeamLogo
                    name={summary.runnerUp.teamName}
                    logoUrl={runnerUpTeam?.logoUrl}
                    crestBg={runnerUpTeam?.crestBg}
                    crestText={runnerUpTeam?.crestText}
                    size="xs"
                  />
                  <span className="font-medium text-emerald-100">
                    {summary.runnerUp.teamName}
                  </span>
                </div>
              )}

              <div className="ml-auto text-emerald-300/70 text-xs">
                TU Cricket Ground · 17 Nov – 13 Dec 2025
              </div>
            </div>
          )}

          {status === "pre-tournament" && (
            <div className="rounded-[var(--radius-md)] border border-amber-400/30 bg-amber-950/40 p-3 sm:p-4 text-xs sm:text-sm text-amber-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold text-amber-300">
                  Tournament Commences 26 October 2026
                </span>
                <span className="text-amber-200/70 hidden sm:inline">
                  — 32 fixtures scheduled at TU Stadium
                </span>
              </div>
              <span className="text-xs text-amber-300/90 font-mono">
                Pre-Tournament State
              </span>
            </div>
          )}
        </div>
      </ConstellationBackground>
    </header>
  );
}

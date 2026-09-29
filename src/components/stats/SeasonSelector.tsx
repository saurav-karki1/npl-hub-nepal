"use client";

import type { SeasonId, SeasonOption } from "@/lib/data/stats-types";
import { cn } from "@/lib/utils";

interface SeasonSelectorProps {
  selectedSeasonId: SeasonId;
  onSelectSeason: (seasonId: SeasonId) => void;
  availableSeasons: SeasonOption[];
  className?: string;
}

export function SeasonSelector({
  selectedSeasonId,
  onSelectSeason,
  availableSeasons,
  className,
}: SeasonSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Select NPL Tournament Season"
      className={cn(
        "inline-flex flex-wrap p-1.5 rounded-[var(--radius-lg)] bg-black/30 backdrop-blur-xs border border-white/15 gap-1.5",
        className
      )}
    >
      {availableSeasons.map((season: SeasonOption) => {
        const isSelected = season.id === selectedSeasonId;
        return (
          <button
            key={season.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            aria-controls={`stats-panel-${season.id}`}
            id={`season-tab-${season.id}`}
            onClick={() => onSelectSeason(season.id)}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-[var(--radius-md)] text-xs sm:text-sm font-bold transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]",
              isSelected
                ? "bg-[var(--color-brand)] text-white shadow-sm ring-1 ring-white/20"
                : "text-emerald-100/70 hover:text-white hover:bg-white/10"
            )}
          >
            <span>{season.shortName}</span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                isSelected
                  ? season.status === "completed"
                    ? "bg-emerald-900/60 text-emerald-200 border-emerald-400/40"
                    : "bg-amber-900/60 text-amber-200 border-amber-400/40"
                  : "bg-white/5 text-white/60 border-white/10"
              )}
            >
              {season.badgeText}
            </span>
          </button>
        );
      })}
    </div>
  );
}

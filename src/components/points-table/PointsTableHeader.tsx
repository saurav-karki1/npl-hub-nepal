import Link from "next/link";
import { StandingsData } from "@/lib/data/standings";

interface PointsTableHeaderProps {
  standings: StandingsData;
}

export function PointsTableHeader({ standings }: PointsTableHeaderProps) {
  return (
    <header className="space-y-4 border-b border-[var(--color-rule)] pb-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-ink-muted)]">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-[var(--color-brand)] transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-[var(--color-ink-faint)]">/</li>
          <li className="font-semibold text-[var(--color-ink)]" aria-current="page">
            Points Table
          </li>
        </ol>
      </nav>

      {/* Eyebrow badge */}
      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-light)] border border-[var(--color-brand)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
        <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] animate-pulse" aria-hidden="true" />
        Season 3 Standings · 8 Franchises
      </div>

      {/* Main Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--color-ink)] leading-[1.15]">
          NPL Season 3 Points Table
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-secondary)] max-w-3xl leading-relaxed">
          Official team standings, net run rates (NRR), and playoff race for Nepal Premier League Season 3 (26 October – 21 November 2026). Top 4 franchises at the conclusion of 28 league fixtures advance to the playoffs.
        </p>
      </div>

      {/* Season 3 Tournament Information Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-4 text-center mt-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
            Teams Contesting
          </span>
          <span className="text-lg font-black text-[var(--color-ink)]">
            8 Franchises
          </span>
        </div>
        <div className="border-l border-[var(--color-rule)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
            League Matches
          </span>
          <span className="text-lg font-black text-[var(--color-brand)]">
            28 Matches
          </span>
        </div>
        <div className="border-l border-[var(--color-rule)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
            Playoff Cutoff
          </span>
          <span className="text-sm sm:text-base font-bold text-[var(--color-ink)]">
            Top 4 Advance
          </span>
        </div>
        <div className="border-l border-[var(--color-rule)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
            Tournament Status
          </span>
          <span className="text-xs sm:text-sm font-bold text-amber-700">
            {standings.hasResults ? "In Progress" : "Pre-Season (Starts 26 Oct)"}
          </span>
        </div>
      </div>
    </header>
  );
}

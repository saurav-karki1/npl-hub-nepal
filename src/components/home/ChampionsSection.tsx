import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeamBySlug } from "@/lib/data/teams-data";

/**
 * ChampionsSection — Post-Season 3 Championship Celebration
 *
 * Replaces the UpcomingMatchSection on the homepage now that NPL Season 3 is complete.
 * Showcases Sudurpaschim Royals as NPL Season 3 Champions 2026.
 */
export function ChampionsSection() {
  const champion = getTeamBySlug("sudurpaschim-royals");
  const runnerUp = getTeamBySlug("lumbini-lions");

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
            <span className="text-amber-500">🏆</span>
            NPL Season 3 — Final Result
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">
            Sudurpaschim Royals — NPL Season 3 Champions
          </h2>
        </div>
        <Link
          href="/matches/match-32-npl-season-3-final"
          className="hidden sm:inline-flex items-center text-sm font-semibold text-[var(--color-brand)] hover:underline"
        >
          Full Final Scorecard →
        </Link>
      </div>

      {/* Championship Card */}
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border-2 border-amber-300 bg-gradient-to-br from-[#fefbf0] via-white to-[#f9f6e8] shadow-sm">
        {/* Trophy banner stripe */}
        <div className="bg-gradient-to-r from-[#0a5c36] via-[#0d7244] to-[#0a5c36] px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🏆</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Nepal Premier League Season 3
              </p>
              <p className="text-sm font-bold text-white">
                21 November 2026 · TU International Cricket Stadium, Kirtipur
              </p>
            </div>
          </div>
          <span className="hidden sm:block text-xs font-semibold text-emerald-200 bg-emerald-900/50 rounded-full px-3 py-1 border border-emerald-700/40">
            Tournament Complete
          </span>
        </div>

        {/* Match scorecard */}
        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-6">
            {/* Runner-up: Lumbini Lions */}
            <div className="md:col-span-3 flex items-center gap-4">
              {runnerUp && (
                <TeamLogo
                  name={runnerUp.name}
                  shortName={runnerUp.shortName}
                  initials={runnerUp.initials}
                  logoUrl={runnerUp.logoUrl}
                  crestBg={runnerUp.crestBg}
                  crestText={runnerUp.crestText}
                  size="xl"
                  className="opacity-75"
                />
              )}
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-500 mb-1">
                  Runner-up
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-ink)]">
                  Lumbini Lions
                </h3>
                <p className="text-2xl font-black tabular-nums text-[var(--color-ink)] mt-1">
                  <span className="text-base font-semibold text-[var(--color-ink-muted)] mr-1">155/6</span>
                  <span className="text-sm font-medium text-[var(--color-ink-muted)]">(20.0 ov)</span>
                </p>
              </div>
            </div>

            {/* VS / Result */}
            <div className="md:col-span-1 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                <span className="text-lg" aria-hidden="true">🏆</span>
              </div>
              <span className="text-xs font-black text-[var(--color-ink-muted)] uppercase tracking-wider text-center">
                Won by<br />10 wkts
              </span>
            </div>

            {/* Champion: Sudurpaschim Royals */}
            <div className="md:col-span-3 flex items-center md:justify-end gap-4">
              <div className="order-2 md:order-1 text-left md:text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-semibold text-amber-700 mb-1">
                  🏆 Champions
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-ink)]">
                  Sudurpaschim Royals
                </h3>
                <p className="text-2xl font-black tabular-nums text-[var(--color-ink)] mt-1">
                  <span className="text-base font-semibold text-emerald-700 mr-1">158/0</span>
                  <span className="text-sm font-medium text-[var(--color-ink-muted)]">(13.3 ov)</span>
                </p>
              </div>
              {champion && (
                <TeamLogo
                  name={champion.name}
                  shortName={champion.shortName}
                  initials={champion.initials}
                  logoUrl={champion.logoUrl}
                  crestBg={champion.crestBg}
                  crestText={champion.crestText}
                  size="xl"
                  className="order-1 md:order-2"
                />
              )}
            </div>
          </div>

          {/* Awards row */}
          <div className="mt-6 pt-5 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-amber-50 rounded-lg border border-amber-200/60 px-4 py-3">
              <span className="text-xl mt-0.5" aria-hidden="true">⭐</span>
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Player of the Match (Final)
                </p>
                <p className="font-bold text-[var(--color-ink)]">George Munsey</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  125* off 54 balls (8×4, 12×6) · SR 231.48 · First century in an NPL Final
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-emerald-50 rounded-lg border border-emerald-200/60 px-4 py-3">
              <span className="text-xl mt-0.5" aria-hidden="true">🏅</span>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Player of the Tournament
                </p>
                <p className="font-bold text-[var(--color-ink)]">Dipendra Singh Airee</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Sudurpaschim Royals · Outstanding all-round season contribution
                </p>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/matches/match-32-npl-season-3-final"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[var(--color-brand)] text-white px-4 py-2 rounded-md hover:bg-[var(--color-brand-dark)] transition-colors"
            >
              Full Final Scorecard
            </Link>
            <Link
              href="/stats"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand)] border border-[var(--color-brand)] px-4 py-2 rounded-md hover:bg-emerald-50 transition-colors"
            >
              Season 3 Statistics
            </Link>
            <Link
              href="/points-table"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] px-3 py-2 hover:underline"
            >
              Final Points Table →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

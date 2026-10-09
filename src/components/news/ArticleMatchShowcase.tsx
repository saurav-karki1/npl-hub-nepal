"use client";

import { useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getMatchBySlug, resolveMatchTeams, SCHEDULE_FIXTURES } from "@/lib/data/schedule-data";
import { getTeamBySlug } from "@/lib/data/teams-data";

interface ArticleMatchShowcaseProps {
  matchSlug?: string;
  title?: string;
}

export function ArticleMatchShowcase({
  matchSlug = "match-1-lumbini-lions-vs-sudurpaschim-royals",
  title,
}: ArticleMatchShowcaseProps) {
  const [activeTab, setActiveTab] = useState<"factsheet" | "comparison" | "venue">("factsheet");

  // Retrieve match fixture (fallback to Match 1 if slug not found)
  const match = getMatchBySlug(matchSlug) || SCHEDULE_FIXTURES[0];
  const { team1, team2 } = resolveMatchTeams(match);

  const lumbiniDetails = getTeamBySlug("lumbini-lions");
  const sudurpaschimDetails = getTeamBySlug("sudurpaschim-royals");

  return (
    <div
      aria-label="Match 1 Showcase: Lumbini Lions vs Sudurpaschim Royals"
      className="my-8 rounded-[var(--radius-xl)] border border-[var(--color-rule)] bg-[var(--color-surface)] shadow-md overflow-hidden transition-all"
    >
      {/* ── Top Match Header Bar ────────────────────────────────────────────── */}
      <div className="bg-[var(--color-brand-dark)] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/40">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            Match #1 · Opening Clash
          </span>
          <span className="text-emerald-400/60 hidden sm:inline">·</span>
          <span className="text-white/80 hidden sm:inline">Siddhartha Bank NPL 2026</span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-100 bg-emerald-900/60 border border-emerald-700/50 px-2.5 py-0.5 rounded-full">
          26 Oct 2026 · 4:30 PM NPT
        </span>
      </div>

      {/* ── Headline Title (optional) ──────────────────────────────────────── */}
      {title && (
        <div className="px-5 pt-4 pb-1">
          <h3 className="text-base sm:text-lg font-black text-[var(--color-ink)] tracking-tight">
            {title}
          </h3>
        </div>
      )}

      {/* ── Match Face-Off Visual Cards ────────────────────────────────────── */}
      <div className="p-4 sm:p-6 bg-linear-to-b from-[var(--color-surface)] to-[var(--color-surface-sunken)]">
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 items-center">
          {/* Team 1: Lumbini Lions */}
          <Link
            href="/teams/lumbini-lions"
            className="sm:col-span-3 group p-3.5 sm:p-4 rounded-[var(--radius-lg)] bg-[var(--color-canvas)] border border-[var(--color-rule)] hover:border-[var(--color-brand)] hover:shadow-xs transition-all flex items-center sm:flex-row-reverse sm:text-right gap-3.5"
          >
            <div className="relative shrink-0 transition-transform group-hover:scale-105">
              <TeamLogo
                name={team1.name}
                shortName={team1.shortName}
                initials={team1.initials}
                logoUrl={team1.logoUrl}
                crestBg={team1.crestBg}
                crestText={team1.crestText}
                size="lg"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded mb-1">
                Defending Champions
              </span>
              <h4 className="font-extrabold text-base sm:text-lg text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors leading-tight truncate">
                {team1.name}
              </h4>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
                Capt: <strong className="text-[var(--color-ink)]">Rohit Paudel</strong>
              </p>
            </div>
          </Link>

          {/* VS Divider badge */}
          <div className="sm:col-span-1 flex flex-col items-center justify-center text-center py-1">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-xs tracking-wider uppercase bg-amber-500/10 text-amber-700 border border-amber-500/30 shadow-2xs">
              VS
            </span>
            <span className="text-[10px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider mt-1.5 hidden sm:block">
              TU Ground
            </span>
          </div>

          {/* Team 2: Sudurpaschim Royals */}
          <Link
            href="/teams/sudurpaschim-royals"
            className="sm:col-span-3 group p-3.5 sm:p-4 rounded-[var(--radius-lg)] bg-[var(--color-canvas)] border border-[var(--color-rule)] hover:border-[var(--color-brand)] hover:shadow-xs transition-all flex items-center gap-3.5"
          >
            <div className="relative shrink-0 transition-transform group-hover:scale-105">
              <TeamLogo
                name={team2.name}
                shortName={team2.shortName}
                initials={team2.initials}
                logoUrl={team2.logoUrl}
                crestBg={team2.crestBg}
                crestText={team2.crestText}
                size="lg"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded mb-1">
                2024 & 2025 Finalists
              </span>
              <h4 className="font-extrabold text-base sm:text-lg text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors leading-tight truncate">
                {team2.name}
              </h4>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
                Capt: <strong className="text-[var(--color-ink)]">Dipendra S. Airee</strong>
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Interactive Tabs ────────────────────────────────────────────────── */}
      <div className="border-t border-b border-[var(--color-rule)] bg-[var(--color-surface)] px-4 sm:px-6">
        <nav aria-label="Match Information Views" className="flex items-center gap-2 sm:gap-4 -mb-px overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("factsheet")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "factsheet"
                ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule)]"
            }`}
          >
            📋 Match Factsheet Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "comparison"
                ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule)]"
            }`}
          >
            ⚔️ Squad & Rivalry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("venue")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "venue"
                ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule)]"
            }`}
          >
            🏟️ Venue & Broadcast
          </button>
        </nav>
      </div>

      {/* ── Tab Content Panes ────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 bg-[var(--color-canvas)]">
        {/* Tab 1: Match Factsheet Table */}
        {activeTab === "factsheet" && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-[var(--color-rule)] bg-[var(--color-surface)]">
                    <th scope="row" className="py-2.5 px-4 font-bold text-[var(--color-ink)] w-1/3 sm:w-1/4">
                      Tournament Fixture
                    </th>
                    <td className="py-2.5 px-4 text-[var(--color-ink)] font-semibold">
                      Match #1 · Lumbini Lions vs Sudurpaschim Royals
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-rule)] hover:bg-[var(--color-surface-sunken)] transition-colors">
                    <th scope="row" className="py-2.5 px-4 font-bold text-[var(--color-ink)]">
                      Date (English / AD)
                    </th>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">
                      <strong className="text-[var(--color-brand)] font-bold">Monday, 26 October 2026</strong>
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-rule)] bg-[var(--color-surface)]">
                    <th scope="row" className="py-2.5 px-4 font-bold text-[var(--color-ink)]">
                      Nepali Date (BS)
                    </th>
                    <td className="py-2.5 px-4 text-[var(--color-ink)] font-medium">
                      सोमबार, ९ कार्तिक २०८३ (Kartik 9, 2083 BS)
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-rule)] hover:bg-[var(--color-surface-sunken)] transition-colors">
                    <th scope="row" className="py-2.5 px-4 font-bold text-[var(--color-ink)]">
                      Match Timing
                    </th>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">
                      <strong className="text-[var(--color-ink)] font-bold">4:30 PM NPT</strong> (Nepal Standard Time, UTC +5:45)
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-rule)] bg-[var(--color-surface)]">
                    <th scope="row" className="py-2.5 px-4 font-bold text-[var(--color-ink)]">
                      Host Stadium
                    </th>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">
                      TU International Cricket Stadium, Kirtipur, Kathmandu
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-rule)] hover:bg-[var(--color-surface-sunken)] transition-colors">
                    <th scope="row" className="py-2.5 px-4 font-bold text-[var(--color-ink)]">
                      Format & Overs
                    </th>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">
                      Twenty20 (20 Overs per side) · White Ball
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--color-surface-sunken)] transition-colors">
                    <th scope="row" className="py-2.5 px-4 font-bold text-[var(--color-ink)]">
                      Match Session
                    </th>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">
                      Single-header evening match under floodlights
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Squad & Rivalry Comparison */}
        {activeTab === "comparison" && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    <th className="py-2.5 px-4">Parameter</th>
                    <th className="py-2.5 px-4 text-blue-700">Lumbini Lions</th>
                    <th className="py-2.5 px-4 text-amber-700">Sudurpaschim Royals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)]">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-[var(--color-ink-muted)]">Captain</td>
                    <td className="py-2.5 px-4 font-bold text-[var(--color-ink)]">{lumbiniDetails?.captain ?? "Rohit Paudel"}</td>
                    <td className="py-2.5 px-4 font-bold text-[var(--color-ink)]">{sudurpaschimDetails?.captain ?? "Dipendra Singh Airee"}</td>
                  </tr>
                  <tr className="bg-[var(--color-surface)]">
                    <td className="py-2.5 px-4 font-semibold text-[var(--color-ink-muted)]">Head Coach</td>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">Nandan Phadnis</td>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">Jagat Tamata (Mentor: Brad Hodge)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-[var(--color-ink-muted)]">NPL Record</td>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">Defending Champions (Won Season 2 Final)</td>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">Two-time Finalists (Runners-up 2024 & 2025)</td>
                  </tr>
                  <tr className="bg-[var(--color-surface)]">
                    <td className="py-2.5 px-4 font-semibold text-[var(--color-ink-muted)]">Overseas Stars</td>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">Ruben Trumpelmann, Niroshan Dickwella, D&apos;Arcy Short</td>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">Saif Zaib, Scott Kuggeleijn, Brandon McMullen</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-[var(--color-ink-muted)]">Home Base</td>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">Lumbini Province (Rupandehi)</td>
                    <td className="py-2.5 px-4 text-[var(--color-ink)]">Sudurpaschim Province (Dhangadhi)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)] italic">
              ℹ️ Match 1 serves as an electric rematch of the Season 2 final where Lumbini Lions bowled Sudurpaschim Royals out for 85 and chased down the target in 14.2 overs.
            </p>
          </div>
        )}

        {/* Tab 3: Venue, Broadcast & Ticketing */}
        {activeTab === "venue" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block mb-1">
                🏟️ Match Venue
              </span>
              <p className="font-bold text-sm text-[var(--color-ink)]">
                TU Cricket Stadium
              </p>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
                Kirtipur, Kathmandu. Capacity: 15,000+. Matches played under floodlights.
              </p>
            </div>
            <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block mb-1">
                📺 Live Telecast
              </span>
              <p className="font-bold text-sm text-[var(--color-ink)]">
                Himalaya TV HD
              </p>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
                Worldwide digital OTT streaming available live on NetTV App & Web.
              </p>
            </div>
            <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block mb-1">
                🎟️ Match Tickets
              </span>
              <p className="font-bold text-sm text-[var(--color-ink)]">
                eSewa Digital
              </p>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
                Official digital ticketing partner for all NPL Season 3 fixtures.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Interactive Footer Action Buttons ───────────────────────────────── */}
      <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-rule)] flex flex-wrap items-center justify-between gap-2.5">
        <Link
          href={`/matches/${match.slug}`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-brand)] hover:bg-[var(--color-brand-mid)] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
        >
          <span>Match Scorecard & Details</span>
          <span aria-hidden="true">→</span>
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/teams/lumbini-lions"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] hover:bg-blue-50 text-blue-700 border border-[var(--color-rule)] transition-colors"
          >
            Lumbini Squad
          </Link>
          <Link
            href="/teams/sudurpaschim-royals"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] hover:bg-amber-50 text-amber-700 border border-[var(--color-rule)] transition-colors"
          >
            Sudurpaschim Squad
          </Link>
          <Link
            href="/schedule"
            className="text-xs font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[var(--color-brand)] hover:underline transition-colors"
          >
            All 32 Fixtures →
          </Link>
        </div>
      </div>
    </div>
  );
}

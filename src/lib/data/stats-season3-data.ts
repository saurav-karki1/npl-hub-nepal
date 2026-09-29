/**
 * NPL Season 3 (2026) — Pre-Tournament Statistics State
 *
 * TOURNAMENT STATUS: Pre-Tournament (Matches commence 26 October 2026)
 *
 * STRICT ACCURACY RULES:
 * - Season 3 has NOT started. Zero matches have been played.
 * - Absolutely NO fabricated or zero-padded statistics (0 runs, 0 wickets, fake ranks).
 * - Empty arrays indicate unplayed/pre-match status.
 * - This architecture is pre-wired to ingest live scores and tournament data
 *   once official scorecards conclude.
 */

import { SeasonStatsDataset } from "./stats-types";

export const SEASON_3_STATS_DATASET: SeasonStatsDataset = {
  seasonId: "season-3",
  seasonName: "NPL Season 3 (2026)",
  year: 2026,
  status: "pre-tournament",

  /* ── 1. Tournament Basics & Summary ── */
  summary: {
    seasonId: "season-3",
    name: "Nepal Premier League Season 3 (2026)",
    shortName: "NPL Season 3",
    edition: "3rd Edition (2026)",
    dates: "26 October – 21 November 2026",
    startDate: "2026-10-26",
    endDate: "2026-11-21",
    venue: "Tribhuvan University International Cricket Stadium",
    venueCity: "Kirtipur, Kathmandu",
    teamsCount: 8,
    totalMatches: 32,
    leagueMatches: 28,
    playoffMatches: 4,
    format: "8 franchise teams; single round robin (28 league matches) + 4 Page Playoff matches = 32 matches",
    pointsSystem: "2 points for a win, 1 point for a tie/no-result, 0 points for a loss",
    champion: null, // Pre-tournament: not yet decided
    runnerUp: null, // Pre-tournament: not yet decided
    confidence: "High",
    confidenceNote: "Tournament dates, host venue, and 32-fixture schedule officially confirmed by CAN.",
  },

  /* ── 2. Standings (Empty until matches are played) ── */
  standings: [],

  /* ── 3. Awards (Empty until tournament concludes) ── */
  awards: [],

  /* ── 4. Playoffs (Empty until league stage concludes) ── */
  playoffs: [],

  /* ── 5. League Matches (0 completed) ── */
  verifiedLeagueMatches: [],

  /* ── 6. Leaderboards (Empty pre-tournament) ── */
  leaderboards: {
    batting: {},
    bowling: {},
  },

  /* ── 7. Individual Player Stats (Empty pre-tournament) ── */
  playerStats: [],

  /* ── 8. Integrity & Pre-Tournament Notice ── */
  integrity: {
    verifiedLeagueMatchesCount: 0,
    totalLeagueMatchesCount: 28,
    authoritativePointsTableSource: "Official CAN Season 3 Fixture Schedule",
    integrityWarnings: [
      "Tournament has not commenced. Official fixtures begin on 26 October 2026.",
      "In accordance with NPL Hub Nepal accuracy standards, zero placeholder statistics, fake rankings, or speculative strike rates are displayed.",
    ],
    missingResearchItems: [
      "Season 3 scorecards and individual player performances will be ingested following ball-one of Match 1.",
    ],
    sources: [
      {
        name: "Cricket Association of Nepal (CAN)",
        description: "Official Tournament Schedule & Regulation Guidelines",
      },
      {
        name: "NPL Hub Nepal Official Schedule Registry",
        description: "Verified 32-match fixture calendar with Bikram Sambat dual-calendar dates",
        url: "/schedule",
      },
    ],
  },

  preTournamentNotice: {
    title: "Season 3 Statistics Are Not Available Yet",
    message:
      "Nepal Premier League Season 3 commences on 26 October 2026 (९ कार्तिक २०८३). Tournament statistics, batting leaders, top wicket-takers, and live standings will populate dynamically as official match scorecards conclude.",
    scheduledDates: "26 October – 21 November 2026",
    venue: "Tribhuvan University International Cricket Stadium, Kirtipur",
    features: [
      "Official Points Table & Net Run Rate (NRR) tracking across 28 group matches",
      "Real-time batting leaderboards (Most Runs, High Score, Average, Strike Rate, 4s & 6s)",
      "Real-time bowling leaderboards (Most Wickets, Best Figures, Economy, 4w/5w hauls)",
      "Player of the Match tracking across all 32 fixtures",
      "Playoff tournament brackets (Qualifier 1, Eliminator, Qualifier 2, Final)",
      "Per-player campaign profiles linked directly to official squad rosters",
    ],
  },
};

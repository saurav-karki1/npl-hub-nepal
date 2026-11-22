/**
 * NPL Season 4 (2027) — Future Season Dataset
 *
 * TOURNAMENT STATUS: Pre-Tournament / Upcoming
 * Official dates, schedule, and squads to be confirmed by the Cricket Association of Nepal (CAN).
 */

import { SeasonStatsDataset } from "./stats-types";

export const SEASON_4_STATS_DATASET: SeasonStatsDataset = {
  seasonId: "season-4",
  seasonName: "NPL Season 4 (2027)",
  year: 2027,
  status: "pre-tournament",

  summary: {
    seasonId: "season-4",
    name: "Nepal Premier League Season 4 (2027)",
    shortName: "NPL Season 4",
    edition: "4th Edition (2027)",
    dates: "Dates to be announced by CAN",
    startDate: "2027-10-01",
    endDate: "2027-11-30",
    venue: "Tribhuvan University International Cricket Stadium",
    venueCity: "Kirtipur, Kathmandu",
    teamsCount: 8,
    totalMatches: 32,
    leagueMatches: 28,
    playoffMatches: 4,
    format: "8 franchise teams; 28 league matches + 4 playoffs = 32 matches",
    pointsSystem: "2 points for a win, 1 point for a tie/no-result, 0 points for a loss",
    champion: null,
    runnerUp: null,
    confidence: "High",
    confidenceNote: "Official dates and franchise retention lists will be announced by the Cricket Association of Nepal (CAN).",
  },

  preTournamentNotice: {
    title: "NPL Season 4 (2027) — Coming Soon",
    message: "Nepal Premier League Season 4 is the next edition of Nepal's premier domestic T20 cricket tournament. Sudurpaschim Royals will enter as defending champions following their Season 3 title. Official tournament dates, auction details, squad lists, and fixtures will be published immediately upon announcement by CAN.",
    scheduledDates: "Late 2027 (Expected)",
    venue: "Tribhuvan University International Cricket Stadium, Kirtipur",
    features: [
      "Official CAN tournament schedule and fixtures",
      "Player retention, release, and auction updates",
      "8 franchise squads with player profiles",
      "Live scorecards and ball-by-ball coverage",
      "Real-time points table and net run rates",
      "Batting and bowling leaderboards and season awards",
    ],
  },

  standings: [],
  awards: [],
  playoffs: [],
  verifiedLeagueMatches: [],

  leaderboards: {
    batting: {
      mostRuns: { title: "Most Runs", metric: "runs", items: [] },
      highestScores: { title: "Highest Individual Scores", metric: "runs", items: [] },
      highestAverages: { title: "Highest Batting Average", metric: "avg", items: [] },
      highestStrikeRates: { title: "Highest Strike Rate", metric: "sr", items: [] },
      mostFours: { title: "Most Fours", metric: "fours", items: [] },
      mostSixes: { title: "Most Sixes", metric: "sixes", items: [] },
      mostCenturies: { title: "Most Centuries (100s)", metric: "hundreds", items: [] },
      mostFifties: { title: "Most Half-Centuries (50s)", metric: "fifties", items: [] },
    },
    bowling: {
      mostWickets: { title: "Most Wickets", metric: "wickets", items: [] },
      bestBowlingFigures: { title: "Best Bowling Figures", metric: "figures", items: [] },
      bestBowlingAverages: { title: "Best Bowling Average", metric: "avg", items: [] },
      bestBowlingEconomy: { title: "Best Economy Rate", metric: "econ", items: [] },
      bestBowlingStrikeRates: { title: "Best Bowling Strike Rate", metric: "sr", items: [] },
    },
  },

  playerStats: [],

  integrity: {
    verifiedLeagueMatchesCount: 0,
    totalLeagueMatchesCount: 28,
    authoritativePointsTableSource: "Cricket Association of Nepal (CAN)",
    integrityWarnings: [],
    missingResearchItems: [],
    sources: [
      {
        name: "Cricket Association of Nepal (CAN)",
        url: "https://can.org.np",
        description: "Governing body for cricket in Nepal",
      },
    ],
  },
};

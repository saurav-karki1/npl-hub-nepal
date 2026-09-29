/**
 * NPL Season 2 (2025) — Verified Statistics Dataset
 *
 * CANONICAL SOURCE: NPL_Season2_Verified_Dataset.pdf
 * Tournament: Siddhartha Bank Nepal Premier League 2025 (NPL Season 2)
 * Dates: 17 November – 13 December 2025
 * Venue: Tribhuvan University International Cricket Ground, Kirtipur (all matches)
 *
 * STRICT INTEGRITY RULES (from PDF Section 9 & 10):
 * - All figures are source-backed. Anything marked NOT FOUND remains null.
 * - Authoritative record for P/W/L/Pts/NRR is the final ESPN table (Section 4).
 *   Do NOT recompute this table from the 7 verified league scorecards.
 * - Missing values are NOT zero; they are preserved as null.
 * - Player of the Tournament and Best Nepali Player are kept as separate categories.
 * - Qualifier 2 scorecard was NOT FOUND and is not invented.
 */

import { SeasonStatsDataset } from "./stats-types";

export const SEASON_2_STATS_DATASET: SeasonStatsDataset = {
  seasonId: "season-2",
  seasonName: "NPL Season 2 (2025)",
  year: 2025,
  status: "completed",

  /* ── 1. Tournament Basics & Summary ── */
  summary: {
    seasonId: "season-2",
    name: "Siddhartha Bank Nepal Premier League 2025",
    shortName: "NPL Season 2",
    edition: "2nd Edition (2025)",
    dates: "17 November – 13 December 2025",
    startDate: "2025-11-17",
    endDate: "2025-12-13",
    venue: "Tribhuvan University International Cricket Ground",
    venueCity: "Kirtipur, Kathmandu",
    teamsCount: 8,
    totalMatches: 32,
    leagueMatches: 28,
    playoffMatches: 4,
    format: "8 teams; single round robin (7 league matches each, 28 total) + 4 playoffs = 32 matches",
    pointsSystem: "2 for a win, 0 for a loss; no ties or no-results in the final table",
    champion: {
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
    },
    runnerUp: {
      teamId: "sudurpaschim-royals",
      teamName: "Sudurpaschim Royals",
    },
    confidence: "High",
    confidenceNote: "High confidence for dates, venue, competition format, champion, and runner-up.",
  },

  /* ── 2. Authoritative Final League Points Table (Section 4 of PDF) ── */
  standings: [
    {
      position: 1,
      teamId: "sudurpaschim-royals",
      teamName: "Sudurpaschim Royals",
      played: 7,
      won: 6,
      lost: 1,
      tied: 0,
      noResult: 0,
      points: 12,
      netRunRate: 0.832,
      formattedNRR: "+0.832",
      qualification: "Qualifier 1",
    },
    {
      position: 2,
      teamId: "biratnagar-kings",
      teamName: "Biratnagar Kings",
      played: 7,
      won: 5,
      lost: 2,
      tied: 0,
      noResult: 0,
      points: 10,
      netRunRate: 0.68,
      formattedNRR: "+0.680",
      qualification: "Qualifier 1",
    },
    {
      position: 3,
      teamId: "kathmandu-gorkhas",
      teamName: "Kathmandu Gorkhas",
      played: 7,
      won: 5,
      lost: 2,
      tied: 0,
      noResult: 0,
      points: 10,
      netRunRate: 0.537,
      formattedNRR: "+0.537",
      qualification: "Eliminator",
    },
    {
      position: 4,
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
      played: 7,
      won: 4,
      lost: 3,
      tied: 0,
      noResult: 0,
      points: 8,
      netRunRate: -0.394,
      formattedNRR: "-0.394",
      qualification: "Eliminator",
    },
    {
      position: 5,
      teamId: "pokhara-avengers",
      teamName: "Pokhara Avengers",
      played: 7,
      won: 3,
      lost: 4,
      tied: 0,
      noResult: 0,
      points: 6,
      netRunRate: -0.179,
      formattedNRR: "-0.179",
      qualification: "Eliminated",
    },
    {
      position: 6,
      teamId: "karnali-yaks",
      teamName: "Karnali Yaks",
      played: 7,
      won: 2,
      lost: 5,
      tied: 0,
      noResult: 0,
      points: 4,
      netRunRate: -0.356,
      formattedNRR: "-0.356",
      qualification: "Eliminated",
    },
    {
      position: 7,
      teamId: "chitwan-rhinos",
      teamName: "Chitwan Rhinos",
      played: 7,
      won: 2,
      lost: 5,
      tied: 0,
      noResult: 0,
      points: 4,
      netRunRate: -0.611,
      formattedNRR: "-0.611",
      qualification: "Eliminated",
    },
    {
      position: 8,
      teamId: "janakpur-bolts",
      teamName: "Janakpur Bolts",
      played: 7,
      won: 1,
      lost: 6,
      tied: 0,
      noResult: 0,
      points: 2,
      netRunRate: -0.443,
      formattedNRR: "-0.443",
      qualification: "Eliminated",
    },
  ],

  /* ── 3. Verified Tournament Awards (Section 3 of PDF) ── */
  awards: [
    {
      id: "player-of-tournament",
      title: "Player of the Tournament / Series",
      recipient: "Ruben Trumpelmann",
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
      playerSlug: null, // Overseas player not in S3 retained squad
      detail: "Reported as overall Player of the Series",
      categoryNote: "Kept as a distinct award category from Best Nepali Player per source documentation.",
      confidence: "High",
    },
    {
      id: "best-nepali-player",
      title: "Best Nepali Player",
      recipient: "Rohit Kumar Paudel",
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
      playerSlug: "rohit-paudel",
      detail: "276 runs, 10 wickets; Ratopati editorial reported as 'Player of the Tournament' (Nepali sense)",
      categoryNote: "Distinguished from overall Player of the Series; sources use overlapping terms.",
      confidence: "High",
    },
    {
      id: "best-batter",
      title: "Best Batter",
      recipient: "Rohit Kumar Paudel",
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
      playerSlug: "rohit-paudel",
      detail: "Reported by Ratopati (276 runs)",
      confidence: "High",
    },
    {
      id: "best-bowler",
      title: "Best Bowler",
      recipient: "Sandeep Lamichhane",
      teamId: "biratnagar-kings",
      teamName: "Biratnagar Kings",
      playerSlug: "sandeep-lamichhane",
      detail: "17 wickets across the tournament",
      confidence: "High",
    },
    {
      id: "emerging-player",
      title: "Emerging Player",
      recipient: "Sher Malla",
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
      playerSlug: "sher-malla",
      detail: "Verified via Lumbini Lions official club bulletin",
      confidence: "High",
    },
    {
      id: "leading-run-scorer",
      title: "Leading Run Scorer",
      recipient: "Adam Rossington",
      teamId: "pokhara-avengers",
      teamName: "Pokhara Avengers",
      playerSlug: null,
      detail: "323 runs in 7 innings (avg: 53.83, SR: 150.93)",
      confidence: "High",
    },
    {
      id: "leading-wicket-taker",
      title: "Leading Wicket Taker",
      recipient: "Sandeep Lamichhane",
      teamId: "biratnagar-kings",
      teamName: "Biratnagar Kings",
      playerSlug: "sandeep-lamichhane",
      detail: "17 wickets",
      confidence: "High",
    },
    {
      id: "player-of-final",
      title: "Player of the Final",
      recipient: "Ruben Trumpelmann",
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
      playerSlug: null,
      detail: "3 wickets for 3 runs (3/3) in championship decider",
      confidence: "High",
    },
  ],

  /* ── 4. Playoff Results (Section 5 of PDF) ── */
  playoffs: [
    {
      id: "qualifier-1",
      stage: "Qualifier 1",
      date: "2025-12-09",
      formattedDate: "9 December 2025",
      team1: {
        id: "sudurpaschim-royals",
        name: "Sudurpaschim Royals",
        score: "155/8",
        overs: "20",
      },
      team2: {
        id: "biratnagar-kings",
        name: "Biratnagar Kings",
        score: "78",
        overs: "14.1",
      },
      rawScoreSummary: "SPR 155/8 (20); BK 78 all out (14.1)",
      result: "Sudurpaschim Royals won by 77 runs",
      winnerTeamId: "sudurpaschim-royals",
      playerOfTheMatch: null, // NOT FOUND in source
      scorecardAvailable: true,
    },
    {
      id: "eliminator",
      stage: "Eliminator",
      date: "2025-12-10",
      formattedDate: "10 December 2025",
      team1: {
        id: "kathmandu-gorkhas",
        name: "Kathmandu Gorkhas",
        score: "111/9",
        overs: "20",
      },
      team2: {
        id: "lumbini-lions",
        name: "Lumbini Lions",
        score: "112/6",
        overs: "17.4",
      },
      rawScoreSummary: "KG 111/9 (20); LL 112/6 (17.4)",
      result: "Lumbini Lions won by 4 wickets",
      winnerTeamId: "lumbini-lions",
      playerOfTheMatch: null, // NOT FOUND in source
      scorecardAvailable: true,
    },
    {
      id: "qualifier-2",
      stage: "Qualifier 2",
      date: "2025-12-11",
      formattedDate: "11 December 2025",
      team1: {
        id: "biratnagar-kings",
        name: "Biratnagar Kings",
        score: null, // NOT FOUND
        overs: null,
      },
      team2: {
        id: "lumbini-lions",
        name: "Lumbini Lions",
        score: null, // NOT FOUND
        overs: null,
      },
      rawScoreSummary: null, // NOT FOUND in verified dataset
      result: "Lumbini Lions won by 40 runs",
      winnerTeamId: "lumbini-lions",
      playerOfTheMatch: null, // NOT FOUND in source
      scorecardAvailable: false,
      notes: "Scorecard pending retrieval from ESPN/Cricbuzz. Result and margin confirmed by Radio Nepal & editorial reports.",
    },
    {
      id: "final",
      stage: "Final",
      date: "2025-12-13",
      formattedDate: "13 December 2025",
      team1: {
        id: "sudurpaschim-royals",
        name: "Sudurpaschim Royals",
        score: "85",
        overs: "19.1",
      },
      team2: {
        id: "lumbini-lions",
        name: "Lumbini Lions",
        score: "86/4",
        overs: "9",
      },
      rawScoreSummary: "SPR 85 all out (19.1); LL 86/4 (9)",
      result: "Lumbini Lions won by 6 wickets",
      winnerTeamId: "lumbini-lions",
      playerOfTheMatch: {
        name: "Ruben Trumpelmann",
        playerSlug: null,
        stats: "3 wickets, 3/3",
      },
      scorecardAvailable: true,
    },
  ],

  /* ── 5. Verified League Matches (Section 6 of PDF - 7 of 28 rows) ── */
  verifiedLeagueMatches: [
    {
      matchNumber: 1,
      date: "2025-11-17",
      formattedDate: "17 Nov 2025",
      team1: {
        id: "janakpur-bolts",
        name: "Janakpur Bolts",
        score: "130/6",
        overs: "20",
      },
      team2: {
        id: "kathmandu-gorkhas",
        name: "Kathmandu Gorkhas",
        score: "131/5",
        overs: "18",
      },
      rawScoreSummary: "JB 130/6 (20); KG 131/5 (18)",
      result: "Kathmandu Gorkhas won by 5 wickets",
      winnerTeamId: "kathmandu-gorkhas",
      playerOfTheMatch: null,
    },
    {
      matchNumber: 2,
      date: "2025-11-18",
      formattedDate: "18 Nov 2025",
      team1: {
        id: "karnali-yaks",
        name: "Karnali Yaks",
        score: "166/3",
        overs: "20",
      },
      team2: {
        id: "chitwan-rhinos",
        name: "Chitwan Rhinos",
        score: "171/6",
        overs: "19.1",
      },
      rawScoreSummary: "KY 166/3 (20); CR 171/6 (19.1)",
      result: "Chitwan Rhinos won by 4 wickets",
      winnerTeamId: "chitwan-rhinos",
      playerOfTheMatch: null,
    },
    {
      matchNumber: 3,
      date: "2025-11-18",
      formattedDate: "18 Nov 2025",
      team1: {
        id: "biratnagar-kings",
        name: "Biratnagar Kings",
        score: "220/6",
        overs: "20",
      },
      team2: {
        id: "pokhara-avengers",
        name: "Pokhara Avengers",
        score: "167",
        overs: "18.5",
      },
      rawScoreSummary: "BK 220/6 (20); PA 167 all out (18.5)",
      result: "Biratnagar Kings won by 53 runs",
      winnerTeamId: "biratnagar-kings",
      playerOfTheMatch: null,
    },
    {
      matchNumber: 4,
      date: "2025-11-19",
      formattedDate: "19 Nov 2025",
      team1: {
        id: "sudurpaschim-royals",
        name: "Sudurpaschim Royals",
        score: "138/5",
        overs: "20",
      },
      team2: {
        id: "lumbini-lions",
        name: "Lumbini Lions",
        score: "109",
        overs: "17.5",
      },
      rawScoreSummary: "SPR 138/5 (20); LL 109 all out (17.5)",
      result: "Sudurpaschim Royals won by 29 runs",
      winnerTeamId: "sudurpaschim-royals",
      playerOfTheMatch: null,
    },
    {
      matchNumber: 6,
      date: "2025-11-21",
      formattedDate: "21 Nov 2025",
      team1: {
        id: "pokhara-avengers",
        name: "Pokhara Avengers",
        score: "175/8",
        overs: "20",
      },
      team2: {
        id: "sudurpaschim-royals",
        name: "Sudurpaschim Royals",
        score: "193/7",
        overs: "20",
      },
      rawScoreSummary: "PA 175/8 (20); SPR 193/7 (20)",
      result: "Sudurpaschim Royals won by 18 runs",
      winnerTeamId: "sudurpaschim-royals",
      playerOfTheMatch: null,
    },
    {
      matchNumber: 9,
      date: "2025-11-24",
      formattedDate: "24 Nov 2025",
      team1: {
        id: "chitwan-rhinos",
        name: "Chitwan Rhinos",
        score: "120/6",
        overs: "20",
      },
      team2: {
        id: "pokhara-avengers",
        name: "Pokhara Avengers",
        score: "121/2",
        overs: "19.4",
      },
      rawScoreSummary: "CR 120/6 (20); PA 121/2 (19.4)",
      result: "Pokhara Avengers won by 8 wickets",
      winnerTeamId: "pokhara-avengers",
      playerOfTheMatch: null,
    },
    {
      matchNumber: 27,
      date: "2025-12-07",
      formattedDate: "7 Dec 2025",
      team1: {
        id: "karnali-yaks",
        name: "Karnali Yaks",
        score: "129/9",
        overs: "20",
      },
      team2: {
        id: "janakpur-bolts",
        name: "Janakpur Bolts",
        score: "126/7",
        overs: "20",
      },
      rawScoreSummary: "KY 129/9 (20); JB 126/7 (20)",
      result: "Karnali Yaks won by 3 runs",
      winnerTeamId: "karnali-yaks",
      playerOfTheMatch: null,
    },
  ],

  /* ── 6. Verified Leaderboards (Section 7 of PDF) ── */
  leaderboards: {
    batting: {
      mostRuns: {
        title: "Most Runs",
        metric: "Runs",
        items: [
          {
            rank: 1,
            playerName: "Adam Rossington",
            playerSlug: null,
            teamId: "pokhara-avengers",
            teamName: "Pokhara Avengers",
            value: 323,
            metricLabel: "runs",
            secondaryDetail: "7 innings · HS: 108",
          },
          {
            rank: 2,
            playerName: "Rohit Kumar Paudel",
            playerSlug: "rohit-paudel",
            teamId: "lumbini-lions",
            teamName: "Lumbini Lions",
            value: 276,
            metricLabel: "runs",
            secondaryDetail: "2nd verified run-scorer",
          },
        ],
      },
      highestScore: {
        title: "Highest Individual Score",
        metric: "Score",
        items: [
          {
            rank: 1,
            playerName: "Adam Rossington",
            playerSlug: null,
            teamId: "pokhara-avengers",
            teamName: "Pokhara Avengers",
            value: "108",
            metricLabel: "runs",
            secondaryDetail: "1st century of tournament",
          },
        ],
      },
      battingAverage: {
        title: "Batting Average",
        metric: "Avg",
        items: [
          {
            rank: 1,
            playerName: "Adam Rossington",
            playerSlug: null,
            teamId: "pokhara-avengers",
            teamName: "Pokhara Avengers",
            value: "53.83",
            metricLabel: "average",
            secondaryDetail: "323 runs in 7 matches",
          },
        ],
      },
      strikeRate: {
        title: "Batting Strike Rate",
        metric: "SR",
        items: [
          {
            rank: 1,
            playerName: "Adam Rossington",
            playerSlug: null,
            teamId: "pokhara-avengers",
            teamName: "Pokhara Avengers",
            value: "150.93",
            metricLabel: "SR",
            secondaryDetail: "323 runs scored",
          },
        ],
      },
      mostFours: {
        title: "Most Fours",
        metric: "Fours",
        items: [
          {
            rank: 1,
            playerName: "Adam Rossington",
            playerSlug: null,
            teamId: "pokhara-avengers",
            teamName: "Pokhara Avengers",
            value: 31,
            metricLabel: "boundaries",
            secondaryDetail: "31 fours hit",
          },
        ],
      },
      mostSixes: {
        title: "Most Sixes",
        metric: "Sixes",
        items: [
          {
            rank: 1,
            playerName: "Adam Rossington",
            playerSlug: null,
            teamId: "pokhara-avengers",
            teamName: "Pokhara Avengers",
            value: 19,
            metricLabel: "sixes",
            secondaryDetail: "19 maximums cleared",
          },
        ],
      },
      hundreds: {
        title: "Centuries (100s)",
        metric: "100s",
        items: [
          {
            rank: 1,
            playerName: "Adam Rossington",
            playerSlug: null,
            teamId: "pokhara-avengers",
            teamName: "Pokhara Avengers",
            value: 1,
            metricLabel: "century",
            secondaryDetail: "HS 108",
          },
        ],
      },
      fifties: {
        title: "Half-Centuries (50s)",
        metric: "50s",
        items: [
          {
            rank: 1,
            playerName: "Adam Rossington",
            playerSlug: null,
            teamId: "pokhara-avengers",
            teamName: "Pokhara Avengers",
            value: 2,
            metricLabel: "fifties",
            secondaryDetail: "2 half-centuries",
          },
        ],
      },
    },
    bowling: {
      mostWickets: {
        title: "Most Wickets",
        metric: "Wickets",
        items: [
          {
            rank: 1,
            playerName: "Sandeep Lamichhane",
            playerSlug: "sandeep-lamichhane",
            teamId: "biratnagar-kings",
            teamName: "Biratnagar Kings",
            value: 17,
            metricLabel: "wickets",
            secondaryDetail: "Leading wicket-taker",
          },
          {
            rank: 2,
            playerName: "Ruben Trumpelmann",
            playerSlug: null,
            teamId: "lumbini-lions",
            teamName: "Lumbini Lions",
            value: 15,
            metricLabel: "wickets",
            secondaryDetail: "2nd verified wicket-taker",
          },
        ],
      },
      bestBowling: {
        title: "Best Bowling Figures",
        metric: "Figures",
        items: [
          {
            rank: 1,
            playerName: "Ruben Trumpelmann",
            playerSlug: null,
            teamId: "lumbini-lions",
            teamName: "Lumbini Lions",
            value: "3/3",
            metricLabel: "wickets/runs",
            secondaryDetail: "Achieved in the Grand Final",
          },
        ],
      },
    },
  },

  /* ── 7. Per-Player Season Statistics (Section 8 of PDF) ── */
  playerStats: [
    {
      id: "adam-rossington",
      playerName: "Adam Rossington",
      playerSlug: null, // Overseas, not currently retained in S3 domestic list
      teamId: "pokhara-avengers",
      teamName: "Pokhara Avengers",
      matches: 7,
      innings: 7,
      runs: 323,
      highestScore: "108",
      average: 53.83,
      strikeRate: 150.93,
      wickets: null,
      bestBowling: null,
      economy: null,
      fours: 31,
      sixes: 19,
      hundreds: 1,
      fifties: 2,
      catches: null,
      wicketkeeperDismissals: null,
      confidence: "High",
      sourceNote: "Leading run scorer of tournament; complete batting figures verified across 7 matches.",
    },
    {
      id: "rohit-kumar-paudel",
      playerName: "Rohit Kumar Paudel",
      playerSlug: "rohit-paudel",
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
      matches: null, // NOT FOUND
      innings: null, // NOT FOUND
      runs: 276,
      highestScore: null, // NOT FOUND
      average: null, // NOT FOUND
      strikeRate: null, // NOT FOUND
      wickets: 10,
      bestBowling: null, // NOT FOUND
      economy: null, // NOT FOUND
      fours: null, // NOT FOUND
      sixes: null, // NOT FOUND
      hundreds: null, // NOT FOUND
      fifties: null, // NOT FOUND
      catches: null, // NOT FOUND
      wicketkeeperDismissals: null, // NOT FOUND
      confidence: "High",
      sourceNote: "Best Nepali Player & Best Batter. Sourced via Ratopati editorial review (276 runs, 10 wickets).",
    },
    {
      id: "sandeep-lamichhane",
      playerName: "Sandeep Lamichhane",
      playerSlug: "sandeep-lamichhane",
      teamId: "biratnagar-kings",
      teamName: "Biratnagar Kings",
      matches: null, // NOT FOUND
      innings: null, // NOT FOUND
      runs: null, // NOT FOUND
      highestScore: null, // NOT FOUND
      average: null, // NOT FOUND
      strikeRate: null, // NOT FOUND
      wickets: 17,
      bestBowling: null, // NOT FOUND
      economy: null, // NOT FOUND
      fours: null, // NOT FOUND
      sixes: null, // NOT FOUND
      hundreds: null, // NOT FOUND
      fifties: null, // NOT FOUND
      catches: null, // NOT FOUND
      wicketkeeperDismissals: null, // NOT FOUND
      confidence: "High",
      sourceNote: "Leading wicket-taker of tournament (17 wickets). Additional bowling metrics await full scorecards.",
    },
    {
      id: "ruben-trumpelmann",
      playerName: "Ruben Trumpelmann",
      playerSlug: null,
      teamId: "lumbini-lions",
      teamName: "Lumbini Lions",
      matches: null, // NOT FOUND
      innings: null, // NOT FOUND
      runs: null, // NOT FOUND
      highestScore: null, // NOT FOUND
      average: null, // NOT FOUND
      strikeRate: null, // NOT FOUND
      wickets: 15,
      bestBowling: "3/3",
      economy: null, // NOT FOUND
      fours: null, // NOT FOUND
      sixes: null, // NOT FOUND
      hundreds: null, // NOT FOUND
      fifties: null, // NOT FOUND
      catches: null, // NOT FOUND
      wicketkeeperDismissals: null, // NOT FOUND
      confidence: "High",
      sourceNote: "Player of the Tournament / Series and Player of the Final. Best figures: 3/3 in the final.",
    },
  ],

  /* ── 8. Data Integrity Metadata & Sources (Section 9, 10, 11 of PDF) ── */
  integrity: {
    verifiedLeagueMatchesCount: 7,
    totalLeagueMatchesCount: 28,
    authoritativePointsTableSource: "ESPN Cricinfo Season 2 Table (Authoritative Record)",
    integrityWarnings: [
      "Reconstructed league rows conflict with points table: The full 28-row raw research list named Sudurpaschim Royals as winner of 7 matches, but the authoritative verified table records 6 wins and 1 loss. Winners of unscored rows were inferred, not sourced, and were dropped.",
      "Duplicate fixture excluded: Raw matches 9 and 24 were identical (CR 120/6 v PA 121/2). In single round-robin format teams meet once; match 24 was an obvious copy error and was discarded.",
      "Match numbering discordance: Raw JSON numbers matches 1–16 with differing dates from the 32-row master table. Neither numbering is trustworthy for unscored rows.",
      "Match 26 unconfirmed: A raw entry stated Biratnagar beat Kathmandu by 6 wickets on 7 Dec with zero scores; treated as unconfirmed and omitted.",
      "Team statistics omitted: Raw aggregated team totals mixed league and playoff tallies and were largely NOT FOUND; omitted until all 32 scorecards are imported.",
      "Award nomenclature: 'Player of the Tournament' was applied to both Trumpelmann (overall series) and Paudel (domestic/Nepali honor) by differing outlets; kept as distinct award entries.",
    ],
    missingResearchItems: [
      "Scores, overs, and Player of the Match for the remaining 21 league matches.",
      "Full scorecard and individual player scores for Qualifier 2 (Biratnagar Kings vs Lumbini Lions).",
      "Comprehensive Top 10 / Top 20 leaderboards for batting and bowling.",
      "Bowling economy rates, bowling averages, 4-wicket, and 5-wicket haul tallies.",
      "Tournament fielding tables (catches and wicketkeeper dismissals).",
      "Full squad player-by-player records and verified Season 2 squad registries.",
      "Official CAN competition regulations and tie-break clause documentation.",
    ],
    sources: [
      {
        name: "ESPN Cricinfo",
        description: "Season 2 Fixtures, Results & Points Table",
        url: "https://www.espncricinfo.com/series/nepal-premier-league-2025-26-1511008/points-table-standings",
      },
      {
        name: "ESPN Cricinfo Final Scorecard",
        description: "Grand Final: Sudurpaschim Royals vs Lumbini Lions",
        url: "https://www.espncricinfo.com/series/nepal-premier-league-2025-26-1511008/match-schedule-fixtures-and-results",
      },
      {
        name: "Cricbuzz",
        description: "Series 11190 — Nepal Premier League 2025",
        url: "https://www.cricbuzz.com/cricket-series/11190/nepal-premier-league-2025",
      },
      {
        name: "The Kathmandu Post",
        description: "Final report, Qualifier 1 coverage, and Kathmandu Gorkhas franchise rebrand",
      },
      {
        name: "The Himalayan Times",
        description: "Lumbini Lions crowned champions of NPL 2025",
      },
      {
        name: "Ratopati",
        description: "Tournament awards coverage (Rohit Paudel declared player of tournament & best batter)",
      },
      {
        name: "Lumbini Lions Official Portal",
        description: "Grand Final bulletin and Sher Malla emerging player confirmation",
      },
      {
        name: "Cricket World, CricTracker & Cricket.com",
        description: "Batting and bowling leaderboard verification",
      },
    ],
  },
};

/**
 * NPL Hub Nepal — Mock / Sandbox Cricket Data Provider
 *
 * Implements ICricketDataProvider for testing, sandbox simulations, and fallback.
 * Strictly uses realistic NPL Season 3 structure (8 franchises, TU Stadium)
 * without writing fabricated data to production.
 */

import {
  ICricketDataProvider,
  CricketProviderName,
  NormalizedCricketMatch,
  ProviderVerificationResult,
} from "./types";
import { oversToDecimal } from "@/lib/data/standings";

export class MockCricketProvider implements ICricketDataProvider {
  public readonly name: CricketProviderName = "mock";

  async verifyCoverage(): Promise<ProviderVerificationResult> {
    return {
      provider: this.name,
      configured: true,
      supported: true,
      leagueId: "mock-npl-season-3",
      seasonId: "2026",
      teamsFound: 8,
      matchesFound: 32,
      message:
        "Sandbox / Mock provider active. Fully configured for live score simulation, ball-by-ball events, and automated standings recalculation tests.",
      testedAt: new Date().toISOString(),
      details: {
        venue: "TU International Cricket Stadium, Kirtipur",
        format: "T20",
        totalTeams: 8,
      },
    };
  }

  async fetchLiveMatches(): Promise<NormalizedCricketMatch[]> {
    // Returns a simulated live opening match between Lumbini Lions and Sudurpaschim Royals
    return [
      {
        externalId: "mock-live-match-01",
        provider: this.name,
        season: "season-3",
        matchNumber: 1,
        stage: "League",
        team1ExternalId: "mock-ll",
        team1Name: "Lumbini Lions",
        team1CanonicalId: "lumbini-lions",
        team2ExternalId: "mock-sr",
        team2Name: "Sudurpaschim Royals",
        team2CanonicalId: "sudurpaschim-royals",
        date: "2026-10-26",
        time: "17:00",
        venue: "TU International Cricket Stadium, Kirtipur",
        status: "live",
        scores: {
          team1: {
            runs: 168,
            wickets: 5,
            overs: 20.0,
            oversDecimal: 20.0,
          },
          team2: {
            runs: 142,
            wickets: 4,
            overs: 17.2,
            oversDecimal: oversToDecimal("17.2", 4),
          },
          currentInnings: 2,
          currentBattingTeamId: "sudurpaschim-royals",
          liveStatusDescription: "Sudurpaschim Royals need 27 runs in 16 balls",
          requiredRunRate: 10.12,
          currentRunRate: 8.19,
        },
        tossWinner: "Lumbini Lions",
        tossDecision: "bat",
        lastUpdated: new Date().toISOString(),
      },
    ];
  }

  async fetchMatchDetails(externalMatchId: string): Promise<NormalizedCricketMatch | null> {
    const live = await this.fetchLiveMatches();
    const match = live.find((m) => m.externalId === externalMatchId);
    return match || null;
  }

  async fetchSeasonFixtures(): Promise<NormalizedCricketMatch[]> {
    return this.fetchLiveMatches();
  }
}

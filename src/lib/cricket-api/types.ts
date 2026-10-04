/**
 * NPL Hub Nepal — Cricket API Provider Types & Interfaces
 *
 * Defines normalized models for cricket data providers (SportMonks, TheSportsDB, Mock).
 * Ensures the ingestion layer and frontend remain completely decoupled from provider-specific formats.
 */

export type CricketProviderName = "sportmonks" | "thesportsdb" | "mock" | "manual";

export interface ProviderVerificationResult {
  provider: CricketProviderName;
  configured: boolean;
  supported: boolean;
  leagueId?: string;
  seasonId?: string;
  teamsFound: number;
  matchesFound: number;
  message: string;
  testedAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: Record<string, any>;
}

export interface NormalizedInningsScore {
  runs: number;
  wickets: number;
  overs: number; // e.g. 19.4 (cricket notation)
  oversDecimal: number; // e.g. 19.667 (mathematical overs)
}

export interface NormalizedLiveScores {
  team1?: NormalizedInningsScore;
  team2?: NormalizedInningsScore;
  currentInnings?: 1 | 2;
  currentBattingTeamId?: string;
  liveStatusDescription?: string;
  requiredRunRate?: number;
  currentRunRate?: number;
}

export type MatchLifecycleStatus =
  | "upcoming"
  | "live"
  | "completed"
  | "postponed"
  | "abandoned"
  | "tba";

export interface NormalizedCricketMatch {
  externalId: string;
  provider: CricketProviderName;
  season: string;
  matchNumber?: number;
  stage: "League" | "Qualifier 1" | "Eliminator" | "Qualifier 2" | "Final";
  team1ExternalId?: string;
  team1Name: string;
  team1CanonicalId?: string; // e.g. 'biratnagar-kings'
  team2ExternalId?: string;
  team2Name: string;
  team2CanonicalId?: string; // e.g. 'janakpur-bolts'
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  venue?: string;
  status: MatchLifecycleStatus;
  scores?: NormalizedLiveScores;
  result?: string;
  winnerCanonicalId?: string;
  winnerName?: string;
  winMargin?: string;
  winType?: "runs" | "wickets" | "super_over" | "no_result" | "abandoned";
  tossWinner?: string;
  tossDecision?: "bat" | "bowl";
  playerOfTheMatch?: string;
  lastUpdated: string;
}

export interface ICricketDataProvider {
  readonly name: CricketProviderName;

  /**
   * Verify whether the provider currently supports/covers NPL Season 3 (2026).
   */
  verifyCoverage(): Promise<ProviderVerificationResult>;

  /**
   * Fetch currently active live matches.
   */
  fetchLiveMatches(): Promise<NormalizedCricketMatch[]>;

  /**
   * Fetch detailed scorecard and metadata for a specific match by external ID.
   */
  fetchMatchDetails(externalMatchId: string): Promise<NormalizedCricketMatch | null>;

  /**
   * Fetch all fixtures for the current NPL season.
   */
  fetchSeasonFixtures(seasonYear?: number): Promise<NormalizedCricketMatch[]>;
}

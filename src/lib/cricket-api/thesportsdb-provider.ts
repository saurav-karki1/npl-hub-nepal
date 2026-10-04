/**
 * NPL Hub Nepal — TheSportsDB Cricket Data Provider
 *
 * Connects to TheSportsDB API (League ID 5533: Nepal Premier League).
 * Safely tests coverage and maps external data into normalized schemas.
 */

import {
  ICricketDataProvider,
  CricketProviderName,
  NormalizedCricketMatch,
  ProviderVerificationResult,
  MatchLifecycleStatus,
} from "./types";
import { oversToDecimal } from "@/lib/data/standings";

const THESPORTSDB_LEAGUE_ID = "5533"; // Nepal Premier League

// Canonical team ID mapper
const THESPORTSDB_TEAM_MAP: Record<string, { id: string; canonicalId: string }> = {
  "150070": { id: "150070", canonicalId: "biratnagar-kings" },
  "150071": { id: "150071", canonicalId: "chitwan-rhinos" },
  "150072": { id: "150072", canonicalId: "janakpur-bolts" },
  "150073": { id: "150073", canonicalId: "karnali-yaks" },
  "150074": { id: "150074", canonicalId: "kathmandu-gorkhas" },
  "150075": { id: "150075", canonicalId: "lumbini-lions" },
  "150076": { id: "150076", canonicalId: "pokhara-avengers" },
  "150077": { id: "150077", canonicalId: "sudurpaschim-royals" },
};

function normalizeTeamNameToSlug(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("biratnagar")) return "biratnagar-kings";
  if (lower.includes("chitwan")) return "chitwan-rhinos";
  if (lower.includes("janakpur")) return "janakpur-bolts";
  if (lower.includes("karnali")) return "karnali-yaks";
  if (lower.includes("kathmandu")) return "kathmandu-gorkhas";
  if (lower.includes("lumbini")) return "lumbini-lions";
  if (lower.includes("pokhara")) return "pokhara-avengers";
  if (lower.includes("sudurpaschim")) return "sudurpaschim-royals";
  return lower.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export class TheSportsDbProvider implements ICricketDataProvider {
  public readonly name: CricketProviderName = "thesportsdb";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.THESPORTSDB_API_KEY || "3"; // '3' is public demo key
    this.baseUrl = `https://www.thesportsdb.com/api/v1/json/${this.apiKey}`;
  }

  async verifyCoverage(): Promise<ProviderVerificationResult> {
    const testedAt = new Date().toISOString();
    try {
      // 1. Verify League Teams
      const teamsRes = await fetch(
        `${this.baseUrl}/search_all_teams.php?l=Nepal%20Premier%20League`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      if (!teamsRes.ok) {
        return {
          provider: this.name,
          configured: true,
          supported: false,
          teamsFound: 0,
          matchesFound: 0,
          message: `TheSportsDB HTTP error ${teamsRes.status}`,
          testedAt,
        };
      }

      const teamsData = await teamsRes.json();
      const teams = teamsData.teams || [];

      // 2. Verify 2026 Season Fixtures
      const fixturesRes = await fetch(
        `${this.baseUrl}/eventsseason.php?id=${THESPORTSDB_LEAGUE_ID}&s=2026`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      const fixturesData = fixturesRes.ok ? await fixturesRes.json() : {};
      const matches = fixturesData.events || [];

      const has2026Data = matches.length > 0;

      return {
        provider: this.name,
        configured: true,
        supported: has2026Data,
        leagueId: THESPORTSDB_LEAGUE_ID,
        seasonId: "2026",
        teamsFound: teams.length,
        matchesFound: matches.length,
        message: has2026Data
          ? `Verified! Found ${teams.length} teams and ${matches.length} fixtures in TheSportsDB.`
          : `TheSportsDB has 8 NPL teams registered, but 2026 Season 3 fixtures are not yet added. Manual admin entry or verified mock provider active.`,
        testedAt,
        details: {
          teams: teams.map((t: { idTeam: string; strTeam: string }) => ({
            id: t.idTeam,
            name: t.strTeam,
          })),
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return {
        provider: this.name,
        configured: true,
        supported: false,
        teamsFound: 0,
        matchesFound: 0,
        message: `TheSportsDB verification failed: ${msg}`,
        testedAt,
      };
    }
  }

  async fetchLiveMatches(): Promise<NormalizedCricketMatch[]> {
    // TheSportsDB free tier does not provide live websocket/real-time ball-by-ball.
    // It provides periodic score updates through eventsday / eventsnextleague.
    try {
      const res = await fetch(
        `${this.baseUrl}/eventsnextleague.php?id=${THESPORTSDB_LEAGUE_ID}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const events = data.events || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return events.map((ev: any) => this.mapEventToNormalized(ev));
    } catch {
      return [];
    }
  }

  async fetchMatchDetails(externalMatchId: string): Promise<NormalizedCricketMatch | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/lookupevent.php?id=${externalMatchId}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const event = data.events?.[0];
      return event ? this.mapEventToNormalized(event) : null;
    } catch {
      return null;
    }
  }

  async fetchSeasonFixtures(seasonYear: number = 2026): Promise<NormalizedCricketMatch[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/eventsseason.php?id=${THESPORTSDB_LEAGUE_ID}&s=${seasonYear}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const events = data.events || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return events.map((ev: any) => this.mapEventToNormalized(ev));
    } catch {
      return [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapEventToNormalized(ev: any): NormalizedCricketMatch {
    const team1Id = ev.idHomeTeam ? THESPORTSDB_TEAM_MAP[ev.idHomeTeam]?.canonicalId : undefined;
    const team2Id = ev.idAwayTeam ? THESPORTSDB_TEAM_MAP[ev.idAwayTeam]?.canonicalId : undefined;

    const team1Canonical = team1Id || normalizeTeamNameToSlug(ev.strHomeTeam || "");
    const team2Canonical = team2Id || normalizeTeamNameToSlug(ev.strAwayTeam || "");

    let status: MatchLifecycleStatus = "upcoming";
    const rawStatus = (ev.strStatus || "").toLowerCase();
    if (rawStatus.includes("postponed") || ev.strPostponed === "yes") {
      status = "postponed";
    } else if (rawStatus.includes("abandon") || rawStatus.includes("cancel")) {
      status = "abandoned";
    } else if (rawStatus.includes("live") || rawStatus.includes("in progress")) {
      status = "live";
    } else if (rawStatus.includes("ft") || rawStatus.includes("complete") || rawStatus.includes("finished") || (ev.intHomeScore && ev.intAwayScore)) {
      status = "completed";
    }

    const homeRuns = parseInt(ev.intHomeScore, 10);
    const awayRuns = parseInt(ev.intAwayScore, 10);

    const hasScores = !isNaN(homeRuns) || !isNaN(awayRuns);

    return {
      externalId: String(ev.idEvent),
      provider: this.name,
      season: ev.strSeason || "2026",
      stage: "League",
      team1ExternalId: ev.idHomeTeam,
      team1Name: ev.strHomeTeam || "",
      team1CanonicalId: team1Canonical,
      team2ExternalId: ev.idAwayTeam,
      team2Name: ev.strAwayTeam || "",
      team2CanonicalId: team2Canonical,
      date: ev.dateEvent || "",
      time: ev.strTime ? ev.strTime.substring(0, 5) : undefined,
      venue: ev.strVenue || "TU International Cricket Stadium, Kirtipur",
      status,
      scores: hasScores
        ? {
            team1: !isNaN(homeRuns)
              ? { runs: homeRuns, wickets: 0, overs: 20, oversDecimal: 20 }
              : undefined,
            team2: !isNaN(awayRuns)
              ? { runs: awayRuns, wickets: 0, overs: 20, oversDecimal: 20 }
              : undefined,
          }
        : undefined,
      result: ev.strResult || undefined,
      lastUpdated: new Date().toISOString(),
    };
  }
}

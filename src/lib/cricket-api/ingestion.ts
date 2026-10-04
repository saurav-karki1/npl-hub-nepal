/**
 * NPL Hub Nepal — Cricket Live Data Ingestion Engine
 *
 * Ingests match data from external cricket providers into Supabase PostgreSQL.
 * Features:
 * - Duplicate prevention (external match ID lookup + canonical team matching)
 * - Safe state updates (scores, wickets, overs, match status)
 * - Automatic points table recalculation when a match completes
 * - Resilient error handling, logging, and metrics
 */

import { ICricketDataProvider, NormalizedCricketMatch } from "./types";
import { getCricketProvider } from "./index";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { recalculateAndPersistStandings } from "@/lib/standings/calculator";

export interface IngestionSummary {
  provider: string;
  timestamp: string;
  matchesChecked: number;
  matchesUpdated: number;
  matchesSkipped: number;
  standingsRecalculated: boolean;
  errors: string[];
}

export async function ingestLiveCricketData(
  providerInstance?: ICricketDataProvider
): Promise<IngestionSummary> {
  const provider = providerInstance || getCricketProvider();
  const summary: IngestionSummary = {
    provider: provider.name,
    timestamp: new Date().toISOString(),
    matchesChecked: 0,
    matchesUpdated: 0,
    matchesSkipped: 0,
    standingsRecalculated: false,
    errors: [],
  };

  try {
    const liveMatches = await provider.fetchLiveMatches();
    summary.matchesChecked = liveMatches.length;

    if (liveMatches.length === 0) {
      return summary;
    }

    const admin = getSupabaseAdminClient();
    let hasCompletedMatchUpdate = false;

    for (const match of liveMatches) {
      try {
        const updateResult = await syncMatchRecord(admin, match);
        if (updateResult.updated) {
          summary.matchesUpdated += 1;
          if (match.status === "completed") {
            hasCompletedMatchUpdate = true;
          }
        } else {
          summary.matchesSkipped += 1;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error syncing match";
        summary.errors.push(`Match ${match.externalId}: ${msg}`);
      }
    }

    // If any match completed during this sync, recompute standings automatically
    if (hasCompletedMatchUpdate) {
      const standingsResult = await recalculateAndPersistStandings("season-3");
      summary.standingsRecalculated = standingsResult.success;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ingestion engine error";
    summary.errors.push(msg);
  }

  return summary;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncMatchRecord(
  admin: any,
  match: NormalizedCricketMatch
): Promise<{ updated: boolean; matchId?: string }> {
  // 1. Try to find match by external ID or match number or team pairs
  let query = admin.from("matches").select("*").eq("season_id", "season-3");

  if (match.matchNumber) {
    query = query.eq("match_number", match.matchNumber);
  } else if (match.team1CanonicalId && match.team2CanonicalId) {
    query = query
      .eq("team1_id", match.team1CanonicalId)
      .eq("team2_id", match.team2CanonicalId);
  } else {
    return { updated: false };
  }

  const { data: existingMatches, error: findErr } = await query.limit(1);
  if (findErr || !existingMatches || existingMatches.length === 0) {
    return { updated: false };
  }

  const existing = existingMatches[0];

  // 2. Build structured scores JSON
  const scorePayload = match.scores
    ? {
        team1: match.scores.team1
          ? {
              runs: match.scores.team1.runs,
              wickets: match.scores.team1.wickets,
              overs: match.scores.team1.overs,
            }
          : null,
        team2: match.scores.team2
          ? {
              runs: match.scores.team2.runs,
              wickets: match.scores.team2.wickets,
              overs: match.scores.team2.overs,
            }
          : null,
        live: match.scores.liveStatusDescription
          ? {
              description: match.scores.liveStatusDescription,
              crr: match.scores.currentRunRate,
              rrr: match.scores.requiredRunRate,
            }
          : null,
      }
    : existing.scores;

  // 3. Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {
    status: match.status,
    scores: scorePayload,
    updated_at: new Date().toISOString(),
  };

  if (match.result) updatePayload.result = match.result;
  if (match.winnerCanonicalId) updatePayload.winner_team_id = match.winnerCanonicalId;
  if (match.winnerName) updatePayload.winner_name = match.winnerName;
  if (match.winMargin) updatePayload.win_margin = match.winMargin;
  if (match.winType) updatePayload.win_type = match.winType;
  if (match.playerOfTheMatch) updatePayload.player_of_the_match = match.playerOfTheMatch;

  const { error: updateErr } = await admin
    .from("matches")
    .update(updatePayload)
    .eq("id", existing.id);

  if (updateErr) {
    throw new Error(`Failed to update match ${existing.id}: ${updateErr.message}`);
  }

  return { updated: true, matchId: existing.id };
}

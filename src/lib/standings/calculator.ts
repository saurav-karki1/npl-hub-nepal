/**
 * NPL Hub Nepal — Standings Calculator & Persistence Engine
 *
 * Implements automated points table recalculation from verified match results.
 * Strictly adheres to NPL rules (2 pts win, 1 pt tie/NR, 0 loss, mathematical NRR).
 * Writes updated standings to Supabase `team_seasons` table using service-role client.
 */

import { computeStandings, StandingsData } from "@/lib/data/standings";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { NPL_TEAM_DETAILS } from "@/lib/data/teams-data";
import { ScheduleMatch } from "@/lib/data/schedule-data";

export interface RecalculateStandingsResult {
  success: boolean;
  seasonId: string;
  totalCompletedMatches: number;
  hasResults: boolean;
  updatedTeams: number;
  standings: StandingsData;
  error?: string;
}

/**
 * Calculates current standings from completed matches in the database
 * and writes the updated standings rows to `team_seasons`.
 */
export async function recalculateAndPersistStandings(
  seasonId: string = "season-3"
): Promise<RecalculateStandingsResult> {
  const admin = getSupabaseAdminClient();

  // 1. Fetch all matches for the season
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dbMatches, error: matchesErr } = await (admin as any)
    .from("matches")
    .select("*")
    .eq("season_id", seasonId)
    .order("match_number", { ascending: true });

  if (matchesErr || !dbMatches) {
    return {
      success: false,
      seasonId,
      totalCompletedMatches: 0,
      hasResults: false,
      updatedTeams: 0,
      standings: computeStandings([], NPL_TEAM_DETAILS),
      error: matchesErr?.message || "Failed to query matches from database.",
    };
  }

  // 2. Map database rows to ScheduleMatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fixtures: ScheduleMatch[] = dbMatches.map((row: any) => ({
    id: row.id,
    matchNumber: row.match_number,
    stage: row.stage,
    team1Id: row.team1_id,
    team1Placeholder: row.team1_placeholder,
    team2Id: row.team2_id,
    team2Placeholder: row.team2_placeholder,
    date: row.match_date,
    formattedDate: row.formatted_date,
    bsDate: row.bs_date,
    bsDateNepali: row.bs_date_nepali,
    dayOfWeek: row.day_of_week,
    time: row.match_time,
    venue: row.venue,
    status: row.status,
    result: row.result || undefined,
    scores: row.scores || undefined,
    slug: row.slug,
    isProvisional: row.is_provisional || false,
  }));

  // 3. Compute standings mathematically
  const standings = computeStandings(fixtures, NPL_TEAM_DETAILS);

  // 4. Update team_seasons table in Supabase
  let updatedCount = 0;
  for (const row of standings.rows) {
    const updatePayload = {
      standing_position: row.position,
      played: row.played ?? 0,
      won: row.won ?? 0,
      lost: row.lost ?? 0,
      no_result: row.noResult ?? 0,
      points: row.points ?? 0,
      net_run_rate: row.netRunRate,
      runs_scored: row.runsScored,
      overs_faced_decimal: row.oversFacedDecimal,
      runs_conceded: row.runsConceded,
      overs_bowled_decimal: row.oversBowledDecimal,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("team_seasons")
      .update(updatePayload)
      .eq("season_id", seasonId)
      .eq("team_id", row.team.id);

    if (!updateErr) {
      updatedCount += 1;
    }
  }

  return {
    success: true,
    seasonId,
    totalCompletedMatches: standings.totalMatchesCompleted,
    hasResults: standings.hasResults,
    updatedTeams: updatedCount,
    standings,
  };
}

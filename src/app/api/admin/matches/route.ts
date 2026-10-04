/**
 * NPL Hub Nepal — Admin Matches API Route
 *
 * Secure server-side endpoint for admin match and fixture management.
 * All write operations require a valid Supabase Auth session token.
 * Uses the service-role client (server-only) — never exposes the key to the browser.
 *
 * GET  /api/admin/matches          — List all fixtures across seasons (ordered by match_number)
 * PUT  /api/admin/matches          — Update match fixture schedule, venue, teams/placeholders, status
 *
 * Auth: Bearer token in Authorization header (Supabase Auth JWT from session.access_token)
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { recalculateAndPersistStandings } from "@/lib/standings/calculator";
import type { Database } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Auth Helpers
// ---------------------------------------------------------------------------

/** Verify the caller has a valid Supabase Auth session. Returns user or throws. */
async function verifyAuthSession(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header.");
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!anonKey) {
    throw new Error("Supabase public key is not configured.");
  }

  const anonClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Invalid or expired session token.");
  }

  return data.user;
}

// ---------------------------------------------------------------------------
// Constants & Validation Sets
// ---------------------------------------------------------------------------

const VALID_STAGES = ["League", "Qualifier 1", "Eliminator", "Qualifier 2", "Final"] as const;
const VALID_STATUSES = ["upcoming", "completed", "live", "postponed", "abandoned", "tba"] as const;

const VALID_FRANCHISE_IDS = [
  "biratnagar-kings",
  "chitwan-rhinos",
  "janakpur-bolts",
  "karnali-yaks",
  "kathmandu-gorkhas",
  "lumbini-lions",
  "pokhara-avengers",
  "sudurpaschim-royals",
];

const VALID_PLACEHOLDER_IDS = [
  "rank-1",
  "rank-2",
  "rank-3",
  "rank-4",
  "q1-loser",
  "elim-winner",
  "q1-winner",
  "q2-winner",
];

// ---------------------------------------------------------------------------
// Input Types
// ---------------------------------------------------------------------------

interface UpdateMatchPayload {
  matchId: string;
  seasonId: string;
  matchNumber?: number;
  stage?: (typeof VALID_STAGES)[number];
  team1Id?: string | null;
  team1Placeholder?: string | null;
  team2Id?: string | null;
  team2Placeholder?: string | null;
  matchDate?: string;
  formattedDate?: string;
  bsDate?: string;
  bsDateNepali?: string;
  dayOfWeek?: string;
  matchTime?: string;
  venue?: string;
  status?: (typeof VALID_STATUSES)[number];
  isProvisional?: boolean;
  result?: string | null;
  winnerTeamId?: string | null;
  winnerName?: string | null;
  winMargin?: string | null;
  winType?: "runs" | "wickets" | "super_over" | "no_result" | "abandoned" | null;
  resultStatement?: string | null;
  playerOfTheMatch?: string | null;
  tossWinnerTeamId?: string | null;
  tossDecision?: "bat" | "bowl" | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scores?: any | null;
  externalProvider?: string | null;
  externalMatchId?: string | null;
}

// ---------------------------------------------------------------------------
// GET /api/admin/matches
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    await verifyAuthSession(req);
    const admin = getSupabaseAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matches, error } = await (admin as any)
      .from("matches")
      .select("*")
      .order("match_number", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ matches });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/matches
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    const body: UpdateMatchPayload = await req.json();
    const { matchId, seasonId, ...fields } = body;

    if (!matchId || !seasonId) {
      return NextResponse.json(
        { error: "matchId and seasonId are required." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // Fetch existing match to check invariants against current state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchCurrentErr } = await (admin as any)
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (fetchCurrentErr || !existing) {
      return NextResponse.json(
        { error: "Target match record was not found." },
        { status: 404 }
      );
    }

    // --- Validate Stage ---
    if (fields.stage !== undefined && !VALID_STAGES.includes(fields.stage)) {
      return NextResponse.json(
        { error: `Invalid match stage: ${fields.stage}` },
        { status: 400 }
      );
    }

    // --- Validate Status ---
    if (fields.status !== undefined && !VALID_STATUSES.includes(fields.status)) {
      return NextResponse.json(
        { error: `Invalid match status: ${fields.status}` },
        { status: 400 }
      );
    }

    // --- Validate Match Number Uniqueness if changed ---
    if (fields.matchNumber !== undefined && fields.matchNumber !== existing.match_number) {
      if (fields.matchNumber < 1 || fields.matchNumber > 64) {
        return NextResponse.json(
          { error: "Match number must be between 1 and 64." },
          { status: 400 }
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: duplicateNum } = await (admin as any)
        .from("matches")
        .select("id")
        .eq("season_id", seasonId)
        .eq("match_number", fields.matchNumber)
        .neq("id", matchId)
        .maybeSingle();

      if (duplicateNum) {
        return NextResponse.json(
          { error: `Match #${fields.matchNumber} already exists in ${seasonId}.` },
          { status: 400 }
        );
      }
    }

    // --- Validate Side 1 Invariant ---
    const finalTeam1Id = fields.team1Id !== undefined ? fields.team1Id : existing.team1_id;
    const finalTeam1Placeholder =
      fields.team1Placeholder !== undefined
        ? fields.team1Placeholder
        : existing.team1_placeholder;

    const hasTeam1 = Boolean(finalTeam1Id);
    const hasPlaceholder1 = Boolean(finalTeam1Placeholder);

    if (hasTeam1 === hasPlaceholder1) {
      return NextResponse.json(
        {
          error:
            "Side 1 must have exactly one assignment: either a confirmed franchise team or a playoff placeholder.",
        },
        { status: 400 }
      );
    }

    if (finalTeam1Id && !VALID_FRANCHISE_IDS.includes(finalTeam1Id)) {
      return NextResponse.json(
        { error: `Invalid Team 1 franchise ID: ${finalTeam1Id}` },
        { status: 400 }
      );
    }

    if (finalTeam1Placeholder && !VALID_PLACEHOLDER_IDS.includes(finalTeam1Placeholder)) {
      return NextResponse.json(
        { error: `Invalid Team 1 playoff placeholder: ${finalTeam1Placeholder}` },
        { status: 400 }
      );
    }

    // --- Validate Side 2 Invariant ---
    const finalTeam2Id = fields.team2Id !== undefined ? fields.team2Id : existing.team2_id;
    const finalTeam2Placeholder =
      fields.team2Placeholder !== undefined
        ? fields.team2Placeholder
        : existing.team2_placeholder;

    const hasTeam2 = Boolean(finalTeam2Id);
    const hasPlaceholder2 = Boolean(finalTeam2Placeholder);

    if (hasTeam2 === hasPlaceholder2) {
      return NextResponse.json(
        {
          error:
            "Side 2 must have exactly one assignment: either a confirmed franchise team or a playoff placeholder.",
        },
        { status: 400 }
      );
    }

    if (finalTeam2Id && !VALID_FRANCHISE_IDS.includes(finalTeam2Id)) {
      return NextResponse.json(
        { error: `Invalid Team 2 franchise ID: ${finalTeam2Id}` },
        { status: 400 }
      );
    }

    if (finalTeam2Placeholder && !VALID_PLACEHOLDER_IDS.includes(finalTeam2Placeholder)) {
      return NextResponse.json(
        { error: `Invalid Team 2 playoff placeholder: ${finalTeam2Placeholder}` },
        { status: 400 }
      );
    }

    // --- Prevent Same Team Faceoff ---
    if (finalTeam1Id && finalTeam2Id && finalTeam1Id === finalTeam2Id) {
      return NextResponse.json(
        { error: "A franchise team cannot be scheduled to play against itself." },
        { status: 400 }
      );
    }

    // --- Build Mutation Payload ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchUpdate: Record<string, any> = {};

    if (fields.matchNumber !== undefined) matchUpdate.match_number = fields.matchNumber;
    if (fields.stage !== undefined) matchUpdate.stage = fields.stage;
    if (fields.team1Id !== undefined) matchUpdate.team1_id = fields.team1Id;
    if (fields.team1Placeholder !== undefined) matchUpdate.team1_placeholder = fields.team1Placeholder;
    if (fields.team2Id !== undefined) matchUpdate.team2_id = fields.team2Id;
    if (fields.team2Placeholder !== undefined) matchUpdate.team2_placeholder = fields.team2Placeholder;
    if (fields.matchDate !== undefined) matchUpdate.match_date = fields.matchDate;
    if (fields.formattedDate !== undefined) matchUpdate.formatted_date = fields.formattedDate;
    if (fields.bsDate !== undefined) matchUpdate.bs_date = fields.bsDate;
    if (fields.bsDateNepali !== undefined) matchUpdate.bs_date_nepali = fields.bsDateNepali;
    if (fields.dayOfWeek !== undefined) matchUpdate.day_of_week = fields.dayOfWeek;
    if (fields.matchTime !== undefined) matchUpdate.match_time = fields.matchTime;
    if (fields.venue !== undefined) matchUpdate.venue = fields.venue;
    if (fields.status !== undefined) matchUpdate.status = fields.status;
    if (fields.isProvisional !== undefined) matchUpdate.is_provisional = fields.isProvisional;
    if (fields.result !== undefined) matchUpdate.result = fields.result;
    if (fields.winnerTeamId !== undefined) matchUpdate.winner_team_id = fields.winnerTeamId;
    if (fields.winnerName !== undefined) matchUpdate.winner_name = fields.winnerName;
    if (fields.winMargin !== undefined) matchUpdate.win_margin = fields.winMargin;
    if (fields.winType !== undefined) matchUpdate.win_type = fields.winType;
    if (fields.resultStatement !== undefined) matchUpdate.result_statement = fields.resultStatement;
    if (fields.playerOfTheMatch !== undefined) matchUpdate.player_of_the_match = fields.playerOfTheMatch;
    if (fields.tossWinnerTeamId !== undefined) matchUpdate.toss_winner_team_id = fields.tossWinnerTeamId;
    if (fields.tossDecision !== undefined) matchUpdate.toss_decision = fields.tossDecision;
    if (fields.scores !== undefined) matchUpdate.scores = fields.scores;
    if (fields.externalProvider !== undefined) matchUpdate.external_provider = fields.externalProvider;
    if (fields.externalMatchId !== undefined) matchUpdate.external_match_id = fields.externalMatchId;

    if (Object.keys(matchUpdate).length > 0) {
      matchUpdate.updated_at = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (admin as any)
        .from("matches")
        .update(matchUpdate)
        .eq("id", matchId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Automatically recalculate standings if match is completed or scores modified
      if (
        fields.status === "completed" ||
        existing.status === "completed" ||
        fields.scores !== undefined ||
        fields.result !== undefined
      ) {
        try {
          await recalculateAndPersistStandings(seasonId);
        } catch {
          // Non-blocking for match save
        }
      }
    }

    // Fetch and return the updated match
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: refetchErr } = await (admin as any)
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (refetchErr) {
      return NextResponse.json({ error: refetchErr.message }, { status: 500 });
    }

    // Bust Next.js cache so public pages show updated match data immediately
    try {
      revalidatePath("/");
      revalidatePath("/schedule");
      revalidatePath("/points-table");
      if (updated.slug) {
        revalidatePath(`/matches/${updated.slug}`);
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ match: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

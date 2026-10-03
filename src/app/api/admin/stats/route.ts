/**
 * NPL Hub Nepal — Admin Stats API Route
 *
 * Secure server-side endpoint for admin statistics and awards management.
 * All write operations require a valid Supabase Auth session token.
 * Uses the service-role client (server-only) — never exposes the key to the browser.
 *
 * GET  /api/admin/stats          — List all player_season_stats and tournament_awards
 * PUT  /api/admin/stats          — Update an existing player_season_stats OR tournament_awards row
 *
 * No blind hard deletion — stats and awards are historical records.
 * Unique constraint: player_season_stats UNIQUE (season_id, player_name, team_id)
 *
 * Auth: Bearer token in Authorization header (Supabase Auth JWT from session.access_token)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
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
// Validation helpers
// ---------------------------------------------------------------------------

type Confidence = "High" | "Medium" | "Low";
const VALID_CONFIDENCE: Confidence[] = ["High", "Medium", "Low"];

/** Validate a nullable non-negative integer field */
function validateNullableNonNegInt(value: unknown, fieldName: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(`${fieldName} must be a non-negative integer or null.`);
  }
  return n;
}

/** Validate a nullable non-negative float field */
function validateNullableNonNegFloat(value: unknown, fieldName: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${fieldName} must be a non-negative number or null.`);
  }
  return n;
}

// ---------------------------------------------------------------------------
// Input Types
// ---------------------------------------------------------------------------

interface UpdateStatPayload {
  type: "stat";
  id: string;
  // All numeric fields nullable — null preserves "unavailable" semantics
  matches?: number | null;
  innings?: number | null;
  runs?: number | null;
  highest_score?: string | null;
  average?: number | null;
  strike_rate?: number | null;
  wickets?: number | null;
  best_bowling?: string | null;
  economy?: number | null;
  fours?: number | null;
  sixes?: number | null;
  hundreds?: number | null;
  fifties?: number | null;
  catches?: number | null;
  wicketkeeper_dismissals?: number | null;
  confidence?: Confidence;
  source_note?: string | null;
}

interface UpdateAwardPayload {
  type: "award";
  id: string;
  award_name?: string;
  recipient_name?: string;
  recipient_player_slug?: string | null;
  recipient_team_id?: string | null;
  recipient_team_name?: string;
  stat_metric?: string | null;
  secondary_detail?: string | null;
  confidence?: Confidence;
  source_note?: string | null;
  sort_order?: number;
}

type UpdatePayload = UpdateStatPayload | UpdateAwardPayload;

// ---------------------------------------------------------------------------
// GET /api/admin/stats
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    await verifyAuthSession(req);
    const admin = getSupabaseAdminClient();

    const url = new URL(req.url);
    const seasonId = url.searchParams.get("season") ?? undefined;

    // Fetch player_season_stats
    let statsQuery = admin
      .from("player_season_stats")
      .select(
        `id, player_season_id, season_id, player_name, player_slug,
         team_id, team_name, matches, innings, runs, highest_score, average,
         strike_rate, wickets, best_bowling, economy, fours, sixes, hundreds,
         fifties, catches, wicketkeeper_dismissals, confidence, source_note,
         created_at, updated_at`
      )
      .order("season_id", { ascending: false })
      .order("runs", { ascending: false, nullsFirst: false });

    if (seasonId) {
      statsQuery = statsQuery.eq("season_id", seasonId);
    }

    const { data: stats, error: statsErr } = await statsQuery;
    if (statsErr) {
      return NextResponse.json({ error: statsErr.message }, { status: 500 });
    }

    // Fetch tournament_awards
    let awardsQuery = admin
      .from("tournament_awards")
      .select(
        `id, season_id, award_type, award_name, recipient_name,
         recipient_player_slug, recipient_team_id, recipient_team_name,
         stat_metric, secondary_detail, confidence, source_note, sort_order,
         created_at, updated_at`
      )
      .order("season_id", { ascending: false })
      .order("sort_order", { ascending: true });

    if (seasonId) {
      awardsQuery = awardsQuery.eq("season_id", seasonId);
    }

    const { data: awards, error: awardsErr } = await awardsQuery;
    if (awardsErr) {
      return NextResponse.json({ error: awardsErr.message }, { status: 500 });
    }

    return NextResponse.json({ stats: stats ?? [], awards: awards ?? [] });
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
// PUT /api/admin/stats
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    const body: UpdatePayload = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    // -----------------------------------------------------------------------
    // Update player_season_stats
    // -----------------------------------------------------------------------
    if (body.type === "stat") {
      const payload = body as UpdateStatPayload;

      // Validate confidence if provided
      if (payload.confidence !== undefined && !VALID_CONFIDENCE.includes(payload.confidence)) {
        return NextResponse.json(
          { error: "Invalid confidence. Must be High, Medium, or Low." },
          { status: 400 }
        );
      }

      // Validate numeric fields — all nullable, all non-negative
      let matches: number | null = undefined as unknown as number | null;
      let innings: number | null = undefined as unknown as number | null;
      let runs: number | null = undefined as unknown as number | null;
      let average: number | null = undefined as unknown as number | null;
      let strike_rate: number | null = undefined as unknown as number | null;
      let wickets: number | null = undefined as unknown as number | null;
      let economy: number | null = undefined as unknown as number | null;
      let fours: number | null = undefined as unknown as number | null;
      let sixes: number | null = undefined as unknown as number | null;
      let hundreds: number | null = undefined as unknown as number | null;
      let fifties: number | null = undefined as unknown as number | null;
      let catches: number | null = undefined as unknown as number | null;
      let wicketkeeper_dismissals: number | null = undefined as unknown as number | null;

      try {
        if ("matches" in payload) matches = validateNullableNonNegInt(payload.matches, "matches");
        if ("innings" in payload) innings = validateNullableNonNegInt(payload.innings, "innings");
        if ("runs" in payload) runs = validateNullableNonNegInt(payload.runs, "runs");
        if ("average" in payload) average = validateNullableNonNegFloat(payload.average, "average");
        if ("strike_rate" in payload) strike_rate = validateNullableNonNegFloat(payload.strike_rate, "strike_rate");
        if ("wickets" in payload) wickets = validateNullableNonNegInt(payload.wickets, "wickets");
        if ("economy" in payload) economy = validateNullableNonNegFloat(payload.economy, "economy");
        if ("fours" in payload) fours = validateNullableNonNegInt(payload.fours, "fours");
        if ("sixes" in payload) sixes = validateNullableNonNegInt(payload.sixes, "sixes");
        if ("hundreds" in payload) hundreds = validateNullableNonNegInt(payload.hundreds, "hundreds");
        if ("fifties" in payload) fifties = validateNullableNonNegInt(payload.fifties, "fifties");
        if ("catches" in payload) catches = validateNullableNonNegInt(payload.catches, "catches");
        if ("wicketkeeper_dismissals" in payload)
          wicketkeeper_dismissals = validateNullableNonNegInt(payload.wicketkeeper_dismissals, "wicketkeeper_dismissals");
      } catch (validErr: unknown) {
        const msg = validErr instanceof Error ? validErr.message : "Validation error";
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (matches !== (undefined as unknown as number | null)) updatePayload.matches = matches;
      if (innings !== (undefined as unknown as number | null)) updatePayload.innings = innings;
      if (runs !== (undefined as unknown as number | null)) updatePayload.runs = runs;
      if ("highest_score" in payload) updatePayload.highest_score = payload.highest_score ?? null;
      if (average !== (undefined as unknown as number | null)) updatePayload.average = average;
      if (strike_rate !== (undefined as unknown as number | null)) updatePayload.strike_rate = strike_rate;
      if (wickets !== (undefined as unknown as number | null)) updatePayload.wickets = wickets;
      if ("best_bowling" in payload) updatePayload.best_bowling = payload.best_bowling ?? null;
      if (economy !== (undefined as unknown as number | null)) updatePayload.economy = economy;
      if (fours !== (undefined as unknown as number | null)) updatePayload.fours = fours;
      if (sixes !== (undefined as unknown as number | null)) updatePayload.sixes = sixes;
      if (hundreds !== (undefined as unknown as number | null)) updatePayload.hundreds = hundreds;
      if (fifties !== (undefined as unknown as number | null)) updatePayload.fifties = fifties;
      if (catches !== (undefined as unknown as number | null)) updatePayload.catches = catches;
      if (wicketkeeper_dismissals !== (undefined as unknown as number | null))
        updatePayload.wicketkeeper_dismissals = wicketkeeper_dismissals;
      if (payload.confidence !== undefined) updatePayload.confidence = payload.confidence;
      if ("source_note" in payload) updatePayload.source_note = payload.source_note ?? null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (admin as any)
        .from("player_season_stats")
        .update(updatePayload)
        .eq("id", payload.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      const { data: updated, error: fetchErr } = await admin
        .from("player_season_stats")
        .select("*")
        .eq("id", payload.id)
        .single();

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }

      return NextResponse.json({ stat: updated });
    }

    // -----------------------------------------------------------------------
    // Update tournament_awards
    // -----------------------------------------------------------------------
    if (body.type === "award") {
      const payload = body as UpdateAwardPayload;

      if (payload.confidence !== undefined && !VALID_CONFIDENCE.includes(payload.confidence)) {
        return NextResponse.json(
          { error: "Invalid confidence. Must be High, Medium, or Low." },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (payload.award_name !== undefined) updatePayload.award_name = payload.award_name;
      if (payload.recipient_name !== undefined) updatePayload.recipient_name = payload.recipient_name;
      if ("recipient_player_slug" in payload) updatePayload.recipient_player_slug = payload.recipient_player_slug ?? null;
      if ("recipient_team_id" in payload) updatePayload.recipient_team_id = payload.recipient_team_id ?? null;
      if (payload.recipient_team_name !== undefined) updatePayload.recipient_team_name = payload.recipient_team_name;
      if ("stat_metric" in payload) updatePayload.stat_metric = payload.stat_metric ?? null;
      if ("secondary_detail" in payload) updatePayload.secondary_detail = payload.secondary_detail ?? null;
      if (payload.confidence !== undefined) updatePayload.confidence = payload.confidence;
      if ("source_note" in payload) updatePayload.source_note = payload.source_note ?? null;
      if (payload.sort_order !== undefined) {
        if (!Number.isInteger(payload.sort_order) || payload.sort_order < 0) {
          return NextResponse.json({ error: "sort_order must be a non-negative integer." }, { status: 400 });
        }
        updatePayload.sort_order = payload.sort_order;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (admin as any)
        .from("tournament_awards")
        .update(updatePayload)
        .eq("id", payload.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      const { data: updated, error: fetchErr } = await admin
        .from("tournament_awards")
        .select("*")
        .eq("id", payload.id)
        .single();

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }

      return NextResponse.json({ award: updated });
    }

    return NextResponse.json(
      { error: "Invalid type. Must be 'stat' or 'award'." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

/**
 * NPL Hub Nepal — Admin Teams API Route
 *
 * Secure server-side endpoint for admin team management.
 * All write operations require a valid Supabase Auth session token.
 * Uses the service-role client (server-only) — never exposes the key to the browser.
 *
 * GET  /api/admin/teams          — List all teams + season data (all seasons)
 * PUT  /api/admin/teams          — Update team core fields + team_seasons entry
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

  // Use the anon client to verify the user's JWT — this is a standard pattern.
  // The service-role client is only used for the actual data mutation.
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
// Input Types
// ---------------------------------------------------------------------------

interface UpdateTeamPayload {
  teamId: string;
  seasonId: string;
  // Core team fields (optional — only updated if provided)
  name?: string;
  shortName?: string;
  initials?: string;
  region?: string;
  city?: string;
  brandColor?: string;
  brandBg?: string;
  crestBg?: string;
  crestText?: string;
  logoUrl?: string | null;
  established?: string;
  description?: string;
  // team_seasons fields
  captainName?: string;
  captainConfidence?: "confirmed" | "reported";
  captainSource?: string;
  coach?: string;
  squadStatus?: string;
}

// ---------------------------------------------------------------------------
// GET /api/admin/teams
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    await verifyAuthSession(req);
    const admin = getSupabaseAdminClient();

    const { data: teams, error } = await admin
      .from("teams")
      .select(
        `
        id, slug, name, short_name, initials, region, city,
        brand_color, brand_bg, crest_bg, crest_text,
        logo_url, established, description, created_at, updated_at,
        team_seasons (
          id, season_id, captain_name, captain_confidence,
          captain_source, coach, squad_status,
          standing_position, played, won, lost, no_result, points
        )
      `
      )
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teams });
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
// PUT /api/admin/teams
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    const body: UpdateTeamPayload = await req.json();
    const { teamId, seasonId, ...fields } = body;

    if (!teamId || !seasonId) {
      return NextResponse.json(
        { error: "teamId and seasonId are required." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // --- Update core team fields (only fields that were provided) ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamUpdate: Record<string, any> = {};
    if (fields.name !== undefined) teamUpdate.name = fields.name;
    if (fields.shortName !== undefined) teamUpdate.short_name = fields.shortName;
    if (fields.initials !== undefined) teamUpdate.initials = fields.initials;
    if (fields.region !== undefined) teamUpdate.region = fields.region;
    if (fields.city !== undefined) teamUpdate.city = fields.city;
    if (fields.brandColor !== undefined) teamUpdate.brand_color = fields.brandColor;
    if (fields.brandBg !== undefined) teamUpdate.brand_bg = fields.brandBg;
    if (fields.crestBg !== undefined) teamUpdate.crest_bg = fields.crestBg;
    if (fields.crestText !== undefined) teamUpdate.crest_text = fields.crestText;
    if (fields.logoUrl !== undefined) teamUpdate.logo_url = fields.logoUrl;
    if (fields.established !== undefined) teamUpdate.established = fields.established;
    if (fields.description !== undefined) teamUpdate.description = fields.description;

    if (Object.keys(teamUpdate).length > 0) {
      teamUpdate.updated_at = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: teamErr } = await (admin as any)
        .from("teams")
        .update(teamUpdate)
        .eq("id", teamId);

      if (teamErr) {
        return NextResponse.json({ error: teamErr.message }, { status: 500 });
      }
    }

    // --- Update team_seasons fields ---
    const tsId = `${seasonId}_${teamId}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tsUpdate: Record<string, any> = {};
    if (fields.captainName !== undefined) tsUpdate.captain_name = fields.captainName;
    if (fields.captainConfidence !== undefined)
      tsUpdate.captain_confidence = fields.captainConfidence;
    if (fields.captainSource !== undefined) tsUpdate.captain_source = fields.captainSource;
    if (fields.coach !== undefined) tsUpdate.coach = fields.coach;
    if (fields.squadStatus !== undefined) tsUpdate.squad_status = fields.squadStatus;

    if (Object.keys(tsUpdate).length > 0) {
      tsUpdate.updated_at = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: tsErr } = await (admin as any)
        .from("team_seasons")
        .update(tsUpdate)
        .eq("id", tsId);

      if (tsErr) {
        return NextResponse.json({ error: tsErr.message }, { status: 500 });
      }
    }

    // --- Return the updated team ---
    const { data: updated, error: fetchErr } = await admin
      .from("teams")
      .select(
        `
        id, slug, name, short_name, initials, region, city,
        brand_color, brand_bg, crest_bg, crest_text,
        logo_url, established, description, updated_at,
        team_seasons (
          id, season_id, captain_name, captain_confidence,
          captain_source, coach, squad_status
        )
      `
      )
      .eq("id", teamId)
      .single();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({ team: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

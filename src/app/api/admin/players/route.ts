/**
 * NPL Hub Nepal — Admin Players API Route
 *
 * Secure server-side endpoint for admin player management.
 * All write operations require a valid Supabase Auth session token.
 * Uses the service-role client (server-only) — never exposes the key to the browser.
 *
 * GET  /api/admin/players          — List all players + season data & team details
 * PUT  /api/admin/players          — Update player core fields + player_seasons entry
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

  // Use the anon client to verify the user's JWT
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

interface UpdatePlayerPayload {
  playerId: string;
  seasonId: string;
  // Core player fields (optional — only updated if provided)
  name?: string;
  displayName?: string | null;
  nationality?: string;
  dateOfBirth?: string | null;
  birthPlace?: string | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  // Season association fields
  teamId?: string;
  role?: "Batter" | "Bowler" | "All-rounder" | "Wicketkeeper";
  status?: "confirmed" | "reported" | "not-announced";
  captain?: boolean;
  marquee?: boolean;
  playerNumber?: number | null;
  confidence?: "confirmed" | "reported" | "unknown";
  source?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | null;
}

// ---------------------------------------------------------------------------
// GET /api/admin/players
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    await verifyAuthSession(req);
    const admin = getSupabaseAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: players, error } = await (admin as any)
      .from("players")
      .select(
        `
        id, slug, name, display_name, nationality, date_of_birth, birth_place,
        batting_style, bowling_style, profile_image, bio, created_at, updated_at,
        player_seasons (
          id, season_id, team_id, role, status, captain, marquee,
          player_number, confidence, source, source_url, source_date,
          teams (
            id, slug, name, short_name, initials, brand_color, crest_bg, crest_text
          )
        )
      `
      )
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ players });
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
// PUT /api/admin/players
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    const body: UpdatePlayerPayload = await req.json();
    const { playerId, seasonId, ...fields } = body;

    if (!playerId || !seasonId) {
      return NextResponse.json(
        { error: "playerId and seasonId are required." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // --- Update core player fields (only fields provided) ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerUpdate: Record<string, any> = {};
    if (fields.name !== undefined) playerUpdate.name = fields.name;
    if (fields.displayName !== undefined) playerUpdate.display_name = fields.displayName;
    if (fields.nationality !== undefined) playerUpdate.nationality = fields.nationality;
    if (fields.dateOfBirth !== undefined)
      playerUpdate.date_of_birth = fields.dateOfBirth || null;
    if (fields.birthPlace !== undefined) playerUpdate.birth_place = fields.birthPlace;
    if (fields.battingStyle !== undefined) playerUpdate.batting_style = fields.battingStyle;
    if (fields.bowlingStyle !== undefined) playerUpdate.bowling_style = fields.bowlingStyle;
    if (fields.profileImage !== undefined) playerUpdate.profile_image = fields.profileImage;
    if (fields.bio !== undefined) playerUpdate.bio = fields.bio;

    if (Object.keys(playerUpdate).length > 0) {
      playerUpdate.updated_at = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: pErr } = await (admin as any)
        .from("players")
        .update(playerUpdate)
        .eq("id", playerId);

      if (pErr) {
        return NextResponse.json({ error: pErr.message }, { status: 500 });
      }
    }

    // --- Update player_seasons fields ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const psUpdate: Record<string, any> = {};
    if (fields.teamId !== undefined) psUpdate.team_id = fields.teamId;
    if (fields.role !== undefined) psUpdate.role = fields.role;
    if (fields.status !== undefined) psUpdate.status = fields.status;
    if (fields.captain !== undefined) psUpdate.captain = fields.captain;
    if (fields.marquee !== undefined) psUpdate.marquee = fields.marquee;
    if (fields.playerNumber !== undefined)
      psUpdate.player_number = fields.playerNumber;
    if (fields.confidence !== undefined) psUpdate.confidence = fields.confidence;
    if (fields.source !== undefined) psUpdate.source = fields.source;
    if (fields.sourceUrl !== undefined) psUpdate.source_url = fields.sourceUrl;
    if (fields.sourceDate !== undefined) psUpdate.source_date = fields.sourceDate;

    if (Object.keys(psUpdate).length > 0) {
      psUpdate.updated_at = new Date().toISOString();

      // Check if player_seasons entry exists for this season
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingPs, error: checkErr } = await (admin as any)
        .from("player_seasons")
        .select("id")
        .eq("season_id", seasonId)
        .eq("player_id", playerId)
        .maybeSingle();

      if (checkErr) {
        return NextResponse.json({ error: checkErr.message }, { status: 500 });
      }

      if (existingPs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: psErr } = await (admin as any)
          .from("player_seasons")
          .update(psUpdate)
          .eq("id", existingPs.id);

        if (psErr) {
          return NextResponse.json({ error: psErr.message }, { status: 500 });
        }
      } else {
        // If enrolling into this season for the first time
        if (!fields.teamId || !fields.role) {
          return NextResponse.json(
            { error: "Team and Role are required to enroll player in this season." },
            { status: 400 }
          );
        }

        const newPs = {
          id: `${seasonId}_${playerId}`,
          season_id: seasonId,
          player_id: playerId,
          team_id: fields.teamId,
          role: fields.role,
          status: fields.status ?? "confirmed",
          captain: fields.captain ?? false,
          marquee: fields.marquee ?? false,
          player_number: fields.playerNumber ?? null,
          confidence: fields.confidence ?? "confirmed",
          source: fields.source ?? null,
          source_url: fields.sourceUrl ?? null,
          source_date: fields.sourceDate ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insErr } = await (admin as any)
          .from("player_seasons")
          .insert(newPs);

        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
      }
    }

    // --- Return the updated player ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: fetchErr } = await (admin as any)
      .from("players")
      .select(
        `
        id, slug, name, display_name, nationality, date_of_birth, birth_place,
        batting_style, bowling_style, profile_image, bio, created_at, updated_at,
        player_seasons (
          id, season_id, team_id, role, status, captain, marquee,
          player_number, confidence, source, source_url, source_date,
          teams (
            id, slug, name, short_name, initials, brand_color, crest_bg, crest_text
          )
        )
      `
      )
      .eq("id", playerId)
      .single();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({ player: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

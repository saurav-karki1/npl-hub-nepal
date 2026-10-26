/**
 * NPL Hub Nepal — Admin Agent Config API
 *
 * GET  /api/admin/agent/config  — Read agent_config row
 * PUT  /api/admin/agent/config  — Update agent_config fields
 *
 * Protected by Supabase Auth JWT (same pattern as all other admin API routes).
 * Uses the service-role client for reads/writes (bypasses RLS).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// Auth helper — identical pattern to existing admin routes
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
  if (!anonKey) throw new Error("Supabase public key is not configured.");

  const anonClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid or expired session token.");
  return data.user;
}

// ---------------------------------------------------------------------------
// GET /api/admin/agent/config
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    await verifyAuthSession(req);
    const admin = getSupabaseAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("agent_config")
      .select("*")
      .eq("id", "news-agent")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "agent_config row not found. Migration may not have run yet." },
        { status: 404 }
      );
    }

    return NextResponse.json({ config: data });
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
// PUT /api/admin/agent/config
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    const body = await req.json();

    // Whitelist updatable fields — prevent overwriting running_since or id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allowed: Record<string, any> = {};
    if (typeof body.enabled === "boolean") allowed.enabled = body.enabled;
    if (
      typeof body.interval_hours === "number" &&
      body.interval_hours >= 1 &&
      body.interval_hours <= 24
    ) {
      allowed.interval_hours = body.interval_hours;
    }
    if (Array.isArray(body.sources)) allowed.sources = body.sources;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update. Accepted: enabled, interval_hours, sources." },
        { status: 400 }
      );
    }

    allowed.updated_at = new Date().toISOString();

    const admin = getSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("agent_config")
      .update(allowed)
      .eq("id", "news-agent");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return updated config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from("agent_config")
      .select("*")
      .eq("id", "news-agent")
      .maybeSingle();

    return NextResponse.json({ config: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

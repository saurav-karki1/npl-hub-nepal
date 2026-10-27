/**
 * NPL Hub Nepal — Admin Agent Config API
 *
 * GET  /api/admin/agent/config  — Read agent_config row
 * PUT  /api/admin/agent/config  — Update agent_config fields
 *
 * Protected by Supabase Auth JWT + ADMIN_ALLOWED_EMAILS server-side allowlist.
 * Uses the service-role client for reads/writes (bypasses RLS).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";

// ---------------------------------------------------------------------------
// GET /api/admin/agent/config
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSession(req);
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
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/agent/config
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    await verifyAdminSession(req);

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
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

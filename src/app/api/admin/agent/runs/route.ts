/**
 * NPL Hub Nepal — Admin Agent Runs API
 *
 * GET /api/admin/agent/runs — Retrieve recent run logs for /admin/agent
 *
 * Protected by Supabase Auth JWT + ADMIN_ALLOWED_EMAILS server-side allowlist.
 * Server-only; uses service-role client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSession(req);
    const admin = getSupabaseAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("agent_runs")
      .select("*")
      .eq("agent_id", "news-agent")
      .order("ran_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ runs: data ?? [] });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

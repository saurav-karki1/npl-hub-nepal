/**
 * NPL Hub Nepal — Admin Agent Manual Trigger API
 *
 * POST /api/admin/agent/trigger
 *
 * Allows an authorized admin to manually trigger a news scan directly from
 * the /admin/agent management UI.
 *
 * Protected by Supabase Auth JWT (no CRON_SECRET needed in browser).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runAgentScan } from "@/lib/agent/runner";
import type { Database } from "@/lib/supabase/types";

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

export async function POST(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    // Allow manual run even if disabled, or pass options
    const result = await runAgentScan({ ignoreDisabledState: true });

    if (result.error && !result.summary) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: result.success,
        summary: result.summary,
        message: result.error,
      },
      { status: result.statusCode }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json(
      { error: message },
      { status: isAuth ? 401 : 500 }
    );
  }
}

/**
 * NPL Hub Nepal — Admin Cricket Sync API
 *
 * POST /api/admin/cricket/sync
 * Triggers live cricket data synchronization using the existing ESPN REST pipeline.
 *
 * Security & Reliability:
 * - Requires a valid Supabase Auth session token (admin only).
 * - Concurrency lock prevents duplicate simultaneous sync executions.
 * - Protects service-role keys and credentials server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runCloudLiveSync, SyncMatchResult } from "@/lib/sync/live-sync-core";
import type { Database } from "@/lib/supabase/types";

// In-memory concurrency guard to prevent simultaneous sync executions
let isSyncInProgress = false;
let lastSyncCompletedAt = 0;

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

    // Prevent duplicate simultaneous sync requests
    if (isSyncInProgress) {
      return NextResponse.json(
        {
          error: "A live sync operation is currently in progress. Please wait a moment.",
          isBusy: true,
        },
        { status: 429 }
      );
    }

    // Rate limit: prevent rapid double-clicks (min 2 seconds between sync calls)
    const now = Date.now();
    if (now - lastSyncCompletedAt < 2000) {
      return NextResponse.json(
        {
          error: "Sync was just executed. Please wait a moment before syncing again.",
          isBusy: true,
        },
        { status: 429 }
      );
    }

    isSyncInProgress = true;

    try {
      const results: SyncMatchResult[] = await runCloudLiveSync();
      lastSyncCompletedAt = Date.now();

      const liveCount = results.filter((r) => r.status === "live").length;
      const completedCount = results.filter((r) => r.status === "completed").length;
      const errorCount = results.filter((r) => r.status === "error").length;

      return NextResponse.json({
        success: true,
        provider: "ESPN",
        timestamp: new Date().toISOString(),
        summary: {
          totalMatchesProcessed: results.length,
          liveMatchesFound: liveCount,
          completedMatchesFound: completedCount,
          errors: errorCount,
          results,
        },
        message:
          results.length > 0
            ? `ESPN live sync executed successfully. Processed ${results.length} match(es).`
            : "ESPN live sync executed. No matches required active synchronization.",
      });
    } finally {
      isSyncInProgress = false;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

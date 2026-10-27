/**
 * NPL Hub Nepal — Cloud Live Match Sync Cron Endpoint
 *
 * GET /api/cron/live-sync
 * POST /api/cron/live-sync
 *
 * Invoked by external cron services (cron-job.org, Vercel Cron, or GitHub Actions).
 * Executes 100% in the cloud on Vercel's serverless environment with zero laptop required.
 *
 * Security:
 * - Checks x-cron-secret header OR ?key=... query param against CRON_SECRET (or default 'npl2026live').
 */

import { NextRequest, NextResponse } from "next/server";
import { runCloudLiveSync } from "@/lib/sync/live-sync-core";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30s timeout on Vercel Pro/Hobby

function verifyCronAccess(req: NextRequest): boolean {
  const envSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const queryKey = req.nextUrl.searchParams.get("key");

  // Universal key for effortless cron-job.org configuration
  const universalKey = "npl2026live";
  if (
    queryKey === universalKey ||
    headerSecret === universalKey ||
    bearerToken === universalKey
  ) {
    return true;
  }

  // Also support Vercel system-generated CRON_SECRET or custom env
  if (envSecret) {
    return (
      headerSecret === envSecret ||
      bearerToken === envSecret ||
      queryKey === envSecret
    );
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!verifyCronAccess(req)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid or missing access key. Provide ?key=... or x-cron-secret header.",
      },
      { status: 401 }
    );
  }

  try {
    const results = await runCloudLiveSync();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      nepalTime: new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Kathmandu",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      syncedCount: results.length,
      matches: results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

/**
 * NPL Hub Nepal — AI News Agent: Scan Endpoint
 *
 * POST /api/agent/news-scan
 *
 * Invoked by external cron (cron-job.org) or health check.
 * Protected by x-cron-secret header.
 */

import { NextRequest, NextResponse } from "next/server";
import { runAgentScan } from "@/lib/agent/runner";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid or missing x-cron-secret header." },
      { status: 401 }
    );
  }

  const result = await runAgentScan();

  if (result.error && !result.summary) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }

  return NextResponse.json(
    { success: result.success, summary: result.summary, message: result.error },
    { status: result.statusCode }
  );
}

export async function GET() {
  return NextResponse.json(
    { status: "ok", endpoint: "POST /api/agent/news-scan" },
    { status: 200 }
  );
}

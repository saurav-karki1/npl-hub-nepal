/**
 * NPL Hub Nepal — AI Editorial Pipeline Worker Endpoint
 *
 * POST /api/agent/editorial/worker
 *
 * Protected by x-cron-secret header matching process.env.CRON_SECRET.
 * Claims exactly ONE pending or lease-expired job, advances it by ONE stage,
 * and returns telemetry. Keeps each serverless execution bounded (~15-45s).
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { claimNextJob } from "@/lib/agent/editorial/jobs-repository";
import { executeSingleJobStage } from "@/lib/agent/editorial/engine";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Missing or invalid x-cron-secret header." },
      { status: 401 }
    );
  }

  const workerToken = crypto.randomUUID();

  try {
    // 1. Claim next available job
    const job = await claimNextJob(workerToken, 120);

    if (!job) {
      return NextResponse.json(
        { status: "idle", message: "No pending or claimable editorial jobs." },
        { status: 200 }
      );
    }

    // 2. Execute single stage
    const result = await executeSingleJobStage(job, workerToken);

    return NextResponse.json(
      {
        success: result.status !== "failed",
        result,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Worker exception";
    return NextResponse.json(
      { error: `Worker execution error: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      endpoint: "POST /api/agent/editorial/worker",
      description: "NPL Hub Multi-Provider AI Editorial Pipeline Worker",
    },
    { status: 200 }
  );
}

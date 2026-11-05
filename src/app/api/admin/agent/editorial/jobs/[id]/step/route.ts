/**
 * NPL Hub Nepal — Admin Editorial Job Step Trigger API
 *
 * POST /api/admin/agent/editorial/jobs/[id]/step
 *
 * Allows an authorized editor in the Admin Control Room to manually execute
 * the next stage for a job immediately without waiting for cron.
 * Protected by verifyAdminSession.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";
import {
  getEditorialJobById,
  renewJobLock,
} from "@/lib/agent/editorial/jobs-repository";
import { executeSingleJobStage } from "@/lib/agent/editorial/engine";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminSession(req);
    const { id } = await context.params;

    const job = await getEditorialJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Editorial job not found." }, { status: 404 });
    }

    if (job.status === "completed") {
      return NextResponse.json(
        { error: "Job is already completed." },
        { status: 400 }
      );
    }

    // Force acquire an admin worker token on this job
    const workerToken = crypto.randomUUID();
    const admin = getSupabaseAdminClient();
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: lockErr } = await (admin as any)
      .from("editorial_jobs")
      .update({
        status: "running",
        pause_reason: null,
        worker_token: workerToken,
        lock_acquired_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (lockErr) {
      return NextResponse.json(
        { error: `Could not lock job: ${lockErr.message}` },
        { status: 500 }
      );
    }

    // Refresh job record with acquired token
    const lockedJob = await getEditorialJobById(id);
    if (!lockedJob) {
      return NextResponse.json({ error: "Job disappeared." }, { status: 500 });
    }

    const stepResult = await executeSingleJobStage(lockedJob, workerToken);
    const updatedJob = await getEditorialJobById(id);

    return NextResponse.json(
      {
        success: stepResult.status !== "failed",
        stepResult,
        job: updatedJob,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

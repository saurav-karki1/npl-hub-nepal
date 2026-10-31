/**
 * NPL Hub Nepal — Admin Editorial Job Retry API
 *
 * POST /api/admin/agent/editorial/jobs/[id]/retry
 *
 * Resets a paused or failed job back to a specified stage (default 1)
 * so it can be resumed by the pipeline worker.
 * Protected by verifyAdminSession.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";
import {
  getEditorialJobById,
  retryEditorialJob,
} from "@/lib/agent/editorial/jobs-repository";
import type { PipelineStage } from "@/lib/agent/editorial/types";

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

    let targetStage: PipelineStage = 1;
    try {
      const body = await req.json();
      if (body.targetStage && Number.isInteger(body.targetStage) && body.targetStage >= 1 && body.targetStage <= 7) {
        targetStage = body.targetStage as PipelineStage;
      }
    } catch {
      // Body optional
    }

    const ok = await retryEditorialJob(id, targetStage);

    if (!ok) {
      return NextResponse.json({ error: "Failed to reset job." }, { status: 500 });
    }

    const updatedJob = await getEditorialJobById(id);

    return NextResponse.json({ success: true, job: updatedJob }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

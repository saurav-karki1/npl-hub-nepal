/**
 * NPL Hub Nepal — Admin Editorial Job Detail & Lifecycle API
 *
 * GET    /api/admin/agent/editorial/jobs/[id] — Retrieve full job details, stage data, telemetry
 * DELETE /api/admin/agent/editorial/jobs/[id] — Permanently delete an editorial job record
 *
 * Protected by verifyAdminSession.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";
import {
  getEditorialJobById,
  deleteEditorialJob,
} from "@/lib/agent/editorial/jobs-repository";

export async function GET(
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

    return NextResponse.json({ job }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminSession(req);
    const { id } = await context.params;

    const success = await deleteEditorialJob(id);

    if (!success) {
      return NextResponse.json({ error: "Failed to delete editorial job." }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

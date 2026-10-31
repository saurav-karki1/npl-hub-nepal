/**
 * NPL Hub Nepal — Admin Editorial Job Detail API
 *
 * GET /api/admin/agent/editorial/jobs/[id]
 *
 * Returns complete job state, stage data, fact dossier, error log, and provider telemetry.
 * Protected by verifyAdminSession.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";
import { getEditorialJobById } from "@/lib/agent/editorial/jobs-repository";

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

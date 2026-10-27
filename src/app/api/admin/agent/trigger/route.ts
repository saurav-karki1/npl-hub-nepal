/**
 * NPL Hub Nepal — Admin Agent Manual Trigger API
 *
 * POST /api/admin/agent/trigger
 *
 * Allows an authorized admin to manually trigger a news scan directly from
 * the /admin/agent management UI.
 *
 * Protected by Supabase Auth JWT + ADMIN_ALLOWED_EMAILS server-side allowlist.
 */

import { NextRequest, NextResponse } from "next/server";
import { runAgentScan } from "@/lib/agent/runner";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";

export async function POST(req: NextRequest) {
  try {
    await verifyAdminSession(req);

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
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

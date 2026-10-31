/**
 * NPL Hub Nepal — Admin Editorial Jobs Collection API
 *
 * GET  /api/admin/agent/editorial/jobs — List all editorial jobs with status & telemetry
 * POST /api/admin/agent/editorial/jobs — Create a new editorial job assignment
 *
 * Protected by verifyAdminSession (Supabase Auth JWT + ADMIN_ALLOWED_EMAILS).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";
import {
  createEditorialJob,
  listEditorialJobs,
} from "@/lib/agent/editorial/jobs-repository";
import type { EditorialArticleType, EditorialJobStatus } from "@/lib/agent/editorial/types";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminSession(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as EditorialJobStatus | null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const { jobs, total } = await listEditorialJobs({
      status: status || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ jobs, total }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await verifyAdminSession(req);

    const body = await req.json();
    const { topic, articleType, targetKeyword } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 5) {
      return NextResponse.json(
        { error: "Topic is required and must be at least 5 characters." },
        { status: 400 }
      );
    }

    if (!articleType || typeof articleType !== "string") {
      return NextResponse.json(
        { error: "Article type is required." },
        { status: 400 }
      );
    }

    const VALID_ARTICLE_TYPES: EditorialArticleType[] = [
      "breaking_news",
      "tournament_news",
      "match_preview",
      "match_report",
      "match_analysis",
      "team_news",
      "player_news",
      "squad_analysis",
      "points_table_update",
      "official_announcement",
      "feature_story",
    ];

    if (!VALID_ARTICLE_TYPES.includes(articleType as EditorialArticleType)) {
      return NextResponse.json(
        {
          error: `Invalid article type "${articleType}". Must be one of: ${VALID_ARTICLE_TYPES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const job = await createEditorialJob({
      topic: topic.trim(),
      articleType: articleType as EditorialArticleType,
      targetKeyword: targetKeyword ? String(targetKeyword).trim() : undefined,
      createdBy: adminUser.email || "admin",
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

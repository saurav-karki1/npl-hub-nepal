/**
 * NPL Hub Nepal — Admin Editorial Job Override API
 *
 * POST /api/admin/agent/editorial/jobs/[id]/override
 *
 * Allows an authorized human editor to override an "insufficient evidence" pause,
 * relaxing the strict threshold and immediately advancing the job to Stage 4 (Journalism Generation)
 * so that a complete article draft is created regardless.
 *
 * Protected by verifyAdminSession.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdminSession, AuthError } from "@/lib/auth/admin-authorization";
import { getEditorialJobById } from "@/lib/agent/editorial/jobs-repository";
import { executeSingleJobStage } from "@/lib/agent/editorial/engine";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { FactDossier } from "@/lib/agent/editorial/types";

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
      return NextResponse.json({ error: "Job is already completed." }, { status: 400 });
    }

    const workerToken = crypto.randomUUID();
    const admin = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const stageData = job.stage_data || {};
    const sources = stageData.extracted_docs || stageData.search_results || [];

    // Ensure a usable fact dossier exists and mark it as sufficient under editor override
    let dossier: FactDossier = stageData.dossier || {
      topic: job.topic,
      primary_entity: "Nepal Premier League",
      related_teams: [],
      related_players: [],
      claims: sources.map((s, idx) => ({
        id: `override_claim_${idx + 1}`,
        statement: s.snippet || s.title,
        source_urls: [s.url],
        source_type: s.authority_type || "secondary",
        verification_status: "verified",
        confidence: 0.85,
      })),
      key_quotes: [],
      verified_stats: {},
      conflicts: [],
      is_sufficient: true,
      sufficiency_reason: "Editor override: Proceeding to draft with available evidence.",
    };

    dossier = {
      ...dossier,
      is_sufficient: true,
      sufficiency_reason: "Editor override: Proceeding to draft with available evidence.",
      claims: dossier.claims.length > 0 ? dossier.claims.map((c) => ({
        ...c,
        verification_status: "verified" as const,
      })) : [
        {
          id: "override_claim_1",
          statement: job.topic,
          source_urls: sources.length > 0 ? [sources[0].url] : [],
          source_type: "secondary",
          verification_status: "verified",
          confidence: 0.85,
        },
      ],
    };

    // Advance to Stage 4 (Writing) and clear pause status
    const updatedStageData = {
      ...stageData,
      dossier,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("editorial_jobs")
      .update({
        current_stage: 4,
        status: "running",
        pause_reason: null,
        stage_data: updatedStageData,
        worker_token: workerToken,
        lock_acquired_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: `Failed to override job: ${updateErr.message}` }, { status: 500 });
    }

    const lockedJob = await getEditorialJobById(id);
    if (!lockedJob) {
      return NextResponse.json({ error: "Job disappeared." }, { status: 500 });
    }

    // Immediately execute Stage 4 (Article Journalism)
    const stepResult = await executeSingleJobStage(lockedJob, workerToken);
    const refreshedJob = await getEditorialJobById(id);

    return NextResponse.json({
      success: stepResult.status !== "failed",
      stepResult,
      job: refreshedJob,
    }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

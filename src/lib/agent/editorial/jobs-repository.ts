/**
 * NPL Hub Nepal — Editorial Jobs Repository
 *
 * Abstracted data access and atomic state-machine locking for editorial jobs.
 * Backed by Supabase `editorial_jobs` table.
 *
 * Implements:
 * - Atomic worker claim with lease duration and stale-lock recovery
 * - Lease extension (heartbeat)
 * - Safe stage transitions (Stages 1 through 7)
 * - Quota pause (`paused_quota_limit`) and verification pause (`paused_insufficient_evidence`)
 * - Failures and completion audit trail
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  EditorialJob,
  EditorialJobStatus,
  EditorialArticleType,
  PipelineStage,
  StageData,
  JobTelemetry,
} from "./types";

export interface CreateJobInput {
  topic: string;
  articleType: EditorialArticleType;
  targetKeyword?: string;
  createdBy?: string;
}

/**
 * Creates a new editorial job in 'pending' status at Stage 1.
 */
export async function createEditorialJob(
  input: CreateJobInput
): Promise<EditorialJob> {
  const admin = getSupabaseAdminClient();

  const newJob = {
    topic: input.topic.trim(),
    article_type: input.articleType,
    target_keyword: input.targetKeyword?.trim() || null,
    current_stage: 1,
    status: "pending",
    stage_data: {},
    telemetry: {
      total_tokens: 0,
      total_duration_ms: 0,
      cost_usd: 0,
      calls: [],
    },
    error_log: [],
    created_by: input.createdBy || "admin",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("editorial_jobs")
    .insert(newJob)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create editorial job: ${error.message}`);
  }

  return data as EditorialJob;
}

/**
 * Atomically claims the next pending or stale-locked job for a worker.
 * Lease duration defaults to 120 seconds.
 */
export async function claimNextJob(
  workerToken: string,
  leaseSeconds = 120
): Promise<EditorialJob | null> {
  const admin = getSupabaseAdminClient();
  const staleThreshold = new Date(Date.now() - leaseSeconds * 1000).toISOString();

  // 1. Find a candidate job (either 'pending', or 'running' with an expired lease)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: candidates, error: findError } = await (admin as any)
    .from("editorial_jobs")
    .select("*")
    .or(`status.eq.pending,and(status.eq.running,lock_acquired_at.lt.${staleThreshold})`)
    .order("created_at", { ascending: true })
    .limit(1);

  if (findError) {
    console.error("[claimNextJob] Error searching for candidate:", findError);
    return null;
  }

  if (!candidates || candidates.length === 0) {
    return null;
  }

  const candidate = candidates[0] as EditorialJob;
  const now = new Date().toISOString();

  // 2. Conditional atomic claim
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: claimed, error: claimError } = await (admin as any)
    .from("editorial_jobs")
    .update({
      status: "running",
      worker_token: workerToken,
      lock_acquired_at: now,
      updated_at: now,
    })
    .eq("id", candidate.id)
    // Concurrency guard: only update if still pending or still holds the candidate's stale timestamp
    .or(`status.eq.pending,lock_acquired_at.eq.${candidate.lock_acquired_at || "1970-01-01T00:00:00Z"}`)
    .select()
    .maybeSingle();

  if (claimError || !claimed) {
    // Another worker claimed it first
    return null;
  }

  return claimed as EditorialJob;
}

/**
 * Renews the lease lock for a job currently held by workerToken.
 */
export async function renewJobLock(
  jobId: string,
  workerToken: string
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("editorial_jobs")
    .update({
      lock_acquired_at: now,
      updated_at: now,
    })
    .eq("id", jobId)
    .eq("worker_token", workerToken)
    .select("id")
    .maybeSingle();

  return !error && Boolean(data);
}

/**
 * Updates stage data and advances to the next stage.
 */
export async function advanceJobStage(
  jobId: string,
  workerToken: string,
  nextStage: PipelineStage,
  stageData: Partial<StageData>,
  telemetryUpdates?: Partial<JobTelemetry>
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // Fetch current job to merge jsonb cleanly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await (admin as any)
    .from("editorial_jobs")
    .select("stage_data, telemetry")
    .eq("id", jobId)
    .single();

  const mergedStageData = {
    ...(current?.stage_data || {}),
    ...stageData,
  };

  const mergedTelemetry = {
    ...(current?.telemetry || { total_tokens: 0, total_duration_ms: 0, cost_usd: 0, calls: [] }),
    ...(telemetryUpdates || {}),
    cost_usd: 0, // Invariant: always strictly $0.00
  };

  if (telemetryUpdates?.calls && current?.telemetry?.calls) {
    mergedTelemetry.calls = [...current.telemetry.calls, ...telemetryUpdates.calls];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("editorial_jobs")
    .update({
      current_stage: nextStage,
      status: "running",
      stage_data: mergedStageData,
      telemetry: mergedTelemetry,
      lock_acquired_at: now,
      updated_at: now,
    })
    .eq("id", jobId)
    .eq("worker_token", workerToken);

  return !error;
}

/**
 * Pauses a job (either due to quota limits or insufficient verified evidence).
 */
export async function pauseEditorialJob(
  jobId: string,
  workerToken: string,
  pauseType: "paused_insufficient_evidence" | "paused_quota_limit",
  reason: string
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("editorial_jobs")
    .update({
      status: pauseType,
      pause_reason: reason,
      worker_token: null,
      lock_acquired_at: null,
      updated_at: now,
    })
    .eq("id", jobId)
    .eq("worker_token", workerToken);

  return !error;
}

/**
 * Marks a job as failed and appends error to error_log.
 */
export async function failEditorialJob(
  jobId: string,
  workerToken: string,
  errorMessage: string
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await (admin as any)
    .from("editorial_jobs")
    .select("error_log")
    .eq("id", jobId)
    .single();

  const newErrors = [...(current?.error_log || []), `[${now}] ${errorMessage}`];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("editorial_jobs")
    .update({
      status: "failed",
      error_log: newErrors,
      worker_token: null,
      lock_acquired_at: null,
      updated_at: now,
    })
    .eq("id", jobId)
    .eq("worker_token", workerToken);

  return !error;
}

/**
 * Completes a job at Stage 7 with draft article ID.
 */
export async function completeEditorialJob(
  jobId: string,
  workerToken: string,
  articleId: string,
  stageDataUpdates: Partial<StageData>,
  telemetryUpdates?: Partial<JobTelemetry>
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await (admin as any)
    .from("editorial_jobs")
    .select("stage_data, telemetry")
    .eq("id", jobId)
    .single();

  const mergedStageData = {
    ...(current?.stage_data || {}),
    ...stageDataUpdates,
    published_article_id: articleId,
  };

  const mergedTelemetry = {
    ...(current?.telemetry || {}),
    ...(telemetryUpdates || {}),
    cost_usd: 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("editorial_jobs")
    .update({
      current_stage: 7,
      status: "completed",
      article_id: articleId,
      stage_data: mergedStageData,
      telemetry: mergedTelemetry,
      worker_token: null,
      lock_acquired_at: null,
      updated_at: now,
    })
    .eq("id", jobId)
    .eq("worker_token", workerToken);

  return !error;
}

/**
 * Retrieves a single job by its ID.
 */
export async function getEditorialJobById(
  jobId: string
): Promise<EditorialJob | null> {
  const admin = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("editorial_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !data) return null;
  return data as EditorialJob;
}

/**
 * Lists jobs with optional filtering.
 */
export async function listEditorialJobs(options: {
  status?: EditorialJobStatus;
  limit?: number;
  offset?: number;
} = {}): Promise<{ jobs: EditorialJob[]; total: number }> {
  const admin = getSupabaseAdminClient();
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from("editorial_jobs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[listEditorialJobs] Error fetching jobs:", error);
    return { jobs: [], total: 0 };
  }

  return {
    jobs: (data || []) as EditorialJob[],
    total: count || 0,
  };
}

/**
 * Retries a paused or failed job by resetting it to a specific stage.
 */
export async function retryEditorialJob(
  jobId: string,
  targetStage: PipelineStage = 1
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("editorial_jobs")
    .update({
      current_stage: targetStage,
      status: "pending",
      pause_reason: null,
      error_log: [],
      worker_token: null,
      lock_acquired_at: null,
      updated_at: now,
    })
    .eq("id", jobId);

  return !error;
}

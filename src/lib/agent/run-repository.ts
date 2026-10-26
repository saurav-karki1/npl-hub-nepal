/**
 * NPL Hub Nepal — AI News Agent: Run Log Repository
 *
 * Server-only. Inserts agent_runs rows for audit and monitoring.
 * Uses the service-role client — never call from client components.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AgentRun, AgentRunStatus } from "./types";

const AGENT_ID = "news-agent";

/**
 * Persist a completed scan run to the agent_runs table.
 */
export async function insertAgentRun(run: {
  status: AgentRunStatus;
  sources_checked: number;
  items_found: number;
  items_saved: number;
  tokens_used: number;
  errors: string[];
}): Promise<{ error: string | null }> {
  const admin = getSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("agent_runs").insert({
    agent_id: AGENT_ID,
    status: run.status,
    sources_checked: run.sources_checked,
    items_found: run.items_found,
    items_saved: run.items_saved,
    tokens_used: run.tokens_used > 0 ? run.tokens_used : null,
    errors: run.errors,
    ran_at: new Date().toISOString(),
  });

  return { error: error?.message ?? null };
}

/**
 * Retrieve the most recent N run log entries for the admin panel.
 */
export async function getRecentAgentRuns(
  limit = 20
): Promise<AgentRun[]> {
  const admin = getSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("agent_runs")
    .select("*")
    .eq("agent_id", AGENT_ID)
    .order("ran_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AgentRun[];
}

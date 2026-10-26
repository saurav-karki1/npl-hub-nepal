/**
 * NPL Hub Nepal — AI News Agent: Configuration Repository
 *
 * Server-only. Reads and writes the agent_config singleton row.
 * Uses the service-role client — never call from client components.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AgentConfig, NewsSource } from "./types";

const AGENT_ID = "news-agent";
/** A run older than this is considered stale and the overlap lock is ignored. */
const STALE_LOCK_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Read the agent configuration row. Returns null if the row does not exist
 * (migration not yet applied).
 */
export async function getAgentConfig(): Promise<AgentConfig | null> {
  const admin = getSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("agent_config")
    .select("*")
    .eq("id", AGENT_ID)
    .maybeSingle();

  if (error || !data) return null;
  return data as AgentConfig;
}

/**
 * Partial update of the agent_config row.
 * Only provided fields are written; updated_at is always refreshed.
 */
export async function updateAgentConfig(
  fields: Partial<Omit<AgentConfig, "id" | "updated_at">>
): Promise<{ error: string | null }> {
  const admin = getSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("agent_config")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", AGENT_ID);

  return { error: error?.message ?? null };
}

/**
 * Attempt to acquire the overlap lock.
 * Returns true if the lock was acquired; false if a recent run is already active.
 */
export async function acquireRunLock(): Promise<boolean> {
  const config = await getAgentConfig();
  if (!config) return false;

  if (config.running_since) {
    const lockAge = Date.now() - new Date(config.running_since).getTime();
    if (lockAge < STALE_LOCK_MS) {
      return false; // Active lock — another run is in progress
    }
    // Stale lock — overwrite it
  }

  const { error } = await updateAgentConfig({
    running_since: new Date().toISOString(),
  });
  return error === null;
}

/**
 * Release the overlap lock and record the last run time.
 */
export async function releaseRunLock(): Promise<void> {
  await updateAgentConfig({
    running_since: null,
    last_run_at: new Date().toISOString(),
  });
}

/**
 * Convenience: return only the enabled sources from the config.
 */
export async function getEnabledSources(): Promise<NewsSource[]> {
  const config = await getAgentConfig();
  if (!config) return [];
  return (config.sources ?? []).filter((s) => s.enabled);
}

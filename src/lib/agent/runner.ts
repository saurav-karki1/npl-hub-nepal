/**
 * NPL Hub Nepal — AI News Agent: Execution Engine
 *
 * Encapsulates the complete scan-and-generate lifecycle so it can be invoked:
 * 1. By the external cron scheduler via /api/agent/news-scan (x-cron-secret)
 * 2. By an authorized admin via /api/admin/agent/trigger (Supabase Auth JWT)
 *
 * Server-only.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getAgentConfig,
  acquireRunLock,
  releaseRunLock,
} from "./config-repository";
import { insertAgentRun } from "./run-repository";
import { fetchGoogleNewsRss } from "./sources/google-news-rss";
import { deduplicateItems } from "./deduplication";
import { generateNewsArticleFromItem } from "./gemini-news-generator";
import { buildArticlePayload } from "./article-builder";
import type { FetchedItem, ScanSummary } from "./types";

const MAX_SAVES_PER_RUN = 3;

export interface RunAgentScanOptions {
  /** If true, runs even if agent_config.enabled is false (e.g. manual admin test) */
  ignoreDisabledState?: boolean;
}

export async function runAgentScan(
  options: RunAgentScanOptions = {}
): Promise<{
  success: boolean;
  summary?: ScanSummary;
  error?: string;
  statusCode: number;
}> {
  const runStart = Date.now();
  const errors: string[] = [];
  let sourcesChecked = 0;
  let itemsFound = 0;
  let itemsSaved = 0;
  let tokensUsed = 0;

  // 1. Read agent config
  const config = await getAgentConfig();
  if (!config) {
    return {
      success: false,
      error:
        "agent_config table not found. Run the database migration first: supabase/migrations/20261023000000_ai_news_agent.sql",
      statusCode: 503,
    };
  }

  // 2. Check enabled state
  if (!config.enabled && !options.ignoreDisabledState) {
    return {
      success: true,
      error: "Agent is disabled. Enable it from /admin/agent to run scans.",
      statusCode: 200,
    };
  }

  // 3. Acquire overlap lock
  const lockAcquired = await acquireRunLock();
  if (!lockAcquired) {
    return {
      success: false,
      error: "A scan is already in progress. Try again in a few minutes.",
      statusCode: 409,
    };
  }

  try {
    // 4. Fetch from enabled sources
    const enabledSources = (config.sources ?? []).filter((s) => s.enabled);
    const allFetchedItems: FetchedItem[] = [];

    for (const source of enabledSources) {
      sourcesChecked++;

      if (source.type === "google-news-rss") {
        const { items, error } = await fetchGoogleNewsRss(source);
        if (error) {
          errors.push(`[${source.id}] ${error}`);
        }
        allFetchedItems.push(...items);
      } else {
        errors.push(`[${source.id}] Unsupported source type: ${source.type}`);
      }
    }

    itemsFound = allFetchedItems.length;

    // 5. Deduplicate
    const { unseen } = await deduplicateItems(allFetchedItems);

    // 6. Generate articles for unseen items (up to MAX_SAVES_PER_RUN)
    const admin = getSupabaseAdminClient();
    const candidates = unseen.slice(0, MAX_SAVES_PER_RUN);

    for (const item of candidates) {
      // Buffer before Vercel max duration (300s)
      if (Date.now() - runStart > 265_000) {
        errors.push("Approaching function timeout — remaining items deferred to next run.");
        break;
      }

      const { success, result, error: genError } =
        await generateNewsArticleFromItem(item);

      if (!success || !result) {
        errors.push(
          `[generate] "${item.title.slice(0, 60)}": ${genError ?? "Unknown error"}`
        );
        continue;
      }

      tokensUsed += result.tokensUsed;

      // 7. Build and insert draft article
      const payload = buildArticlePayload(
        result.title,
        result.excerpt,
        result.category,
        result.blocks,
        item
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await (admin as any)
        .from("news_articles")
        .insert({
          id: payload.id,
          slug: payload.slug,
          title: payload.title,
          excerpt: payload.excerpt,
          content: payload.content,
          category: payload.category,
          status: payload.status,
          featured: payload.featured,
          author: payload.author,
          author_role: payload.author_role,
          read_time: payload.read_time,
          tags: payload.tags,
          source: payload.source,
          source_url: payload.source_url,
          published_at: payload.published_at,
          updated_at: payload.published_at,
          created_at: payload.published_at,
          ai_generated: payload.ai_generated,
        });

      if (insertErr) {
        if (insertErr.message?.includes("unique") || insertErr.code === "23505") {
          errors.push(`[insert] Slug conflict for "${payload.slug}" — skipped.`);
        } else {
          errors.push(
            `[insert] "${payload.title.slice(0, 60)}": ${insertErr.message}`
          );
        }
        continue;
      }

      itemsSaved++;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected engine error";
    errors.push(`[engine] ${msg}`);
  } finally {
    // 8. Always release the lock
    await releaseRunLock();
  }

  // 9. Determine overall status
  const status =
    errors.length === 0
      ? "success"
      : itemsSaved > 0
      ? "partial"
      : "error";

  // 10. Log the run
  await insertAgentRun({
    status,
    sources_checked: sourcesChecked,
    items_found: itemsFound,
    items_saved: itemsSaved,
    tokens_used: tokensUsed,
    errors,
  });

  const summary: ScanSummary = {
    provider: "google-news-rss",
    timestamp: new Date().toISOString(),
    sourcesChecked,
    itemsFound,
    itemsSaved,
    tokensUsed,
    errors,
    status,
  };

  return {
    success: status !== "error",
    summary,
    statusCode: 200,
  };
}

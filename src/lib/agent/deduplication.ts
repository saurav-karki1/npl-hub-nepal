/**
 * NPL Hub Nepal — AI News Agent: Deduplication
 *
 * Checks fetched items against existing news_articles rows to prevent
 * duplicate article generation. Two signals are used:
 *
 * 1. Exact source_url match — the same article URL was already processed.
 * 2. Title similarity — a very similar headline already exists (catches
 *    minor wording variations from different RSS feeds about the same event).
 *
 * Uses the service-role client to query all articles (including drafts).
 * Server-only.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { FetchedItem } from "./types";

/**
 * Normalise a title for fuzzy comparison:
 * lowercase, remove punctuation, collapse whitespace.
 */
function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute word-overlap similarity between two normalised strings.
 * Returns a value between 0 (no overlap) and 1 (identical word sets).
 */
function wordOverlapSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(" ").filter((w) => w.length > 3));
  const wordsB = new Set(b.split(" ").filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) overlap++;
  });
  return overlap / Math.max(wordsA.size, wordsB.size);
}

const TITLE_SIMILARITY_THRESHOLD = 0.65;

/**
 * Filter out items whose source_url or title already appears in the database.
 * Returns only genuinely new, unseen items.
 */
export async function deduplicateItems(
  items: FetchedItem[]
): Promise<{ unseen: FetchedItem[]; duplicateCount: number }> {
  if (items.length === 0) return { unseen: [], duplicateCount: 0 };

  const admin = getSupabaseAdminClient();

  // Fetch existing source_urls and titles from all articles (published + draft)
  // Only need these two columns for dedup — keep the query lightweight.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("news_articles")
    .select("source_url, title")
    .order("created_at", { ascending: false })
    .limit(500); // Check last 500 articles — sufficient for dedup

  if (error || !data) {
    // On error, conservatively pass all items through (log nothing silently)
    return { unseen: items, duplicateCount: 0 };
  }

  const existingUrls = new Set<string>(
    (data as { source_url: string | null; title: string }[])
      .map((r) => r.source_url)
      .filter(Boolean) as string[]
  );

  const existingNormalisedTitles = (
    data as { source_url: string | null; title: string }[]
  ).map((r) => normaliseTitle(r.title));

  const unseen: FetchedItem[] = [];
  let duplicateCount = 0;

  for (const item of items) {
    // 1. Exact URL match
    if (item.sourceUrl && existingUrls.has(item.sourceUrl)) {
      duplicateCount++;
      continue;
    }

    // 2. Title similarity match
    const normItem = normaliseTitle(item.title);
    const isSimilar = existingNormalisedTitles.some(
      (existingTitle) =>
        wordOverlapSimilarity(normItem, existingTitle) >= TITLE_SIMILARITY_THRESHOLD
    );

    if (isSimilar) {
      duplicateCount++;
      continue;
    }

    unseen.push(item);
  }

  return { unseen, duplicateCount };
}

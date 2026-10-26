/**
 * NPL Hub Nepal — AI News Agent: Google News RSS Source
 *
 * Fetches the Google News RSS feed for a given search query and returns
 * normalized FetchedItem objects. No authentication required.
 *
 * Feed URL format:
 *   https://news.google.com/rss/search?q=<encoded_query>&hl=en-IN&gl=IN&ceid=IN:en
 *
 * Notes:
 * - Google News RSS is an unofficial but stable endpoint.
 * - Items are returned newest-first.
 * - Titles and descriptions may contain HTML entities — these are decoded.
 * - A hard timeout of 8 seconds is applied per fetch.
 */

import type { FetchedItem, NewsSource } from "../types";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_ITEMS_PER_SOURCE = 10;

/**
 * Decode common HTML entities from RSS text fields.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Strip HTML tags from a string (for RSS description fields).
 */
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}

/**
 * Extract text content between XML tags (simple, no external parser needed).
 * Returns the first match or an empty string.
 */
function extractTag(xml: string, tag: string): string {
  // Handle both <tag>content</tag> and CDATA sections
  const cdataMatch = xml.match(
    new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i")
  );
  if (cdataMatch) return cdataMatch[1].trim();

  const plainMatch = xml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  );
  return plainMatch ? plainMatch[1].trim() : "";
}

/**
 * Extract the source publisher name from a Google News RSS <source> element.
 * Falls back to hostname parsing of the link if not present.
 */
function extractSourceName(itemXml: string, link: string): string {
  const sourceMatch = itemXml.match(/<source[^>]*>([^<]+)<\/source>/i);
  if (sourceMatch) return decodeHtmlEntities(sourceMatch[1]);

  try {
    const hostname = new URL(link).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return "Unknown source";
  }
}

/**
 * Extract all <item> blocks from an RSS XML string.
 */
function extractItems(xml: string): string[] {
  const items: string[] = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

/**
 * Fetch and parse Google News RSS for the given source configuration.
 * Returns an array of normalized FetchedItem objects, newest first.
 * Never throws — returns an empty array with an error message on failure.
 */
export async function fetchGoogleNewsRss(
  source: NewsSource
): Promise<{ items: FetchedItem[]; error: string | null }> {
  if (!source.query) {
    return { items: [], error: `Source "${source.id}" has no query configured.` };
  }

  const encodedQuery = encodeURIComponent(source.query);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-IN&gl=IN&ceid=IN:en`;

  let xml: string;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Identify ourselves as a news aggregator bot
        "User-Agent": "NPLHubNepal-NewsAgent/1.0 (+https://nplhubnepal.vercel.app)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        items: [],
        error: `Google News RSS returned HTTP ${response.status} for query "${source.query}".`,
      };
    }

    xml = await response.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    return {
      items: [],
      error: `Failed to fetch Google News RSS for "${source.query}": ${msg}`,
    };
  }

  // Parse items from the RSS XML
  const rawItems = extractItems(xml).slice(0, MAX_ITEMS_PER_SOURCE);

  const parsed: FetchedItem[] = [];
  for (const itemXml of rawItems) {
    try {
      const title = decodeHtmlEntities(extractTag(itemXml, "title"));
      const link = decodeHtmlEntities(extractTag(itemXml, "link")).trim();
      const description = stripHtml(
        decodeHtmlEntities(extractTag(itemXml, "description"))
      );
      const pubDate = extractTag(itemXml, "pubDate");
      const sourceName = extractSourceName(itemXml, link);

      // Skip items with no title or link — malformed entries
      if (!title || !link) continue;

      // Skip items that are clearly not about NPL / Nepal cricket
      const combined = (title + " " + description).toLowerCase();
      const relevantTerms = [
        "nepal",
        "npl",
        "nepal premier league",
        "cricket",
        "t20",
        "rohit paudel",
        "sandeep lamichhane",
        "janakpur",
        "lumbini",
        "kathmandu",
        "biratnagar",
        "chitwan",
        "pokhara",
        "karnali",
        "sudurpaschim",
      ];
      const isRelevant = relevantTerms.some((term) => combined.includes(term));
      if (!isRelevant) continue;

      parsed.push({
        title,
        snippet: description || title,
        sourceUrl: link,
        publishedAt: pubDate,
        sourceName,
        sourceId: source.id,
      });
    } catch {
      // Skip malformed individual items silently
    }
  }

  return { items: parsed, error: null };
}

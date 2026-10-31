/**
 * NPL Hub Nepal — Tavily Search & Extraction Provider
 *
 * Provides research discovery and page text extraction for the editorial pipeline.
 * Strict $0.00 zero-cost policy: 1,000 monthly free credits, no credit card.
 *
 * If credits or rate limits are reached (HTTP 429 / 402 / 403), throws
 * QuotaExceededError so the job safely pauses with `paused_quota_limit`.
 */

import { QuotaExceededError, type SourceDocument } from "../editorial/types";

const PRIMARY_DOMAINS = [
  "cricketnepal.org.np",
  "can.org.np",
  "icc-cricket.com",
];

const REPUTABLE_SECONDARY_DOMAINS = [
  "espncricinfo.com",
  "cricbuzz.com",
  "thekathmandupost.com",
  "kathmandupost.com",
  "myrepublica.nagariknetwork.com",
  "onlinekhabar.com",
  "english.onlinekhabar.com",
  "hamrokhelkud.net",
  "cricnepal.com",
  "setopati.com",
  "ratopati.com",
  "nepalnews.com",
];

function classifyAuthority(domain: string): "primary" | "secondary" | "rumor" {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, "");
  if (PRIMARY_DOMAINS.some((p) => cleanDomain.includes(p))) {
    return "primary";
  }
  if (REPUTABLE_SECONDARY_DOMAINS.some((s) => cleanDomain.includes(s))) {
    return "secondary";
  }
  return "rumor";
}

function extractDomain(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname;
  } catch {
    return "unknown";
  }
}

export interface TavilySearchOptions {
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
}

export async function searchTavily(
  query: string,
  options: TavilySearchOptions = {}
): Promise<{ documents: SourceDocument[]; latencyMs: number }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY environment variable is not configured.");
  }

  const startTime = Date.now();
  const maxResults = options.maxResults ?? 5;
  const searchDepth = options.searchDepth ?? "basic";

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
      ...(options.includeDomains ? { include_domains: options.includeDomains } : {}),
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (response.status === 429 || response.status === 402) {
    const text = await response.text();
    throw new QuotaExceededError("tavily", `HTTP ${response.status}: ${text}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (
      errorText.toLowerCase().includes("quota") ||
      errorText.toLowerCase().includes("credit") ||
      errorText.toLowerCase().includes("limit")
    ) {
      throw new QuotaExceededError("tavily", errorText);
    }
    throw new Error(`Tavily search request failed (${response.status}): ${errorText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await response.json();
  const rawResults = Array.isArray(json.results) ? json.results : [];

  const documents: SourceDocument[] = rawResults.map((r: {
    url: string;
    title?: string;
    content?: string;
    published_date?: string;
  }) => {
    const domain = extractDomain(r.url);
    return {
      url: r.url,
      title: r.title || "Untitled Source",
      snippet: r.content || "",
      domain,
      published_date: r.published_date,
      authority_type: classifyAuthority(domain),
    };
  });

  return { documents, latencyMs };
}

export async function extractTavily(
  urls: string[]
): Promise<{ documents: SourceDocument[]; latencyMs: number }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY environment variable is not configured.");
  }

  if (!urls.length) {
    return { documents: [], latencyMs: 0 };
  }

  const startTime = Date.now();
  // Limit to max 5 URLs per extract call to conserve credits
  const targetUrls = urls.slice(0, 5);

  const response = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      urls: targetUrls,
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (response.status === 429 || response.status === 402) {
    const text = await response.text();
    throw new QuotaExceededError("tavily", `HTTP ${response.status}: ${text}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (
      errorText.toLowerCase().includes("quota") ||
      errorText.toLowerCase().includes("credit") ||
      errorText.toLowerCase().includes("limit")
    ) {
      throw new QuotaExceededError("tavily", errorText);
    }
    throw new Error(`Tavily extract request failed (${response.status}): ${errorText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await response.json();
  const rawResults = Array.isArray(json.results) ? json.results : [];

  const documents: SourceDocument[] = rawResults.map((r: {
    url: string;
    raw_content?: string;
  }) => {
    const domain = extractDomain(r.url);
    // Truncate raw content to 6,000 chars to avoid prompt bloat
    const cleanContent = (r.raw_content || "").slice(0, 6000);
    return {
      url: r.url,
      title: `Extracted: ${domain}`,
      raw_content: cleanContent,
      snippet: cleanContent.slice(0, 300),
      domain,
      authority_type: classifyAuthority(domain),
    };
  });

  return { documents, latencyMs };
}

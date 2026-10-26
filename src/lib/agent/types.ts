/**
 * NPL Hub Nepal — AI News Agent: TypeScript Contracts
 *
 * Shared types for the agent configuration, run logs, fetched source
 * items, and generated article drafts. Server-side only.
 */

// ---------------------------------------------------------------------------
// Source configuration
// ---------------------------------------------------------------------------

export type NewsSourceType = "google-news-rss";

export interface NewsSource {
  id: string;
  name: string;
  type: NewsSourceType;
  /** For google-news-rss: the search query string */
  query?: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Agent configuration (mirrors the agent_config table row)
// ---------------------------------------------------------------------------

export interface AgentConfig {
  id: string;
  enabled: boolean;
  interval_hours: number;
  sources: NewsSource[];
  auto_publish: boolean;
  running_since: string | null;
  last_run_at: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Run log (mirrors the agent_runs table row)
// ---------------------------------------------------------------------------

export type AgentRunStatus = "success" | "partial" | "error";

export interface AgentRun {
  id: string;
  agent_id: string;
  status: AgentRunStatus;
  sources_checked: number;
  items_found: number;
  items_saved: number;
  tokens_used: number | null;
  errors: string[];
  ran_at: string;
}

// ---------------------------------------------------------------------------
// Fetched item from an external source
// ---------------------------------------------------------------------------

export interface FetchedItem {
  /** The original article headline / title from the source */
  title: string;
  /** Short description or excerpt from the RSS entry */
  snippet: string;
  /** Canonical URL of the source article */
  sourceUrl: string;
  /** Publication date string from the feed (may be empty) */
  publishedAt: string;
  /** Human-readable source name (e.g. "ESPN Cricinfo") */
  sourceName: string;
  /** Which agent source produced this item */
  sourceId: string;
}

// ---------------------------------------------------------------------------
// Scan result returned by the scan route
// ---------------------------------------------------------------------------

export interface ScanSummary {
  provider: string;
  timestamp: string;
  sourcesChecked: number;
  itemsFound: number;
  itemsSaved: number;
  tokensUsed: number;
  errors: string[];
  status: AgentRunStatus;
}

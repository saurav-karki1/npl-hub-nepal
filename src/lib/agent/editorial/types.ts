/**
 * NPL Hub Nepal — Multi-Provider AI Editorial System Types
 *
 * Core domain types and interfaces for the autonomous editorial pipeline:
 * - 11 Cricket Article Types
 * - 6 Unified Job Statuses
 * - 7 Sequential Pipeline Stages
 * - Fact Dossier & Evidence Verification Matrix
 * - Zero-Cost Policy telemetry guarantees
 */

import type { ArticleBlock } from "@/lib/types/article-blocks";
import type { NewsCategory } from "@/lib/data/news-data";

export type EditorialArticleType =
  | "breaking_news"
  | "tournament_news"
  | "match_preview"
  | "match_report"
  | "match_analysis"
  | "team_news"
  | "player_news"
  | "squad_analysis"
  | "points_table_update"
  | "official_announcement"
  | "feature_story";

export type ArticleLength =
  | "short"           // 300 - 500 words (breaking news, short announcement, points update)
  | "standard"        // 500 - 800 words (standard match report, team news)
  | "comprehensive"   // 800 - 1,200 words (deep match analysis, preview, tactical breakdown)
  | "longform";       // 1,200 - 1,800+ words (investigative feature, tournament retrospective)

export type EditorialJobStatus =
  | "pending"
  | "running"
  | "paused_insufficient_evidence"
  | "paused_quota_limit"
  | "failed"
  | "completed";

export type PipelineStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface SourceDocument {
  url: string;
  title: string;
  snippet?: string;
  raw_content?: string;
  domain: string;
  published_date?: string;
  authority_type: "primary" | "secondary" | "rumor";
}

export interface FactClaim {
  id: string;
  statement: string;
  source_urls: string[];
  source_type: "primary" | "secondary" | "rumor";
  verification_status: "verified" | "unverified" | "conflicting";
  confidence: number; // 0.0 - 1.0
  conflict_details?: string;
}

export interface FactDossier {
  topic: string;
  primary_entity: string;
  related_teams: string[];
  related_players: string[];
  claims: FactClaim[];
  key_quotes: Array<{ speaker: string; quote: string; source_url?: string }>;
  verified_stats: Record<string, string | number>;
  conflicts: string[];
  is_sufficient: boolean;
  sufficiency_reason?: string;
}

export interface GeneratedArticleDraft {
  title: string;
  excerpt: string;
  category: NewsCategory;
  blocks: ArticleBlock[];
  word_count: number;
  read_time: string;
  suggested_tags: string[];
  team_ids: string[];
}

export interface SeoMetadataDraft {
  focus_keyword: string;
  secondary_keywords: string[];
  meta_title: string;
  meta_description: string;
  internal_links_injected: number;
}

export interface ImageResult {
  image_url: string;
  image_alt: string;
  image_caption: string;
  is_fallback: boolean;
  generator_used: "cloudflare-flux" | "local-sharp-svg";
}

export interface ProviderCallTelemetry {
  provider: "tavily" | "groq" | "gemini" | "cloudflare" | "sharp";
  operation: string;
  model_id: string;
  tokens_input?: number;
  tokens_output?: number;
  cost_usd: 0; // Strictly 0.00 zero-cost policy
  latency_ms: number;
  timestamp: string;
}

export interface JobTelemetry {
  total_tokens: number;
  total_duration_ms: number;
  cost_usd: 0; // Always 0.00
  calls: ProviderCallTelemetry[];
}

export interface StageData {
  target_length?: ArticleLength;
  search_results?: SourceDocument[];
  extracted_docs?: SourceDocument[];
  dossier?: FactDossier;
  draft?: GeneratedArticleDraft;
  seo?: SeoMetadataDraft;
  image?: ImageResult;
  published_article_id?: string;
}

export interface EditorialJob {
  id: string;
  topic: string;
  article_type: EditorialArticleType;
  target_keyword?: string | null;
  target_length?: ArticleLength;
  current_stage: PipelineStage;
  status: EditorialJobStatus;
  worker_token?: string | null;
  lock_acquired_at?: string | null;
  pause_reason?: string | null;
  stage_data: StageData;
  telemetry: JobTelemetry;
  error_log: string[];
  article_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Error thrown when a provider's free quota or rate limit is reached */
export class QuotaExceededError extends Error {
  public readonly provider: "tavily" | "groq" | "gemini" | "cloudflare";
  constructor(provider: "tavily" | "groq" | "gemini" | "cloudflare", message: string) {
    super(`[${provider.toUpperCase()} Quota Limit] ${message}`);
    this.name = "QuotaExceededError";
    this.provider = provider;
  }
}

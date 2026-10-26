/**
 * NPL Hub Nepal — AI News Agent: Article Builder
 *
 * Assembles a complete CreateNewsInput-compatible payload from the
 * Gemini-generated result and the original fetched item metadata.
 *
 * Produces deterministic IDs and slugs that are collision-safe and
 * pass the existing news_articles unique slug constraint.
 *
 * Server-only.
 */

import type { FetchedItem } from "./types";
import type { ArticleBlock } from "@/lib/types/article-blocks";

type NewsCategory =
  | "Tournament"
  | "Teams"
  | "Matches"
  | "Points Table"
  | "Announcements";

export interface AgentArticlePayload {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: { blocks: ArticleBlock[] };
  category: NewsCategory;
  status: "draft";
  featured: boolean;
  author: string;
  author_role: string;
  read_time: string;
  tags: string[];
  source: string;
  source_url: string;
  published_at: string;
  ai_generated: true;
  teamIds: string[];
}

/**
 * Convert a string to a URL-safe kebab-case slug.
 */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Estimate read time from block content.
 * Average reading speed: 200 words per minute.
 */
function estimateReadTime(blocks: ArticleBlock[]): string {
  const wordCount = blocks
    .map((b) => {
      if (b.type === "paragraph" || b.type === "heading") return b.text ?? "";
      if (b.type === "list") return (b.items ?? []).join(" ");
      return "";
    })
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

/**
 * Assemble a complete article payload ready for insertion into news_articles.
 * The ID and slug include a short timestamp suffix to guarantee uniqueness
 * even if two articles with similar titles are generated in the same run.
 */
export function buildArticlePayload(
  generatedTitle: string,
  generatedExcerpt: string,
  generatedCategory: NewsCategory,
  generatedBlocks: ArticleBlock[],
  sourceItem: FetchedItem
): AgentArticlePayload {
  const now = new Date();
  const timestampSuffix = now.getTime().toString(36); // e.g. "lm3x9f"

  const baseSlug = toSlug(generatedTitle);
  const slug = `${baseSlug}-${timestampSuffix}`;
  const id = slug; // Use slug as ID (consistent with existing news articles pattern)

  return {
    id,
    slug,
    title: generatedTitle,
    excerpt: generatedExcerpt,
    content: { blocks: generatedBlocks },
    category: generatedCategory,
    status: "draft",
    featured: false,
    author: "NPL Hub Nepal AI Agent",
    author_role: "AI-generated draft — requires editorial review",
    read_time: estimateReadTime(generatedBlocks),
    tags: ["ai-generated", "draft"],
    source: sourceItem.sourceName,
    source_url: sourceItem.sourceUrl,
    published_at: now.toISOString(),
    ai_generated: true,
    teamIds: [], // No team relations assigned by the agent — editor adds them on review
  };
}

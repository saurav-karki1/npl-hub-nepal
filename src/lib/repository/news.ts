/**
 * NPL Hub Nepal — News Repository
 *
 * Abstracted data access layer for editorial news, announcements, and coverage.
 * Primary source: Supabase database (`news_articles` & `news_team_relations` tables).
 * Fallback source: Centralized static data (`news-data.ts`).
 *
 * Admin write functions call the secure /api/admin/news API route
 * (server-side, service-role key) — never Supabase directly from UI.
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  NEWS_ARTICLES,
  NewsArticle,
  NewsCategory,
  ArticleStatus,
  getAllArticles as getAllArticlesData,
  getArticleBySlug as getArticleBySlugData,
  getFeaturedArticles as getFeaturedArticlesData,
  getArticlesByCategory as getArticlesByCategoryData,
  getLatestArticles as getLatestArticlesData,
  getAllArticleSlugs as getAllArticleSlugsData,
  getArticlesByTeam as getArticlesByTeamData,
  getAvailableCategories as getAvailableCategoriesData,
} from "@/lib/data/news-data";

export type { NewsArticle, NewsCategory, ArticleStatus };
export { NEWS_ARTICLES };

// ---------------------------------------------------------------------------
// Admin-specific types (Phase 5F)
// ---------------------------------------------------------------------------

export interface AdminNewsTeamRelation {
  id: string;
  team_id: string;
}

export interface AdminNewsRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: NewsCategory;
  status: ArticleStatus;
  featured: boolean;
  image_url: string | null;
  author: string;
  author_role: string;
  read_time: string;
  tags: string[];
  source: string | null;
  source_url: string | null;
  published_at: string;
  updated_at: string;
  created_at: string;
  news_team_relations: AdminNewsTeamRelation[];
}

export interface CreateNewsInput {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: NewsCategory;
  status: ArticleStatus;
  featured: boolean;
  image_url?: string | null;
  author: string;
  author_role: string;
  read_time: string;
  tags: string[];
  source?: string | null;
  source_url?: string | null;
  published_at?: string;
  teamIds: string[];
}

export interface UpdateNewsInput {
  id: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string[];
  category?: NewsCategory;
  status?: ArticleStatus;
  featured?: boolean;
  image_url?: string | null;
  author?: string;
  author_role?: string;
  read_time?: string;
  tags?: string[];
  source?: string | null;
  source_url?: string | null;
  published_at?: string;
  teamIds?: string[];
}

// ---------------------------------------------------------------------------
// Admin repository functions (Phase 5F)
// ---------------------------------------------------------------------------

/**
 * Fetch ALL news articles (published + draft) for the admin panel.
 * Calls the secure /api/admin/news route (service-role server-side).
 */
export async function getAllNewsAdmin(
  accessToken: string
): Promise<{ articles: AdminNewsRow[]; error: string | null }> {
  try {
    const res = await fetch("/api/admin/news", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { articles: [], error: json.error ?? "Failed to fetch articles." };
    }
    return { articles: json.articles ?? [], error: null };
  } catch {
    return { articles: [], error: "Network error fetching news articles." };
  }
}

/**
 * Create a new news article.
 * Calls POST /api/admin/news (service-role server-side).
 */
export async function createNewsAdmin(
  input: CreateNewsInput,
  accessToken: string
): Promise<{ article: AdminNewsRow | null; error: string | null }> {
  try {
    const res = await fetch("/api/admin/news", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) {
      return { article: null, error: json.error ?? "Failed to create article." };
    }
    return { article: json.article ?? null, error: null };
  } catch {
    return { article: null, error: "Network error creating news article." };
  }
}

/**
 * Update an existing news article (including team relations replacement).
 * Calls PUT /api/admin/news (service-role server-side).
 */
export async function updateNewsAdmin(
  input: UpdateNewsInput,
  accessToken: string
): Promise<{ article: AdminNewsRow | null; error: string | null }> {
  try {
    const res = await fetch("/api/admin/news", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) {
      return { article: null, error: json.error ?? "Failed to update article." };
    }
    return { article: json.article ?? null, error: null };
  } catch {
    return { article: null, error: "Network error updating news article." };
  }
}

/** Synchronous fallbacks for backwards compatibility */
export const getAllArticlesSync = getAllArticlesData;
export const getArticleBySlugSync = getArticleBySlugData;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseArticle(row: any): NewsArticle {
  const publishedDate = new Date(row.published_at);
  const displayDate = isNaN(publishedDate.getTime())
    ? "25 Sep 2026"
    : publishedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const relatedTeamIds = Array.isArray(row.news_team_relations)
    ? row.news_team_relations.map((r: { team_id: string }) => r.team_id)
    : undefined;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: Array.isArray(row.content) ? row.content : [String(row.content)],
    category: row.category as NewsCategory,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    featured: row.featured,
    imageUrl: row.image_url ?? undefined,
    author: row.author,
    source: row.source ?? "NPL Hub Nepal Editorial",
    relatedTeamIds: relatedTeamIds && relatedTeamIds.length > 0 ? relatedTeamIds : undefined,
    status: row.status as ArticleStatus,
    readTime: row.read_time ?? "3 min read",
    displayDate,
  };
}

/**
 * Retrieve all published news articles from Supabase (with static fallback)
 */
export async function getAllArticles(): Promise<NewsArticle[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("news_articles")
        .select("*, news_team_relations(team_id)")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseArticle);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getAllArticlesData();
}

/**
 * Retrieve an article by its URL slug from Supabase (with static fallback)
 */
export async function getArticleBySlug(slug: string): Promise<NewsArticle | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("news_articles")
        .select("*, news_team_relations(team_id)")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseArticle(data);
      }
    } catch {
      // Fall back to static dataset on error
    }
  }
  return getArticleBySlugData(slug);
}

/**
 * Get all article slugs for Next.js generateStaticParams.
 * Always merges static slugs with Supabase slugs so that locally-defined
 * articles are pre-rendered even when Supabase is the primary data source.
 */
export async function getAllArticleSlugs(): Promise<{ slug: string }[]> {
  // Static slugs are always the source of truth for generateStaticParams
  const staticSlugs = getAllArticleSlugsData();

  if (!isSupabaseConfigured()) {
    return staticSlugs;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("news_articles")
      .select("slug")
      .eq("status", "published");

    if (!error && data && data.length > 0) {
      // Merge: static slugs + Supabase slugs (deduplicated)
      const seen = new Set(staticSlugs.map((s) => s.slug));
      const extra = data
        .map((r: { slug: string }) => ({ slug: r.slug }))
        .filter((s: { slug: string }) => !seen.has(s.slug));
      return [...staticSlugs, ...extra];
    }
  } catch {
    // Fall back to static slugs only
  }

  return staticSlugs;
}

/**
 * Get featured editorial articles
 */
export async function getFeaturedArticles(): Promise<NewsArticle[]> {
  const articles = await getAllArticles();
  return articles.filter((a) => a.featured);
}

/**
 * Filter articles by category
 */
export async function getArticlesByCategory(category: NewsCategory): Promise<NewsArticle[]> {
  const articles = await getAllArticles();
  return articles.filter((a) => a.category === category);
}

/**
 * Get latest articles up to a limit
 */
export async function getLatestArticles(limit: number = 4): Promise<NewsArticle[]> {
  const articles = await getAllArticles();
  return articles.slice(0, limit);
}

/**
 * Get articles related to a specific team ID
 */
export async function getArticlesByTeam(teamId: string): Promise<NewsArticle[]> {
  const articles = await getAllArticles();
  return articles.filter((a) => a.relatedTeamIds?.includes(teamId));
}

/**
 * Get all available news categories with articles
 */
export async function getAvailableCategories(): Promise<NewsCategory[]> {
  const articles = await getAllArticles();
  const categories = new Set<NewsCategory>();
  articles.forEach((a) => categories.add(a.category));
  return Array.from(categories);
}

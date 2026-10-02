/**
 * NPL Hub Nepal — News Repository
 *
 * Abstracted data access layer for editorial news, announcements, and coverage.
 * Primary source: Supabase database (`news_articles` & `news_team_relations` tables).
 * Fallback source: Centralized static data (`news-data.ts`).
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
 * Get all article slugs for Next.js generateStaticParams
 */
export async function getAllArticleSlugs(): Promise<{ slug: string }[]> {
  const articles = await getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
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

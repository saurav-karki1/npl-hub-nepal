/**
 * NPL Hub Nepal — News Repository
 *
 * Abstracted data access layer for editorial news, announcements, and coverage.
 * Public components consume this repository instead of direct static file imports.
 */

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

/**
 * Retrieve all news articles
 */
export function getAllArticles(): NewsArticle[] {
  return getAllArticlesData();
}

/**
 * Retrieve an article by its URL slug
 */
export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return getArticleBySlugData(slug);
}

/**
 * Get all article slugs for Next.js generateStaticParams
 */
export function getAllArticleSlugs(): { slug: string }[] {
  return getAllArticleSlugsData();
}

/**
 * Get featured editorial articles
 */
export function getFeaturedArticles(): NewsArticle[] {
  return getFeaturedArticlesData();
}

/**
 * Filter articles by category
 */
export function getArticlesByCategory(category: NewsCategory): NewsArticle[] {
  return getArticlesByCategoryData(category);
}

/**
 * Get latest articles up to a limit
 */
export function getLatestArticles(limit: number = 4): NewsArticle[] {
  return getLatestArticlesData(limit);
}

/**
 * Get articles related to a specific team ID
 */
export function getArticlesByTeam(teamId: string): NewsArticle[] {
  return getArticlesByTeamData(teamId);
}

/**
 * Get all available news categories with articles
 */
export function getAvailableCategories(): NewsCategory[] {
  return getAvailableCategoriesData();
}

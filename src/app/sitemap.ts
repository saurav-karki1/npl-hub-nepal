import type { MetadataRoute } from "next";
import { getAllMatchSlugs } from "@/lib/repository/matches";
import { getAllTeams } from "@/lib/repository/teams";
import { getAllPlayerSlugs } from "@/lib/repository/players";
import { getAllArticleSlugs } from "@/lib/repository/news";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/points-table`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/players`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const teams = await getAllTeams();
  const teamRoutes: MetadataRoute.Sitemap = teams.map((team) => ({
    url: `${baseUrl}/teams/${team.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const matchSlugs = await getAllMatchSlugs();
  const matchRoutes: MetadataRoute.Sitemap = matchSlugs.map(
    ({ slug }) => ({
      url: `${baseUrl}/matches/${slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  const playerSlugs = await getAllPlayerSlugs();
  const playerRoutes: MetadataRoute.Sitemap = playerSlugs.map(
    ({ slug }) => ({
      url: `${baseUrl}/players/${slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  const articleSlugs = await getAllArticleSlugs();
  const newsRoutes: MetadataRoute.Sitemap = articleSlugs.map(
    ({ slug }) => ({
      url: `${baseUrl}/news/${slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  return [
    ...staticRoutes,
    ...teamRoutes,
    ...matchRoutes,
    ...playerRoutes,
    ...newsRoutes,
  ];
}

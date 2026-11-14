import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  return {
    rules: [
      // General rule for all crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      // Explicitly allow AI search engine bots for indexing & citations
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User"],
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

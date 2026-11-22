import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { ChampionsSection } from "@/components/home/ChampionsSection";
import { PointsTablePreview } from "@/components/home/PointsTablePreview";
import { LatestUpdatesSection } from "@/components/home/LatestUpdatesSection";
import { TeamsPreview } from "@/components/home/TeamsPreview";
import { AdsterraInContentBanner } from "@/components/ads/AdsterraBanner";
import { getStandingsAsync, getAllMatches } from "@/lib/repository/matches";
import { getLatestArticles } from "@/lib/repository/news";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

export const metadata: Metadata = {
  title: "NPL Hub Nepal — Sudurpaschim Royals Win NPL Season 3 (2026)",
  description:
    "Sudurpaschim Royals are NPL Season 3 Champions 2026, defeating Lumbini Lions by 10 wickets in the Final. George Munsey scored 125* off 54 balls. Full results, standings, statistics and news.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NPL Hub Nepal — Sudurpaschim Royals Win NPL Season 3 (2026)",
    description:
      "Sudurpaschim Royals are NPL Season 3 Champions 2026. George Munsey scored 125* off 54 balls in the Final. Full results, points table, teams and statistics.",
    url: siteUrl,
    siteName: "NPL Hub Nepal",
    images: [
      {
        url: `${siteUrl}/images/logo.png`,
        width: 512,
        height: 512,
        alt: "NPL Hub Nepal Logo",
      },
    ],
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL Hub Nepal — Sudurpaschim Royals Win NPL Season 3 (2026)",
    description:
      "Sudurpaschim Royals are NPL Season 3 Champions 2026. George Munsey scored 125* off 54 balls in the Final. Full results, points table, teams and statistics.",
    images: [`${siteUrl}/images/logo.png`],
  },
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "NPL Hub Nepal",
      alternateName: ["NPL Hub", "NPL Nepal", "Nepal Premier League Hub"],
      description:
        "Independent information platform for the Nepal Premier League. NPL Season 3 (2026) results, standings, teams, players, statistics and news.",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "NPL Hub Nepal",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        "url": `${siteUrl}/images/logo.png`,
        "width": 512,
        "height": 512,
      },
      description:
        "Independent information platform dedicated to Nepal Premier League cricket.",
    },
    {
      "@type": "SportsEvent",
      name: "Nepal Premier League Season 3 (2026)",
      description: "Sudurpaschim Royals won NPL Season 3, defeating Lumbini Lions by 10 wickets in the Final on 21 November 2026.",
      startDate: "2026-10-26",
      endDate: "2026-11-21",
      eventStatus: "https://schema.org/EventCompleted",
      location: {
        "@type": "Place",
        name: "Tribhuvan University International Cricket Stadium",
        address: "Kirtipur, Kathmandu, Nepal",
      },
      organizer: {
        "@type": "Organization",
        name: "Cricket Association of Nepal (CAN)",
        url: "https://can.org.np",
      },
      winner: {
        "@type": "SportsTeam",
        name: "Sudurpaschim Royals",
      },
    },
  ],
};

export default async function HomePage() {
  const [standings, latestNews, allMatches] = await Promise.all([
    getStandingsAsync(),
    getLatestArticles(4),
    getAllMatches(),
  ]);

  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <Container className="space-y-12 sm:space-y-16">
        {/* 1. Hero Section with Constellation Background */}
        <HeroSection matches={allMatches} />

        {/* 2. Season 3 Champions Section */}
        <ChampionsSection />

        {/* In-Page Break Advertisement */}
        <div className="flex justify-center -my-2 sm:-my-4">
          <AdsterraInContentBanner />
        </div>

        {/* 3. Points Table Standings Preview */}
        <PointsTablePreview standings={standings} />

        {/* 4. Latest News & Tournament Updates */}
        <LatestUpdatesSection articles={latestNews} />

        {/* 5. NPL Franchise Teams */}
        <TeamsPreview />
      </Container>
    </div>
  );
}

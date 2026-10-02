import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { UpcomingMatchSection } from "@/components/home/UpcomingMatchSection";
import { PointsTablePreview } from "@/components/home/PointsTablePreview";
import { LatestUpdatesSection } from "@/components/home/LatestUpdatesSection";
import { TeamsPreview } from "@/components/home/TeamsPreview";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

export const metadata: Metadata = {
  title: "NPL Hub Nepal — Nepal Premier League Cricket",
  description:
    "Independent information platform for the Nepal Premier League. Live scores, schedules, points table standings, team profiles, player rosters, statistics, and NPL news.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NPL Hub Nepal — Nepal Premier League Cricket",
    description:
      "Independent information platform for the Nepal Premier League. Scores, schedules, points table, teams, players, and NPL news.",
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
    title: "NPL Hub Nepal — Nepal Premier League Cricket",
    description:
      "Independent information platform for the Nepal Premier League. Scores, schedules, points table, teams, players, and NPL news.",
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
        "Independent information platform for the Nepal Premier League. Scores, schedules, points table, teams, players, and NPL news.",
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
  ],
};

export default function HomePage() {
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <Container className="space-y-12 sm:space-y-16">
        {/* 1. Hero Section with Constellation Background */}
        <HeroSection />

        {/* 2. Featured Upcoming Match */}
        <UpcomingMatchSection />

        {/* 3. Points Table Standings Preview */}
        <PointsTablePreview />

        {/* 4. Latest News & Tournament Updates */}
        <LatestUpdatesSection />

        {/* 5. NPL Franchise Teams */}
        <TeamsPreview />
      </Container>
    </div>
  );
}

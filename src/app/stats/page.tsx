import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Layout";
import { StatsHubClient } from "@/components/stats/StatsHubClient";
import { getSeasonStats, getAvailableSeasons } from "@/lib/repository/stats";
import { getAllTeams } from "@/lib/repository/teams";

export const metadata: Metadata = {
  title: "NPL Statistics & Records — Season 2 (2025) & Season 3 (2026) | NPL Hub Nepal",
  description:
    "Official Nepal Premier League statistics hub. Explore verified NPL Season 2 (2025) records including top run scorers, leading wicket takers, tournament awards, playoff results, and NPL Season 3 (2026) competition data.",
  keywords: [
    "NPL 2025 statistics",
    "Nepal Premier League Season 2 statistics",
    "NPL 2026 statistics",
    "Nepal Premier League Season 3 statistics",
    "NPL top run scorers",
    "NPL top wicket takers",
    "NPL points table",
    "NPL player records",
    "Nepal cricket statistics",
  ],
  alternates: {
    canonical: "https://nplhub.com.np/stats",
  },
  openGraph: {
    title: "NPL Statistics & Records — Season 2 (2025) & Season 3 (2026) | NPL Hub Nepal",
    description:
      "Official Nepal Premier League statistics. Explore verified NPL Season 2 (2025) tournament awards, top run scorers, top wicket takers, points table, and Season 3 competition architecture.",
    url: "https://nplhub.com.np/stats",
    siteName: "NPL Hub Nepal",
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL Statistics & Records — Season 2 (2025) & Season 3 (2026) | NPL Hub Nepal",
    description:
      "Official Nepal Premier League statistics. Explore verified NPL Season 2 (2025) records and Season 3 pre-tournament hub.",
  },
};

export default function StatsPage() {
  const season2Dataset = getSeasonStats("season-2");
  const season3Dataset = getSeasonStats("season-3");
  const availableSeasons = getAvailableSeasons();
  const allTeams = getAllTeams();

  const datasets = {
    "season-2": season2Dataset,
    "season-3": season3Dataset,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsEvent",
        "@id": "https://nplhub.com.np/stats#season-2",
        name: "Siddhartha Bank Nepal Premier League 2025 (NPL Season 2)",
        description: "Official 2nd edition of the Nepal Premier League held from 17 Nov to 13 Dec 2025.",
        startDate: "2025-11-17",
        endDate: "2025-12-13",
        location: {
          "@type": "Place",
          name: "Tribhuvan University International Cricket Ground",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Kirtipur",
            addressRegion: "Kathmandu",
            addressCountry: "NP",
          },
        },
        competitor: [
          { "@type": "SportsTeam", name: "Lumbini Lions" },
          { "@type": "SportsTeam", name: "Sudurpaschim Royals" },
          { "@type": "SportsTeam", name: "Biratnagar Kings" },
          { "@type": "SportsTeam", name: "Kathmandu Gorkhas" },
          { "@type": "SportsTeam", name: "Pokhara Avengers" },
          { "@type": "SportsTeam", name: "Karnali Yaks" },
          { "@type": "SportsTeam", name: "Chitwan Rhinos" },
          { "@type": "SportsTeam", name: "Janakpur Bolts" },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://nplhub.com.np",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Statistics",
            item: "https://nplhub.com.np/stats",
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="py-6 sm:py-8 lg:py-10">
        <Container>
          <Suspense
            fallback={
              <div className="p-12 text-center text-sm text-[var(--color-ink-muted)]">
                Loading NPL Statistics Hub...
              </div>
            }
          >
            <StatsHubClient
              initialSeasonId="season-2"
              datasets={datasets}
              availableSeasons={availableSeasons}
              allTeams={allTeams}
            />
          </Suspense>
        </Container>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Layout";
import { StatsHubClient } from "@/components/stats/StatsHubClient";
import { getSeasonStats, getAvailableSeasons } from "@/lib/repository/stats";
import { getAllTeams } from "@/lib/repository/teams";

export const metadata: Metadata = {
  title: "NPL Statistics & Records — Season 2 (2025) & Season 3 (2026)",
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
    canonical: "/stats",
  },
  openGraph: {
    title: "NPL Statistics & Records — Season 2 (2025) & Season 3 (2026)",
    description:
      "Official Nepal Premier League statistics. Explore verified NPL Season 2 (2025) tournament awards, top run scorers, top wicket takers, points table, and Season 3 competition architecture.",
    url: "/stats",
    siteName: "NPL Hub Nepal",
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL Statistics & Records — Season 2 (2025) & Season 3 (2026)",
    description:
      "Official Nepal Premier League statistics. Explore verified NPL Season 2 (2025) records and Season 3 pre-tournament hub.",
  },
};

export default async function StatsPage() {
  const season2Dataset = await getSeasonStats("season-2");
  const season3Dataset = await getSeasonStats("season-3");
  const availableSeasons = getAvailableSeasons();
  const allTeams = await getAllTeams();

  const datasets = {
    "season-2": season2Dataset,
    "season-3": season3Dataset,
  };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsEvent",
        "@id": `${siteUrl}/stats#season-2`,
        name: "Siddhartha Bank Nepal Premier League 2025 (Season 2)",
        sport: "Cricket",
        eventStatus: "https://schema.org/EventCompleted",
        startDate: "2025-11-17",
        endDate: "2025-12-13",
        location: {
          "@type": "Place",
          name: "TU International Cricket Stadium, Kirtipur, Kathmandu",
        },
      },
      {
        "@type": "SportsEvent",
        "@id": `${siteUrl}/stats#season-3`,
        name: "Siddhartha Bank Nepal Premier League 2026 (Season 3)",
        sport: "Cricket",
        eventStatus: "https://schema.org/EventScheduled",
        startDate: "2026-10-26",
        endDate: "2026-11-21",
        location: {
          "@type": "Place",
          name: "TU International Cricket Stadium, Kirtipur, Kathmandu",
        },
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
        <Container className="space-y-8 sm:space-y-10">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4 py-12 text-center text-sm text-[var(--color-ink-muted)]">
                Loading NPL Statistics Engine...
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

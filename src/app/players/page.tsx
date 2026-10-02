import type { Metadata } from "next";
import { getAllPlayers } from "@/lib/repository/players";
import { getAllTeams } from "@/lib/repository/teams";
import { Container } from "@/components/ui/Layout";
import { PlayerBreadcrumb } from "@/components/players/PlayerBreadcrumb";
import { PlayerSearchFilter } from "@/components/players/PlayerSearchFilter";

export const metadata: Metadata = {
  title: "NPL 2026 Players Directory & Season 3 Squads",
  description:
    "Explore verified Nepal Premier League Season 3 (2026) players across all 8 franchises. Filter by franchise, playing role, captains, and confirmed retained squad members.",
  alternates: {
    canonical: "/players",
  },
  openGraph: {
    title: "NPL 2026 Players Directory & Season 3 Squads",
    description:
      "Explore verified Nepal Premier League (NPL) Season 3 players across all 8 franchises. Search by name, filter by team and role.",
    url: "/players",
    siteName: "NPL Hub Nepal",
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL 2026 Players Directory & Season 3 Squads",
    description:
      "Verified player profiles, captains, and retained squads for Nepal Premier League Season 3.",
  },
};

export default async function PlayersDirectoryPage() {
  const allPlayers = await getAllPlayers();
  const allTeams = await getAllTeams();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nepal Premier League Season 3 Players Directory",
    description:
      "Directory of verified retained and core players for NPL Season 3.",
    url: `${siteUrl}/players`,
    numberOfItems: allPlayers.length,
    itemListElement: allPlayers.map((player, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: player.name,
      url: `${siteUrl}/players/${player.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="py-6 sm:py-8 lg:py-10">
        <Container className="space-y-8 sm:space-y-10">
          <PlayerBreadcrumb />

          <header className="space-y-3 border-b border-[var(--color-rule)] pb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-light)] border border-[var(--color-brand)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
              <span
                className="w-2 h-2 rounded-full bg-[var(--color-brand)]"
                aria-hidden="true"
              />
              Verified Player Directory · Season 3
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--color-ink)] leading-[1.15]">
              NPL Players & Squad Rosters
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] max-w-3xl leading-relaxed">
              Complete index of confirmed retained players and marquee leaders
              competing in Nepal Premier League Season 3. Filter by team,
              cricket role, captaincy status, or player search.
            </p>
          </header>

          <PlayerSearchFilter initialPlayers={allPlayers} teams={allTeams} />
        </Container>
      </div>
    </>
  );
}

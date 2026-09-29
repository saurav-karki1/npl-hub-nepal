import type { Metadata } from "next";
import { getAllPlayers } from "@/lib/repository/players";
import { getAllTeams } from "@/lib/repository/teams";
import { Container } from "@/components/ui/Layout";
import { PlayerBreadcrumb } from "@/components/players/PlayerBreadcrumb";
import { PlayerSearchFilter } from "@/components/players/PlayerSearchFilter";

export const metadata: Metadata = {
  title: "NPL 2026 Players Directory & Season 3 Squads | NPL Hub Nepal",
  description:
    "Explore verified Nepal Premier League Season 3 (2026) players across all 8 franchises. Filter by franchise, playing role, captains, and confirmed retained squad members.",
  alternates: {
    canonical: "https://nplhub.com.np/players",
  },
  openGraph: {
    title: "NPL 2026 Players Directory & Season 3 Squads | NPL Hub Nepal",
    description:
      "Explore verified Nepal Premier League (NPL) Season 3 players across all 8 franchises. Search by name, filter by team and role.",
    url: "https://nplhub.com.np/players",
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

export default function PlayersDirectoryPage() {
  const allPlayers = getAllPlayers();
  const allTeams = getAllTeams();

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nepal Premier League Season 3 Players Directory",
    description:
      "Directory of verified retained and core players for NPL Season 3.",
    url: "https://nplhub.com.np/players",
    numberOfItems: allPlayers.length,
    itemListElement: allPlayers.map((player, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: player.name,
      url: `https://nplhub.com.np/players/${player.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="py-6 sm:py-8 lg:py-10">
        <Container className="space-y-6 sm:space-y-8">
          {/* Breadcrumb Navigation */}
          <PlayerBreadcrumb />

          {/* Directory Hero Header */}
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-[var(--color-surface)] border border-[var(--color-rule)] px-2.5 py-0.5 rounded-[var(--radius-sm)] text-[var(--color-brand)]">
                Players Directory
              </span>
              <span className="text-xs text-[var(--color-ink-muted)]">
                Season 3 · 2026 Edition
              </span>
              <span className="text-xs text-[var(--color-ink-faint)]" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[var(--radius-sm)] border border-emerald-200">
                53 Verified Players
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--color-ink)]">
              NPL Season 3 Players
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] max-w-3xl leading-relaxed">
              Explore officially verified franchise captains, marquee stars, and
              confirmed retained players for Nepal Premier League Season 3. Use
              the search and filters below to browse by playing role, franchise, or
              leadership status. Additional draft picks and international signings
              will populate as official CAN registrations are published.
            </p>
          </header>

          {/* Client-Side Interactive Search & Filtering Grid */}
          <PlayerSearchFilter initialPlayers={allPlayers} teams={allTeams} />

          {/* Editorial Data Notice */}
          <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-4 text-xs text-[var(--color-ink-muted)] leading-relaxed space-y-1">
            <strong className="text-[var(--color-ink)] font-semibold block">
              Editorial Notice on Player Squads:
            </strong>
            <p>
              This directory displays all 53 confirmed retained players and marquee
              announcements across the 8 NPL franchises. Unconfirmed transfer rumors,
              speculative salaries, and unannounced overseas signings are strictly
              excluded to preserve 100% data integrity.
            </p>
          </div>
        </Container>
      </div>
    </>
  );
}

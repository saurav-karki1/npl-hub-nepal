import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllPlayerSlugs,
  getPlayerBySlug,
  getPlayerTeam,
} from "@/lib/repository/players";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import { PlayerBreadcrumb } from "@/components/players/PlayerBreadcrumb";
import { PlayerHero } from "@/components/players/PlayerHero";
import { PlayerDetailsCard } from "@/components/players/PlayerDetailsCard";
import { PlayerSeasonSection } from "@/components/players/PlayerSeasonSection";
import { PlayerRelatedMatches } from "@/components/players/PlayerRelatedMatches";
import { PlayerRelatedNews } from "@/components/players/PlayerRelatedNews";

interface PlayerPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/** Statically pre-render all 53 player pages at build time */
export async function generateStaticParams() {
  return getAllPlayerSlugs();
}

/** Dynamic SEO metadata for each player */
export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);

  if (!player) {
    return {
      title: "Player Not Found",
    };
  }

  const team = await getPlayerTeam(player);
  const teamName = team ? team.name : "NPL Franchise";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  // Keep title under ~60 chars before template suffix
  const title = `${player.name} — ${player.role} | ${teamName}`;
  const description = `${player.name} player profile: ${player.role} for ${teamName} in NPL Season 3. Batting style, bowling style, and upcoming fixtures.`;

  const ogImageUrl = player.profileImage
    ? player.profileImage.startsWith("http")
      ? player.profileImage
      : `${siteUrl}${player.profileImage}`
    : `${siteUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `/players/${player.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/players/${player.slug}`,
      siteName: "NPL Hub Nepal",
      locale: "en_NP",
      type: "profile",
      images: [
        {
          url: ogImageUrl,
          width: player.profileImage ? 480 : 1200,
          height: player.profileImage ? 640 : 630,
          alt: player.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

  const team = await getPlayerTeam(player);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  /* Schema.org Person JSON-LD */
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.name,
    jobTitle: `${player.role} in Nepal Premier League`,
    nationality: player.nationality,
    ...(player.profileImage
      ? { image: `${siteUrl}${player.profileImage}` }
      : {}),
    ...(player.dateOfBirth ? { birthDate: player.dateOfBirth } : {}),
    ...(player.birthPlace ? { homeLocation: player.birthPlace } : {}),
    ...(team
      ? {
          memberOf: {
            "@type": "SportsTeam",
            name: team.name,
            sport: "Cricket",
            url: `${siteUrl}/teams/${team.slug}`,
          },
        }
      : {}),
    url: `${siteUrl}/players/${player.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="py-6 sm:py-8 lg:py-10">
        <Container className="space-y-8 sm:space-y-10">
          {/* Breadcrumb Navigation */}
          <PlayerBreadcrumb
            playerName={player.name}
            playerSlug={player.slug}
          />

          {/* Player Hero Banner */}
          <PlayerHero player={player} />

          {/* Verified Player Profile & Specifications */}
          <PlayerDetailsCard player={player} />

          {/* Season 3 Campaign & Result-Ready Statistics */}
          <PlayerSeasonSection player={player} />

          {/* Upcoming Matches Involving Player's Team */}
          <PlayerRelatedMatches player={player} />

          {/* Related News & Tournament Updates */}
          <PlayerRelatedNews player={player} />

          {/* Bottom Navigation & Team Link */}
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
            <LinkButton href="/players" variant="secondary" size="sm">
              ← Return to Players Directory
            </LinkButton>
            {team && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/teams/${team.slug}`}
                  className="text-xs font-semibold text-[var(--color-brand)] hover:underline"
                >
                  View {team.name} Squad & Schedule →
                </Link>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
}

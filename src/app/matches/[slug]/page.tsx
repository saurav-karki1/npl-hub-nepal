import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Layout";
import {
  getMatchBySlug,
  getAdjacentMatches,
  getAllMatchSlugs,
  resolveMatchTeams,
} from "@/lib/repository/matches";
import { buildMatchJsonLd, safeJsonLd } from "@/lib/structuredData";
import { MatchBreadcrumb } from "@/components/matches/MatchBreadcrumb";
import { MatchHeader } from "@/components/matches/MatchHeader";
import { MatchScoreboard } from "@/components/matches/MatchScoreboard";
import { MatchInfoSection } from "@/components/matches/MatchInfoSection";
import { MatchTeamsSection } from "@/components/matches/MatchTeamsSection";
import { MatchNavigation } from "@/components/matches/MatchNavigation";
import { MatchRelatedLinks } from "@/components/matches/MatchRelatedLinks";
import { LiveCommentaryFeed } from "@/components/matches/LiveCommentaryFeed";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateStaticParams() {
  return getAllMatchSlugs();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);

  if (!match) {
    return {
      title: "Match Not Found",
    };
  }

  const { team1, team2 } = resolveMatchTeams(match);
  const title = `Match #${match.matchNumber}: ${team1.name} vs ${team2.name} — NPL Season 3 Scorecard`;
  const description = `Nepal Premier League Season 3 Match #${match.matchNumber}: ${team1.name} vs ${team2.name} on ${match.dayOfWeek}, ${match.formattedDate} (${match.bsDateNepali}) at TU International Cricket Stadium, Kirtipur.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/matches/${match.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/matches/${match.slug}`,
      siteName: "NPL Hub Nepal",
      locale: "en_NP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);

  if (!match) {
    notFound();
  }

  const { prevMatch, nextMatch } = await getAdjacentMatches(match.matchNumber);
  const { team1, team2 } = resolveMatchTeams(match);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  // Build complete SportsEvent JSON-LD via reusable helper (lib/structuredData.ts)
  // Includes: eventStatus, eventAttendanceMode, homeTeam, awayTeam, performer, image, organizer
  // Intentionally omits `offers` — no confirmed ticketing/pricing data exists.
  const sportsEventSchema = buildMatchJsonLd({ match, team1, team2, siteUrl });

  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(sportsEventSchema) }}
      />

      <Container className="space-y-8 sm:space-y-10">
        {/* 1. Breadcrumb: Home / Schedule / Match */}
        <MatchBreadcrumb match={match} />

        {/* 2. Match Header Hero: Match #, Stage, Date (BS/Gregorian), Time, Venue, Status, Logos */}
        <MatchHeader match={match} />

        {/* 3. Result-Ready Scoreboard & Pre-Match Guarantee */}
        <MatchScoreboard match={match} />

        {/* Live Commentary Section */}
        <section className="mt-8">
          <LiveCommentaryFeed
            matchSlug={match.slug}
            matchId={match.id}
            isLive={match.status === "live"}
            matchStatus={match.status}
          />
        </section>

        {/* 4. Match Details & Venue Factsheet */}
        <MatchInfoSection match={match} />

        {/* 5. Team Profiles & Franchise Links */}
        <MatchTeamsSection match={match} />

        {/* 6. Related Tournament Links */}
        <MatchRelatedLinks match={match} />

        {/* 7. Previous / Next Match Navigation & Back to Schedule */}
        <MatchNavigation prevMatch={prevMatch} nextMatch={nextMatch} />
      </Container>
    </div>
  );
}

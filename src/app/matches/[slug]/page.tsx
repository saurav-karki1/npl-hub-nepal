import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Layout";
import {
  getMatchBySlug,
  getAdjacentMatches,
  getAllMatchSlugs,
  resolveMatchTeams,
} from "@/lib/repository/matches";
import { MatchBreadcrumb } from "@/components/matches/MatchBreadcrumb";
import { MatchHeader } from "@/components/matches/MatchHeader";
import { MatchScoreboard } from "@/components/matches/MatchScoreboard";
import { MatchInfoSection } from "@/components/matches/MatchInfoSection";
import { MatchTeamsSection } from "@/components/matches/MatchTeamsSection";
import { MatchNavigation } from "@/components/matches/MatchNavigation";
import { MatchRelatedLinks } from "@/components/matches/MatchRelatedLinks";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllMatchSlugs();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const match = getMatchBySlug(slug);

  if (!match) {
    return {
      title: "Match Not Found | NPL Hub Nepal",
    };
  }

  const { team1, team2 } = resolveMatchTeams(match);
  const title = `Match #${match.matchNumber}: ${team1.name} vs ${team2.name} — NPL Season 3 Schedule & Scorecard | NPL Hub Nepal`;
  const description = `Nepal Premier League Season 3 Match #${match.matchNumber}: ${team1.name} vs ${team2.name} on ${match.dayOfWeek}, ${match.formattedDate} (${match.bsDateNepali}) at TU International Cricket Stadium, Kirtipur.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://nplhub.com.np/matches/${match.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://nplhub.com.np/matches/${match.slug}`,
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
  const match = getMatchBySlug(slug);

  if (!match) {
    notFound();
  }

  const { prevMatch, nextMatch } = getAdjacentMatches(match.matchNumber);
  const { team1, team2 } = resolveMatchTeams(match);

  // Schema.org SportsEvent structured data
  const sportsEventSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${team1.name} vs ${team2.name} (NPL Season 3 Match #${match.matchNumber})`,
    description: `Nepal Premier League Season 3 Match #${match.matchNumber}: ${team1.name} vs ${team2.name} at TU International Cricket Stadium, Kirtipur.`,
    startDate: match.date,
    location: {
      "@type": "Place",
      name: match.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kirtipur, Kathmandu",
        addressCountry: "NP",
      },
    },
    competitor: [
      {
        "@type": "SportsTeam",
        name: team1.name,
      },
      {
        "@type": "SportsTeam",
        name: team2.name,
      },
    ],
    organizer: {
      "@type": "Organization",
      name: "Cricket Association of Nepal (CAN)",
      url: "https://can.org.np",
    },
    eventStatus:
      match.status === "completed"
        ? "https://schema.org/EventCompleted"
        : "https://schema.org/EventScheduled",
  };

  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventSchema) }}
      />

      <Container className="space-y-8 sm:space-y-10">
        {/* 1. Breadcrumb: Home / Schedule / Match */}
        <MatchBreadcrumb match={match} />

        {/* 2. Match Header Hero: Match #, Stage, Date (BS/Gregorian), Time, Venue, Status, Logos */}
        <MatchHeader match={match} />

        {/* 3. Result-Ready Scoreboard & Pre-Match Guarantee */}
        <MatchScoreboard match={match} />

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

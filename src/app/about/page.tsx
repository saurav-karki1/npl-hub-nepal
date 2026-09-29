import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import { AboutBreadcrumb } from "@/components/about/AboutBreadcrumb";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutTournamentOverview } from "@/components/about/AboutTournamentOverview";
import { AboutTeamsGrid } from "@/components/about/AboutTeamsGrid";
import { AboutFormatSection } from "@/components/about/AboutFormatSection";
import { AboutVenueSection } from "@/components/about/AboutVenueSection";
import { AboutPlatformSection } from "@/components/about/AboutPlatformSection";
import { AboutNavigationSection } from "@/components/about/AboutNavigationSection";

export const metadata: Metadata = {
  title: "Tournament Guide & Information Hub",
  description:
    "Comprehensive independent guide to Nepal Premier League (NPL) Season 3 (2026). Explore all 8 franchise teams, 32 fixtures at TU Ground Kirtipur, tournament format, points table rules, and platform transparency.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Nepal Premier League Season 3 — Tournament Guide & Information Hub",
    description:
      "Comprehensive independent guide to Nepal Premier League (NPL) Season 3. Explore 8 franchise teams, 32 fixtures at TU Stadium Kirtipur, tournament format, and standings rules.",
    url: "/about",
    siteName: "NPL Hub Nepal",
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nepal Premier League Season 3 — Tournament Guide & Information Hub",
    description:
      "Comprehensive independent guide to Nepal Premier League Season 3. 8 franchise teams, 32 fixtures at TU Ground, and complete tournament format.",
  },
};

export default function AboutPage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  /* Schema.org structured data for AboutPage and tournament event context */
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Nepal Premier League Season 3 Information Hub",
    description:
      "Comprehensive independent guide and reference for Nepal Premier League Season 3 (2026), featuring verified fixtures, 8 regional teams, and competition rules.",
    url: `${siteUrl}/about`,
    publisher: {
      "@type": "Organization",
      name: "NPL Hub Nepal",
      url: siteUrl,
      description:
        "Independent digital information platform for Nepal Premier League cricket.",
    },
    about: {
      "@type": "SportsEvent",
      name: "Siddhartha Bank Nepal Premier League Season 3",
      startDate: "2026-10-26",
      endDate: "2026-11-21",
      location: {
        "@type": "Place",
        name: "Tribhuvan University International Cricket Stadium",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kirtipur",
          addressRegion: "Kathmandu Valley",
          addressCountry: "NP",
        },
      },
      organizer: {
        "@type": "SportsOrganization",
        name: "Cricket Association of Nepal (CAN)",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />

      <div className="py-6 sm:py-8 lg:py-10">
        <Container className="space-y-10 sm:space-y-12">
          {/* Breadcrumb Navigation */}
          <AboutBreadcrumb />

          {/* Hero Banner with Constellation Background */}
          <AboutHero />

          {/* Tournament Overview & Key Metrics */}
          <AboutTournamentOverview />

          {/* 8 Participating Franchise Teams */}
          <AboutTeamsGrid />

          {/* Tournament Format & Competition Rules */}
          <AboutFormatSection />

          {/* Single Shared Venue vs Franchise Representation */}
          <AboutVenueSection />

          {/* Platform Mission, Integrity & Non-Affiliation Disclaimer */}
          <AboutPlatformSection />

          {/* Explore NPL Season 3 Navigation Links */}
          <AboutNavigationSection />

          {/* Bottom Return Action Bar */}
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
            <LinkButton href="/" variant="secondary" size="sm">
              ← Return to Home
            </LinkButton>
            <div className="flex items-center gap-2">
              <LinkButton href="/teams" variant="ghost" size="sm">
                Explore 8 Teams →
              </LinkButton>
              <LinkButton href="/schedule" variant="primary" size="sm">
                View 32 Fixtures Schedule →
              </LinkButton>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

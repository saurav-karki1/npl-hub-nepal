import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { ScheduleBreadcrumb } from "@/components/schedule/ScheduleBreadcrumb";
import { ScheduleHeader } from "@/components/schedule/ScheduleHeader";
import { TournamentSummary } from "@/components/schedule/TournamentSummary";
import { UpcomingMatchesSection } from "@/components/schedule/UpcomingMatchesSection";
import { FullFixturesSection } from "@/components/schedule/FullFixturesSection";
import { CompletedMatchesSection } from "@/components/schedule/CompletedMatchesSection";
import { ScheduleFAQSection } from "@/components/schedule/ScheduleFAQSection";
import { RelatedLinksSection } from "@/components/schedule/RelatedLinksSection";
import { getAllMatches } from "@/lib/repository/matches";
import { getAllTeams } from "@/lib/repository/teams";

export const metadata: Metadata = {
  title: "NPL Season 3 Schedule & Fixtures",
  description:
    "Complete NPL Season 3 schedule and fixtures for Nepal Premier League 2026. View all 32 T20 match dates, Nepali BS calendar dates, Nepal Time (NPT) timings, 8 franchise teams, and TU Stadium Kirtipur venues.",
  alternates: {
    canonical: "/schedule",
  },
  openGraph: {
    title: "NPL Season 3 Schedule & Fixtures",
    description:
      "Complete NPL Season 3 schedule and fixtures for Nepal Premier League 2026. View all 32 T20 match dates, Nepali BS calendar dates, Nepal Time (NPT) timings, 8 franchise teams, and TU Stadium Kirtipur venues.",
    url: "/schedule",
    siteName: "NPL Hub Nepal",
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL Season 3 Schedule & Fixtures",
    description:
      "Complete NPL Season 3 schedule and fixtures for Nepal Premier League 2026. View all 32 T20 match dates, Nepali BS calendar dates, Nepal Time (NPT) timings, 8 franchise teams, and TU Stadium Kirtipur venues.",
  },
};

export default function SchedulePage() {
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <Container className="space-y-10 sm:space-y-12">
        {/* A. Breadcrumb Navigation */}
        <ScheduleBreadcrumb />

        {/* B. Page Heading & Sports-Editorial Introduction */}
        <ScheduleHeader />

        {/* C. Tournament Overview & Schedule Summary */}
        <TournamentSummary />

        {/* D. Featured Upcoming Matches */}
        <UpcomingMatchesSection />

        {/* E. Full Fixtures List with Interactive Filters */}
        <FullFixturesSection
          initialMatches={getAllMatches()}
          initialTeams={getAllTeams()}
        />

        {/* F. Completed Matches / Result Status */}
        <CompletedMatchesSection />

        {/* G. Helpful Factual FAQ Section */}
        <ScheduleFAQSection />

        {/* H. Internal Navigation / Related Pages */}
        <RelatedLinksSection />
      </Container>
    </div>
  );
}

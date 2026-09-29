import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import { getStandings } from "@/lib/repository/matches";
import { PointsTableHeader } from "@/components/points-table/PointsTableHeader";
import { FullPointsTable } from "@/components/points-table/FullPointsTable";
import { PointsTableRules } from "@/components/points-table/PointsTableRules";

export const metadata: Metadata = {
  title: "NPL Season 3 Points Table & Team Standings",
  description:
    "Official Nepal Premier League Season 3 points table and team standings. Track wins, losses, net run rates (NRR), and top-4 playoff qualification scenarios across all 8 franchises.",
  alternates: {
    canonical: "/points-table",
  },
  openGraph: {
    title: "NPL Season 3 Points Table & Standings",
    description:
      "Official Nepal Premier League Season 3 points table and team standings. Track wins, losses, net run rates (NRR), and top-4 playoff qualification scenarios across all 8 franchises.",
    url: "/points-table",
    siteName: "NPL Hub Nepal",
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL Season 3 Points Table & Standings",
    description:
      "Official Nepal Premier League Season 3 points table and team standings. Track wins, losses, net run rates (NRR), and top-4 playoff qualification scenarios across all 8 franchises.",
  },
};

export default function PointsTablePage() {
  const standings = getStandings();

  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <Container className="space-y-8 sm:space-y-10">
        {/* Page Header & Tournament Meta Ribbon */}
        <PointsTableHeader standings={standings} />

        {/* Full 8-Team Standings Table */}
        <FullPointsTable standings={standings} />

        {/* Tournament Rules, NRR Formula, and Playoff Structure */}
        <PointsTableRules />

        {/* Bottom Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
          <LinkButton href="/" variant="secondary" size="sm">
            ← Back to Home
          </LinkButton>
          <div className="flex items-center gap-2">
            <LinkButton href="/teams" variant="ghost" size="sm">
              Explore 8 Teams →
            </LinkButton>
            <LinkButton href="/schedule" variant="primary" size="sm">
              View Match Schedule →
            </LinkButton>
          </div>
        </div>
      </Container>
    </div>
  );
}

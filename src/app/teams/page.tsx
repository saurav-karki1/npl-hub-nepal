import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { getAllTeams } from "@/lib/repository/teams";
import { TeamCard } from "@/components/teams/TeamCard";

export const metadata: Metadata = {
  title: "NPL Teams & Squads",
  description:
    "Explore all 8 Nepal Premier League franchise cricket teams competing in Season 3. View team profiles, captains, home venues, provinces, and match schedules.",
  alternates: {
    canonical: "/teams",
  },
  openGraph: {
    title: "NPL Teams & Squads",
    description:
      "Explore all 8 Nepal Premier League franchise cricket teams competing in Season 3. View team profiles, captains, home venues, provinces, and match schedules.",
    url: "/teams",
    siteName: "NPL Hub Nepal",
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL Teams & Squads",
    description:
      "Explore all 8 Nepal Premier League franchise cricket teams competing in Season 3. View team profiles, captains, home venues, provinces, and match schedules.",
  },
};

export default function TeamsPage() {
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <Container className="space-y-8 sm:space-y-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-ink-muted)]">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-[var(--color-brand)] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-[var(--color-ink-faint)]">/</li>
            <li className="font-semibold text-[var(--color-ink)]" aria-current="page">
              Teams
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <header className="space-y-3 border-b border-[var(--color-rule)] pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-light)] border border-[var(--color-brand)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
            Season 3 Franchises · 8 Teams
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--color-ink)] leading-[1.15]">
            NPL Franchise Teams
          </h1>

          <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] max-w-3xl leading-relaxed">
            Discover the 8 provincial and city franchise cricket teams contesting Nepal Premier League Season 3 (26 October – 21 November 2026). Explore franchise profiles, leadership, regional representations, and direct match schedules.
          </p>
        </header>

        {/* Summary Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-4 text-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
              Franchises
            </span>
            <span className="text-lg font-black text-[var(--color-ink)]">8 Teams</span>
          </div>
          <div className="border-l border-[var(--color-rule)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
              Format
            </span>
            <span className="text-lg font-black text-[var(--color-brand)]">T20 Cricket</span>
          </div>
          <div className="border-l border-[var(--color-rule)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
              Tournament Dates
            </span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-ink)]">
              26 Oct – 21 Nov 2026
            </span>
          </div>
          <div className="border-l border-[var(--color-rule)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] block">
              Primary Venue
            </span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-ink)]">
              TU Ground, Kirtipur
            </span>
          </div>
        </div>

        {/* Teams Directory Grid */}
        <section aria-labelledby="teams-grid-heading" className="space-y-4">
          <h2 id="teams-grid-heading" className="sr-only">
            All 8 NPL Franchise Teams
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {getAllTeams().map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </section>

        {/* Data & Squad Accuracy Callout */}
        <Card className="border-[var(--color-rule)] bg-[var(--color-surface)]">
          <CardBody className="p-5 flex items-start gap-3.5 text-xs text-[var(--color-ink-secondary)] leading-relaxed">
            <span
              className="w-5 h-5 rounded-full bg-[var(--color-brand-light)] border border-[var(--color-brand)]/20 text-[var(--color-brand)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
              aria-hidden="true"
            >
              i
            </span>
            <div>
              <strong className="font-bold text-[var(--color-ink)]">
                Team Leadership & Squad Accuracy Note:
              </strong>{" "}
              Team leadership details reflect officially announced appointments and verified reports from previous competition cycles. Unconfirmed squad rosters, domestic draft selections, and overseas signings are marked as &ldquo;Squad to be announced&rdquo; and will be updated live as each franchise and the Cricket Association of Nepal (CAN) officially register their Season 3 squad sheets.
            </div>
          </CardBody>
        </Card>

        {/* Bottom Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
          <LinkButton href="/" variant="secondary" size="sm">
            ← Back to Home
          </LinkButton>
          <LinkButton href="/schedule" variant="primary" size="sm">
            View Complete Match Schedule →
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}

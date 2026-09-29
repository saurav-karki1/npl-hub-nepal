import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import { getAllTeams, getTeamBySlug } from "@/lib/repository/teams";
import { getArticlesByTeam } from "@/lib/repository/news";
import { NewsCard } from "@/components/news/NewsCard";
import { TeamHeader } from "@/components/teams/TeamHeader";
import { TeamSquadSection } from "@/components/teams/TeamSquadSection";
import { TeamScheduleSection } from "@/components/teams/TeamScheduleSection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const teams = getAllTeams();
  return teams.map((team) => ({
    slug: team.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamBySlug(slug);

  if (!team) {
    return {
      title: "Team Not Found | NPL Hub Nepal",
    };
  }

  return {
    title: `${team.name} — NPL Season 3 Squad, Fixtures & Profile | NPL Hub Nepal`,
    description: `Complete profile for ${team.name} in Nepal Premier League Season 3. View captain ${team.captain}, ${team.region} regional representation, and live match schedule.`,
    alternates: {
      canonical: `https://nplhub.com.np/teams/${team.slug}`,
    },
    openGraph: {
      title: `${team.name} — NPL Season 3 Squad & Schedule | NPL Hub Nepal`,
      description: `Complete profile for ${team.name} in Nepal Premier League Season 3. View captain ${team.captain}, ${team.region} regional representation, and live match schedule.`,
      url: `https://nplhub.com.np/teams/${team.slug}`,
      siteName: "NPL Hub Nepal",
      locale: "en_NP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${team.name} — NPL Season 3 Squad & Schedule | NPL Hub Nepal`,
      description: `Complete profile for ${team.name} in Nepal Premier League Season 3. View captain ${team.captain}, ${team.region} regional representation, and live match schedule.`,
    },
  };
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);

  if (!team) {
    notFound();
  }

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
            <li>
              <Link href="/teams" className="hover:text-[var(--color-brand)] transition-colors">
                Teams
              </Link>
            </li>
            <li aria-hidden="true" className="text-[var(--color-ink-faint)]">/</li>
            <li className="font-semibold text-[var(--color-ink)]" aria-current="page">
              {team.name}
            </li>
          </ol>
        </nav>

        {/* Team Hero Header with Constellation Background */}
        <TeamHeader team={team} />

        {/* Team Match Schedule (Live from shared data source) */}
        <TeamScheduleSection team={team} />

        {/* Team Squad Section (Strict data accuracy compliance) */}
        <TeamSquadSection team={team} />

        {/* Related News & Editorial Updates */}
        {(() => {
          const relatedArticles = getArticlesByTeam(team.id);
          if (relatedArticles.length === 0) return null;
          return (
            <section aria-labelledby="team-news-heading" className="space-y-4">
              <SectionHeader
                title={`${team.name} Updates`}
                action={{ label: "All News →", href: "/news" }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedArticles.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          );
        })()}

        {/* Back Link & Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
          <LinkButton href="/teams" variant="secondary" size="sm">
            ← Back to All Teams
          </LinkButton>
          <LinkButton href="/schedule" variant="primary" size="sm">
            View Complete NPL Schedule →
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}

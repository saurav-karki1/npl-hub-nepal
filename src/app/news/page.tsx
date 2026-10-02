import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import { NewsBreadcrumb } from "@/components/news/NewsBreadcrumb";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsGrid } from "@/components/news/NewsGrid";
import {
  getAllArticles,
  getFeaturedArticles,
  getAvailableCategories,
} from "@/lib/repository/news";

export const metadata: Metadata = {
  title: "NPL News & Updates",
  description:
    "Independent news, tournament announcements, team updates, and editorial coverage of Nepal Premier League Season 3 from NPL Hub Nepal.",
  alternates: {
    canonical: "/news",
  },
  openGraph: {
    title: "NPL News & Updates",
    description:
      "Independent news, tournament announcements, team updates, and editorial coverage of Nepal Premier League Season 3.",
    url: "/news",
    siteName: "NPL Hub Nepal",
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPL News & Updates",
    description:
      "Independent news, tournament announcements, team updates, and editorial coverage of Nepal Premier League Season 3.",
  },
};

export default async function NewsPage() {
  const featured = await getFeaturedArticles();
  const all = await getAllArticles();
  const categories = await getAvailableCategories();

  return (
    <div className="py-8 sm:py-10">
      <Container className="space-y-10">
        {/* Breadcrumb */}
        <NewsBreadcrumb />

        {/* Page header */}
        <header>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-ink)] leading-tight">
            NPL News & Tournament Updates
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)] max-w-2xl leading-relaxed">
            Independent coverage of Nepal Premier League Season 3: tournament
            format, squad developments, venue information, and editorial cricket
            insights. Not affiliated with NPL or CAN.
          </p>
        </header>

        {/* Featured section */}
        {featured.length > 0 && (
          <section aria-labelledby="featured-news-heading" className="space-y-4">
            <h2
              id="featured-news-heading"
              className="text-lg font-extrabold text-[var(--color-ink)]"
            >
              Featured Coverage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((article) => (
                <NewsCard key={article.id} article={article} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* All articles with category filter */}
        <section aria-labelledby="all-news-heading" className="space-y-4">
          <h2
            id="all-news-heading"
            className="text-lg font-extrabold text-[var(--color-ink)]"
          >
            All Articles
          </h2>
          <NewsGrid articles={all} categories={categories} />
        </section>

        {/* Disclaimer banner */}
        <section className="rounded-lg bg-[var(--color-surface-sunken)] p-4 text-xs text-[var(--color-ink-muted)]">
          <p className="font-semibold text-[var(--color-ink)] mb-1">
            Editorial Integrity & Source Transparency
          </p>
          <p>
            All articles are based on publicly verified announcements from CAN or
            official franchise releases. Articles marked &quot;Provisional Draft&quot;
            contain unconfirmed details clearly flagged with disclaimers.
          </p>
        </section>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--color-rule)]">
          <LinkButton href="/" variant="secondary" size="sm">
            ← Home
          </LinkButton>
          <LinkButton href="/schedule" variant="primary" size="sm">
            View Schedule →
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}

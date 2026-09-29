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

export default function NewsPage() {
  const featured = getFeaturedArticles();
  const all = getAllArticles();
  const categories = getAvailableCategories();

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
          <section aria-labelledby="featured-heading">
            <div className="mb-4">
              <div className="border-t-2 border-[var(--color-brand)] mb-2" />
              <h2
                id="featured-heading"
                className="text-section-title"
              >
                Featured
              </h2>
            </div>
            <div
              className={
                featured.length === 1
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
                  : "grid grid-cols-1 sm:grid-cols-2 gap-4"
              }
            >
              {featured.map((article) => (
                <NewsCard key={article.id} article={article} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* Filterable news grid */}
        <NewsGrid articles={all} categories={categories} />

        {/* Footer nav */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
          <LinkButton href="/" variant="secondary" size="sm">
            ← Back to Home
          </LinkButton>
          <LinkButton href="/schedule" variant="primary" size="sm">
            Check Fixtures Schedule →
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}

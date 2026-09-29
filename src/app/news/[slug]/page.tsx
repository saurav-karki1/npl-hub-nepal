import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import { NewsBreadcrumb } from "@/components/news/NewsBreadcrumb";
import {
  getAllArticleSlugs,
  getArticleBySlug,
  getAllArticles,
  type NewsArticle,
} from "@/lib/repository/news";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllArticleSlugs();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found | NPL Hub Nepal" };
  }

  return {
    title: `${article.title} | NPL Hub Nepal`,
    description: article.excerpt,
    alternates: {
      canonical: `https://nplhub.com.np/news/${article.slug}`,
    },
    openGraph: {
      title: `${article.title} | NPL Hub Nepal`,
      description: article.excerpt,
      url: `https://nplhub.com.np/news/${article.slug}`,
      siteName: "NPL Hub Nepal",
      locale: "en_NP",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | NPL Hub Nepal`,
      description: article.excerpt,
    },
  };
}

/* ── Category colour accent ─────────────────────────────────────────────── */
const categoryColors: Record<string, string> = {
  Tournament: "text-[var(--color-brand)]",
  Teams: "text-emerald-600",
  Matches: "text-blue-600",
  "Points Table": "text-purple-600",
  Announcements: "text-amber-600",
};

/* ── Related team slug map ─────────────────────────────────────────────── */
const TEAM_NAMES: Record<string, string> = {
  "kathmandu-gorkhas": "Kathmandu Gorkhas",
  "biratnagar-kings": "Biratnagar Kings",
  "janakpur-bolts": "Janakpur Bolts",
  "pokhara-avengers": "Pokhara Avengers",
  "chitwan-rhinos": "Chitwan Rhinos",
  "lumbini-lions": "Lumbini Lions",
  "karnali-yaks": "Karnali Yaks",
  "sudurpaschim-royals": "Sudurpaschim Royals",
};

/* ── Article body renderer ──────────────────────────────────────────────── */
function ArticleBody({ article }: { article: NewsArticle }) {
  const categoryClass =
    categoryColors[article.category] ?? "text-[var(--color-brand)]";

  const isDraft = article.status === "draft";

  return (
    <article className="max-w-2xl mx-auto">
      {/* Draft notice */}
      {isDraft && (
        <div className="mb-6 px-4 py-3 border-l-4 border-amber-400 bg-amber-50 rounded-r-[var(--radius-md)]">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">
            Provisional Content
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            This article contains placeholder information pending an official
            announcement. NPL Hub Nepal will update this page when verified
            details are released.
          </p>
        </div>
      )}

      {/* Category + date */}
      <div className="flex items-center gap-3 mb-4 text-xs">
        <span className={`font-bold uppercase tracking-wider ${categoryClass}`}>
          {article.category}
        </span>
        <span className="text-[var(--color-ink-faint)]">·</span>
        <time
          dateTime={article.publishedAt}
          className="text-[var(--color-ink-muted)]"
        >
          {article.displayDate}
        </time>
        <span className="text-[var(--color-ink-faint)]">·</span>
        <span className="text-[var(--color-ink-muted)]">{article.readTime}</span>
      </div>

      {/* Headline */}
      <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)] leading-tight mb-4">
        {article.title}
      </h1>

      {/* Excerpt lead */}
      <p className="text-base text-[var(--color-ink-secondary)] leading-relaxed mb-6 border-l-2 border-[var(--color-brand)] pl-4 italic">
        {article.excerpt}
      </p>

      {/* Divider */}
      <div className="border-t border-[var(--color-rule)] mb-6" />

      {/* Body paragraphs */}
      <div className="space-y-4">
        {article.content.map((para, i) => (
          <p
            key={i}
            className="text-sm sm:text-base text-[var(--color-ink)] leading-relaxed"
          >
            {para}
          </p>
        ))}
      </div>

      {/* Byline / source */}
      <div className="mt-8 pt-4 border-t border-[var(--color-rule)] text-xs text-[var(--color-ink-muted)]">
        <span className="font-semibold">By:</span> {article.author}
        {article.source !== article.author && (
          <>
            {" · "}
            <span className="font-semibold">Source:</span> {article.source}
          </>
        )}
      </div>
    </article>
  );
}

/* ── Related links sidebar / footer section ────────────────────────────── */
function RelatedLinks({ article }: { article: NewsArticle }) {
  const hasTeams =
    article.relatedTeamIds && article.relatedTeamIds.length > 0;
  const hasMatch = Boolean(article.relatedMatchSlug);

  if (!hasTeams && !hasMatch) return null;

  return (
    <aside aria-label="Related pages" className="max-w-2xl mx-auto mt-10">
      <div className="border-t-2 border-[var(--color-brand)] mb-3" />
      <h2 className="text-section-title mb-4">Related</h2>
      <div className="flex flex-wrap gap-2">
        {hasTeams &&
          article.relatedTeamIds!.map((teamId) => (
            <Link
              key={teamId}
              href={`/teams/${teamId}`}
              className="px-3 py-1.5 text-xs font-semibold border border-[var(--color-rule)] rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              {TEAM_NAMES[teamId] ?? teamId} →
            </Link>
          ))}
        {hasMatch && (
          <Link
            href={`/matches/${article.relatedMatchSlug}`}
            className="px-3 py-1.5 text-xs font-semibold border border-[var(--color-rule)] rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            View Match Page →
          </Link>
        )}
        <Link
          href="/schedule"
          className="px-3 py-1.5 text-xs font-semibold border border-[var(--color-rule)] rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          Schedule →
        </Link>
        <Link
          href="/points-table"
          className="px-3 py-1.5 text-xs font-semibold border border-[var(--color-rule)] rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          Points Table →
        </Link>
      </div>
    </aside>
  );
}

/* ── Related articles footer ───────────────────────────────────────────── */
function MoreArticles({ currentSlug }: { currentSlug: string }) {
  const others = getAllArticles()
    .filter((a) => a.slug !== currentSlug)
    .slice(0, 3);

  if (others.length === 0) return null;

  return (
    <section aria-labelledby="more-articles-heading" className="max-w-2xl mx-auto mt-10">
      <div className="border-t-2 border-[var(--color-brand)] mb-3" />
      <h2 id="more-articles-heading" className="text-section-title mb-4">
        More Updates
      </h2>
      <ul className="divide-y divide-[var(--color-rule)]" role="list">
        {others.map((a) => (
          <li key={a.id}>
            <Link
              href={`/news/${a.slug}`}
              className="flex items-start justify-between gap-4 py-3 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-xs"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand)]">
                  {a.category}
                </span>
                <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors leading-snug mt-0.5">
                  {a.title}
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  {a.displayDate} · {a.readTime}
                </p>
              </div>
              <span
                className="shrink-0 mt-1 text-xs font-semibold text-[var(--color-brand)] group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  /* Schema.org NewsArticle structured data */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "NPL Hub Nepal",
      url: "https://nplhub.com.np",
    },
    url: `https://nplhub.com.np/news/${article.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://nplhub.com.np/news/${article.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="py-8 sm:py-10">
        <Container className="space-y-8">
          {/* Breadcrumb (includes its own BreadcrumbList JSON-LD) */}
          <NewsBreadcrumb articleTitle={article.title} />

          {/* Article body */}
          <ArticleBody article={article} />

          {/* Related team / match links */}
          <RelatedLinks article={article} />

          {/* More articles */}
          <MoreArticles currentSlug={slug} />

          {/* Footer nav */}
          <div className="max-w-2xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
            <LinkButton href="/news" variant="secondary" size="sm">
              ← All News
            </LinkButton>
            <LinkButton href="/schedule" variant="primary" size="sm">
              Match Schedule →
            </LinkButton>
          </div>
        </Container>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
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
import { normalizeArticleBlocks } from "@/lib/types/article-blocks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllArticleSlugs();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found" };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";
  const metaTitle = article.metaTitle ?? article.title;
  const metaDesc = article.metaDescription ?? article.excerpt;
  const ogImage = article.imageUrl
    ? `${siteUrl}${article.imageUrl}`
    : `${siteUrl}/images/og-default.png`;

  return {
    title: metaTitle,
    description: metaDesc,
    alternates: {
      canonical: `/news/${article.slug}`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `/news/${article.slug}`,
      siteName: "NPL Hub Nepal",
      locale: "en_NP",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.imageAlt ?? article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      images: [ogImage],
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

      {/* Hero image */}
      {article.imageUrl && (
        <figure className="mb-6 -mx-0">
          <div className="relative w-full aspect-[1200/630] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-rule)]">
            <Image
              src={article.imageUrl}
              alt={article.imageAlt ?? article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
          {article.imageCaption && (
            <figcaption className="mt-2 text-xs text-[var(--color-ink-muted)] text-center italic">
              {article.imageCaption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Headline */}
      <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)] leading-tight mb-4">
        {article.title}
      </h1>

      {/* Excerpt lead */}
      <p className="text-base text-[var(--color-ink-secondary)] leading-relaxed mb-6 border-l-2 border-[var(--color-brand)] pl-4 italic">
        {article.excerpt}
      </p>

      {/* Main content blocks — semantic HTML for paragraphs, headings, lists, quotes, FAQs */}
      <div className="space-y-4 text-sm text-[var(--color-ink)] leading-relaxed font-sans">
        {(() => {
          const blocks =
            article.blocks && article.blocks.length > 0
              ? article.blocks
              : normalizeArticleBlocks(article.content);

          return blocks.map((block, i) => {
            switch (block.type) {
              case "heading":
                if (block.level === 3) {
                  return (
                    <h3
                      key={i}
                      className="text-base sm:text-lg font-bold text-[var(--color-ink)] mt-6 mb-2"
                    >
                      {block.text}
                    </h3>
                  );
                }
                return (
                  <h2
                    key={i}
                    className="text-lg sm:text-xl font-bold text-[var(--color-ink)] pt-4 pb-1 border-b border-[var(--color-rule)] mt-8 mb-3"
                  >
                    {block.text}
                  </h2>
                );

              case "list":
                if (block.style === "ordered") {
                  return (
                    <ol
                      key={i}
                      className="list-decimal pl-6 space-y-1.5 my-4 text-[var(--color-ink)] leading-relaxed"
                    >
                      {block.items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ol>
                  );
                }
                return (
                  <ul
                    key={i}
                    className="list-disc pl-6 space-y-1.5 my-4 text-[var(--color-ink)] leading-relaxed"
                  >
                    {block.items.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                );

              case "quote":
                return (
                  <blockquote
                    key={i}
                    className="border-l-4 border-[var(--color-brand)] bg-[var(--color-surface-sunken)] px-4 py-3 rounded-r-[var(--radius-md)] text-xs sm:text-sm text-[var(--color-ink-muted)] italic my-4"
                  >
                    <p>{block.text}</p>
                    {block.author && (
                      <cite className="block mt-2 text-xs font-semibold not-italic text-[var(--color-ink)]">
                        — {block.author}
                      </cite>
                    )}
                  </blockquote>
                );

              case "faq":
                return (
                  <div
                    key={i}
                    className="border border-[var(--color-rule)] rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-4 my-4 space-y-2"
                  >
                    <h3 className="font-bold text-sm sm:text-base text-[var(--color-ink)] flex items-start gap-2">
                      <span className="text-[var(--color-brand)] font-black text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--color-brand-light)] border border-[var(--color-brand)]/20 mt-0.5 shrink-0">
                        FAQ
                      </span>
                      <span>{block.question}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed pl-7">
                      {block.answer}
                    </p>
                  </div>
                );

              case "link":
                return (
                  <p key={i} className="my-2">
                    <a
                      href={block.url}
                      target={block.url.startsWith("http") ? "_blank" : undefined}
                      rel={block.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-[var(--color-brand)] hover:underline font-semibold"
                    >
                      {block.text} →
                    </a>
                  </p>
                );

              case "image":
                return (
                  <figure key={i} className="my-6 space-y-2">
                    <div className="relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-[var(--color-surface-sunken)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={block.src}
                        alt={block.alt || article.title}
                        loading="lazy"
                        className="w-full h-auto max-h-[580px] object-contain mx-auto"
                        width={block.width}
                        height={block.height}
                      />
                    </div>
                    {block.caption && (
                      <figcaption className="text-center text-xs text-[var(--color-ink-muted)] italic px-4">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );

              case "paragraph":
              default:
                return (
                  <p key={i} className="leading-relaxed">
                    {block.text}
                  </p>
                );
            }
          });
        })()}
      </div>

      {/* Byline / Source attribution */}
      <div className="mt-8 pt-4 border-t border-[var(--color-rule)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-ink-muted)]">
        <span>
          By <strong className="text-[var(--color-ink)]">{article.author}</strong>
        </span>
        <span>Source: {article.source}</span>
      </div>
    </article>
  );
}

/* ── Related team / match links ────────────────────────────────────────── */
function RelatedLinks({ article }: { article: NewsArticle }) {
  const hasTeams = article.relatedTeamIds && article.relatedTeamIds.length > 0;
  const hasMatch = Boolean(article.relatedMatchSlug);

  if (!hasTeams && !hasMatch) return null;

  return (
    <aside
      aria-label="Related Coverage Links"
      className="max-w-2xl mx-auto rounded-lg border border-[var(--color-rule)] bg-[var(--color-surface)] p-4 text-xs"
    >
      <p className="font-bold text-[var(--color-ink)] mb-2 uppercase tracking-wider text-[11px]">
        Related Coverage
      </p>
      <div className="flex flex-wrap gap-2">
        {article.relatedTeamIds?.map((tId) => (
          <Link
            key={tId}
            href={`/teams/${tId}`}
            className="inline-flex items-center gap-1 rounded bg-[var(--color-surface-sunken)] px-2.5 py-1 text-[var(--color-brand)] font-semibold hover:bg-[var(--color-brand-light)] transition-colors"
          >
            {TEAM_NAMES[tId] ?? tId} →
          </Link>
        ))}
        {article.relatedMatchSlug && (
          <Link
            href={`/matches/${article.relatedMatchSlug}`}
            className="inline-flex items-center gap-1 rounded bg-[var(--color-surface-sunken)] px-2.5 py-1 text-[var(--color-brand)] font-semibold hover:bg-[var(--color-brand-light)] transition-colors"
          >
            Match Scorecard →
          </Link>
        )}
      </div>
    </aside>
  );
}

/* ── Related articles footer ───────────────────────────────────────────── */
async function MoreArticles({ currentSlug }: { currentSlug: string }) {
  const all = await getAllArticles();
  const others = all
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
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  /* Schema.org NewsArticle structured data */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.metaDescription ?? article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "NPL Hub Nepal",
      url: siteUrl,
    },
    url: `${siteUrl}/news/${article.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/news/${article.slug}`,
    },
    ...(article.imageUrl && {
      image: {
        "@type": "ImageObject",
        url: `${siteUrl}${article.imageUrl}`,
        width: 1200,
        height: 630,
        ...(article.imageAlt && { caption: article.imageAlt }),
      },
    }),
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

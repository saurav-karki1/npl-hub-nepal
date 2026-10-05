import Link from "next/link";
import type { NewsArticle } from "@/lib/data/news-data";

interface NewsCardProps {
  article: NewsArticle;
  /** "featured" renders larger — for the top-of-page featured section */
  variant?: "default" | "featured";
}

/** Category colour accents */
const categoryColors: Record<string, string> = {
  Tournament: "text-[var(--color-brand)]",
  Teams: "text-emerald-600",
  Matches: "text-blue-600",
  "Points Table": "text-purple-600",
  Announcements: "text-amber-600",
};

export function NewsCard({ article, variant = "default" }: NewsCardProps) {
  const isFeatured = variant === "featured";
  const categoryClass =
    categoryColors[article.category] ?? "text-[var(--color-brand)]";

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-lg)]"
    >
      <article
        className={[
          "h-full flex flex-col",
          "bg-[var(--color-canvas)] border border-[var(--color-rule)]",
          "rounded-[var(--radius-lg)]",
          "hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-card)]",
          "transition-[border-color,box-shadow] duration-150",
          isFeatured ? "p-6" : "p-5",
        ].join(" ")}
      >
        {/* Draft badge */}
        {article.status === "draft" && (
          <div className="mb-3">
            <span className="inline-block px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider rounded bg-amber-100 text-amber-700">
              Provisional — pending official announcement
            </span>
          </div>
        )}

        {/* Category + date bar */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span
            className={`font-bold uppercase tracking-wider text-[11px] ${categoryClass}`}
          >
            {article.category}
          </span>
          <time
            dateTime={article.publishedAt}
            className="text-[var(--color-ink-muted)]"
          >
            {article.displayDate}
          </time>
        </div>

        {/* Featured Image Thumbnail */}
        {article.imageUrl && (
          <div className="relative w-full aspect-[16/9] mb-3 rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface-sunken)] border border-[var(--color-rule)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Headline */}
        <h3
          className={[
            "font-bold text-[var(--color-ink)] group-hover:text-[var(--color-brand)]",
            "transition-colors line-clamp-2 leading-snug",
            isFeatured ? "text-lg" : "text-base",
          ].join(" ")}
        >
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-2.5 text-xs text-[var(--color-ink-secondary)] leading-relaxed line-clamp-3 flex-1">
          {article.excerpt}
        </p>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--color-rule)] flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
          <span>{article.readTime}</span>
          <span className="font-semibold text-[var(--color-brand)] group-hover:translate-x-0.5 transition-transform">
            Read Story →
          </span>
        </div>
      </article>
    </Link>
  );
}

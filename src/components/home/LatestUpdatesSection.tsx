import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { getAllArticlesSync } from "@/lib/repository/news";

export function LatestUpdatesSection() {
  const latestArticles = getAllArticlesSync().slice(0, 4);

  return (
    <section>
      <SectionHeader
        title="Latest Updates"
        action={{ label: "All News →", href: "/news" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {latestArticles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-lg)]"
          >
            <Card
              interactive
              className="h-full border-[var(--color-rule)] group-hover:border-[var(--color-brand)] transition-colors"
            >
              <CardBody className="p-5 flex flex-col justify-between h-full">
                <div>
                  {/* Category and date bar */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold uppercase tracking-wider text-[var(--color-brand)] text-[11px]">
                      {article.category}
                    </span>
                    <span className="text-[var(--color-ink-muted)]">
                      {article.displayDate}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="font-bold text-[var(--color-ink)] text-base group-hover:text-[var(--color-brand)] transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="mt-2.5 text-xs text-[var(--color-ink-secondary)] leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>

                {/* Footer read time */}
                <div className="mt-4 pt-3 border-t border-[var(--color-rule)] flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                  <span>{article.readTime}</span>
                  <span className="font-semibold text-[var(--color-brand)] group-hover:translate-x-0.5 transition-transform">
                    Read Story →
                  </span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

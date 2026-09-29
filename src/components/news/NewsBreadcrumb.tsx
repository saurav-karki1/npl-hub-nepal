import Link from "next/link";

interface NewsBreadcrumbProps {
  /** Optional article title — when provided renders a 3-level breadcrumb */
  articleTitle?: string;
}

export function NewsBreadcrumb({ articleTitle }: NewsBreadcrumbProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: articleTitle
      ? [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://nplhub.com.np",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "News",
            item: "https://nplhub.com.np/news",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: articleTitle,
          },
        ]
      : [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://nplhub.com.np",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "News & Updates",
            item: "https://nplhub.com.np/news",
          },
        ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-ink-muted)]">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link
              href="/"
              className="hover:text-[var(--color-brand)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-xs"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-[var(--color-ink-faint)]">
            /
          </li>
          {articleTitle ? (
            <>
              <li>
                <Link
                  href="/news"
                  className="hover:text-[var(--color-brand)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-xs"
                >
                  News
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--color-ink-faint)]">
                /
              </li>
              <li
                className="font-semibold text-[var(--color-ink)] truncate max-w-[200px] sm:max-w-xs"
                aria-current="page"
              >
                {articleTitle}
              </li>
            </>
          ) : (
            <li
              className="font-semibold text-[var(--color-ink)]"
              aria-current="page"
            >
              News & Updates
            </li>
          )}
        </ol>
      </nav>
    </>
  );
}

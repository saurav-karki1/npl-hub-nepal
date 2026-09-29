import Link from "next/link";

export function AboutBreadcrumb() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://nplhub.com.np",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About & Information Hub",
        item: "https://nplhub.com.np/about",
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
          <li
            className="font-semibold text-[var(--color-ink)]"
            aria-current="page"
          >
            About & NPL Information Hub
          </li>
        </ol>
      </nav>
    </>
  );
}

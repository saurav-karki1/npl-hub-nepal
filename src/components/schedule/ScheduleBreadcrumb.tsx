import Link from "next/link";

export function ScheduleBreadcrumb() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nplhubnepal.vercel.app";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Schedule & Fixtures",
        item: `${siteUrl}/schedule`,
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
            Schedule & Fixtures
          </li>
        </ol>
      </nav>
    </>
  );
}

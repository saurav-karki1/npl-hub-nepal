import Link from "next/link";
import { ScheduleMatch, resolveMatchTeams } from "@/lib/repository/matches";

interface MatchBreadcrumbProps {
  match: ScheduleMatch;
}

export function MatchBreadcrumb({ match }: MatchBreadcrumbProps) {
  const { team1, team2 } = resolveMatchTeams(match);
  const matchLabel = `Match #${match.matchNumber}: ${team1.shortName || team1.name} vs ${team2.shortName || team2.name}`;

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
        name: "Schedule",
        item: "https://nplhub.com.np/schedule",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: matchLabel,
        item: `https://nplhub.com.np/matches/${match.slug}`,
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
          <li>
            <Link
              href="/schedule"
              className="hover:text-[var(--color-brand)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-xs"
            >
              Schedule
            </Link>
          </li>
          <li aria-hidden="true" className="text-[var(--color-ink-faint)]">
            /
          </li>
          <li
            className="font-semibold text-[var(--color-ink)] truncate max-w-[280px] sm:max-w-md"
            aria-current="page"
          >
            Match #{match.matchNumber} · {match.stage}
          </li>
        </ol>
      </nav>
    </>
  );
}

import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";

interface RelatedLink {
  title: string;
  description: string;
  href: string;
  badge: string;
}

const RELATED_LINKS: RelatedLink[] = [
  {
    title: "NPL Franchise Teams",
    description: "Explore all 8 franchise squads, player rosters, and home stadium information.",
    href: "/teams",
    badge: "Teams & Squads",
  },
  {
    title: "Points Table & Standings",
    description: "Track team rankings, points, net run rates (NRR), and playoff qualification race.",
    href: "/points-table",
    badge: "Standings",
  },
  {
    title: "Latest NPL News & Updates",
    description: "Stay informed on player drafts, broadcast guides, ticketing, and tournament reports.",
    href: "/news",
    badge: "Editorial News",
  },
  {
    title: "About NPL Hub Nepal",
    description: "Learn more about our independent platform mission, editorial policy, and cricket coverage.",
    href: "/about",
    badge: "Platform",
  },
];

export function RelatedLinksSection() {
  return (
    <section aria-labelledby="related-navigation-heading" className="space-y-4 pt-4 border-t border-[var(--color-rule)]">
      <SectionHeader title="Explore NPL Hub Nepal" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {RELATED_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-lg)]"
          >
            <Card
              interactive
              className="h-full border-[var(--color-rule)] group-hover:border-[var(--color-brand)] transition-colors"
            >
              <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)]">
                    {item.badge}
                  </span>
                  <h3 className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors mt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="text-xs font-semibold text-[var(--color-brand)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Visit page</span>
                  <span>→</span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

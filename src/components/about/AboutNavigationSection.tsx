import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";

export function AboutNavigationSection() {
  const exploreLinks = [
    {
      title: "Franchise Teams",
      description:
        "Explore all 8 team profiles, regional backgrounds, confirmed captains, and squad announcements.",
      href: "/teams",
      badge: "8 Franchises",
    },
    {
      title: "Players Directory",
      description:
        "Verified profiles, playing roles, batting/bowling styles, and leadership rosters across all 8 teams.",
      href: "/players",
      badge: "53 Players",
    },
    {
      title: "Full Match Schedule",
      description:
        "All 32 fixtures with Bikram Sambat dates, match times in NPT, stage breakdowns, and team filters.",
      href: "/schedule",
      badge: "32 Fixtures",
    },
    {
      title: "Points Table & Standings",
      description:
        "Live standings, wins, losses, Net Run Rates (NRR), and top-4 Page-Playoff qualification scenarios.",
      href: "/points-table",
      badge: "Playoff Race",
    },
    {
      title: "News & Tournament Updates",
      description:
        "Independent reporting on draft announcements, stadium preparations, and editorial cricket insights.",
      href: "/news",
      badge: "Editorial Media",
    },
    {
      title: "Individual Match Pages",
      description:
        "Dedicated match centers for every fixture with team crests, head-to-head info, and result-ready scorecards.",
      href: "/matches/match-1-lumbini-lions-vs-sudurpaschim-royals",
      badge: "Match Centers",
    },
  ];

  return (
    <section aria-labelledby="explore-npl-heading" className="space-y-4 pt-4 border-t border-[var(--color-rule)]">
      <SectionHeader title="Explore NPL Season 3" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {exploreLinks.map((item) => (
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)] block">
                    {item.badge}
                  </span>
                  <h3 className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors mt-1 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-1.5 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>
                <div className="text-xs font-semibold text-[var(--color-brand)] flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-1">
                  <span>Visit page</span>
                  <span aria-hidden="true">→</span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

import Link from "next/link";
import { Player, getPlayerTeam } from "@/lib/data/players-data";
import { getArticlesByTeam } from "@/lib/data/news-data";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";

interface PlayerRelatedNewsProps {
  player: Player;
}

export function PlayerRelatedNews({ player }: PlayerRelatedNewsProps) {
  const team = getPlayerTeam(player);
  if (!team) return null;

  const articles = getArticlesByTeam(team.id).slice(0, 3);
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="player-news-heading" className="space-y-4">
      <SectionHeader
        title={`Related Updates & News for ${player.name}`}
        action={{ label: "All News →", href: "/news" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-lg)]"
          >
            <Card
              interactive
              className="h-full border-[var(--color-rule)] group-hover:border-[var(--color-brand)] transition-colors flex flex-col justify-between"
            >
              <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-muted)]">
                    <span className="font-bold text-[var(--color-brand)] uppercase tracking-wider">
                      {article.category}
                    </span>
                    <span>{article.displayDate}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                  <p className="text-xs text-[var(--color-ink-secondary)] line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--color-rule)] text-xs font-semibold text-[var(--color-brand)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Read update</span>
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

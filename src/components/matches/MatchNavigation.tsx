import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { ScheduleMatch, resolveMatchTeams } from "@/lib/repository/matches";

interface MatchNavigationProps {
  prevMatch?: ScheduleMatch;
  nextMatch?: ScheduleMatch;
}

export function MatchNavigation({ prevMatch, nextMatch }: MatchNavigationProps) {
  const prevTeams = prevMatch ? resolveMatchTeams(prevMatch) : undefined;
  const nextTeams = nextMatch ? resolveMatchTeams(nextMatch) : undefined;

  return (
    <nav
      aria-label="Match sequence navigation"
      className="pt-6 border-t border-[var(--color-rule)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
    >
      {/* Previous Match Link */}
      <div className="flex-1">
        {prevMatch && prevTeams ? (
          <Link
            href={`/matches/${prevMatch.slug}`}
            className="group block p-3.5 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] hover:border-[var(--color-brand)] transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] group-hover:text-[var(--color-brand)] transition-colors block">
              ← Previous Match
            </span>
            <span className="font-bold text-xs sm:text-sm text-[var(--color-ink)] line-clamp-1 mt-0.5">
              Match #{prevMatch.matchNumber} · {prevTeams.team1.shortName || prevTeams.team1.name} vs {prevTeams.team2.shortName || prevTeams.team2.name}
            </span>
            <span className="text-[10px] text-[var(--color-ink-muted)] block mt-0.5">
              {prevMatch.formattedDate} · {prevMatch.time}
            </span>
          </Link>
        ) : (
          <div className="p-3.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-rule)] bg-[var(--color-canvas)] text-center text-xs text-[var(--color-ink-faint)]">
            Opening Match (No previous fixture)
          </div>
        )}
      </div>

      {/* Back to Schedule Button */}
      <div className="shrink-0 text-center">
        <LinkButton href="/schedule" variant="primary" size="md">
          📅 Full Schedule (32 Matches)
        </LinkButton>
      </div>

      {/* Next Match Link */}
      <div className="flex-1">
        {nextMatch && nextTeams ? (
          <Link
            href={`/matches/${nextMatch.slug}`}
            className="group block p-3.5 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] hover:border-[var(--color-brand)] transition-colors text-right"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] group-hover:text-[var(--color-brand)] transition-colors block">
              Next Match →
            </span>
            <span className="font-bold text-xs sm:text-sm text-[var(--color-ink)] line-clamp-1 mt-0.5">
              Match #{nextMatch.matchNumber} · {nextTeams.team1.shortName || nextTeams.team1.name} vs {nextTeams.team2.shortName || nextTeams.team2.name}
            </span>
            <span className="text-[10px] text-[var(--color-ink-muted)] block mt-0.5">
              {nextMatch.formattedDate} · {nextMatch.time}
            </span>
          </Link>
        ) : (
          <div className="p-3.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-rule)] bg-[var(--color-canvas)] text-center text-xs text-[var(--color-ink-faint)]">
            Tournament Final (Final fixture)
          </div>
        )}
      </div>
    </nav>
  );
}

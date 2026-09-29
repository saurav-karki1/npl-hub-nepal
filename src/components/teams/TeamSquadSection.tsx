import Link from "next/link";
import { SectionHeader } from "@/components/ui/Layout";
import { Card, CardBody } from "@/components/ui/Card";
import { TeamDetail } from "@/lib/data/teams-data";
import { getPlayersByTeam } from "@/lib/data/players-data";

interface TeamSquadSectionProps {
  team: TeamDetail;
}

export function TeamSquadSection({ team }: TeamSquadSectionProps) {
  const verifiedPlayers = getPlayersByTeam(team.id);

  const roleBadgeColors: Record<string, string> = {
    Batter: "bg-blue-50 text-blue-800 border-blue-200",
    Bowler: "bg-emerald-50 text-emerald-800 border-emerald-200",
    "All-rounder": "bg-purple-50 text-purple-800 border-purple-200",
    Wicketkeeper: "bg-amber-50 text-amber-900 border-amber-200",
  };

  return (
    <section aria-labelledby="squad-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={`Season 3 Squad & Roster (${verifiedPlayers.length} Confirmed)`}
          action={{ label: "View All NPL Players →", href: "/players" }}
        />
      </div>

      {verifiedPlayers.length > 0 ? (
        <div className="space-y-4">
          {/* Verified Player Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {verifiedPlayers.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-[var(--radius-md)]"
              >
                <Card
                  interactive
                  className="h-full border-[var(--color-rule)] group-hover:border-[var(--color-brand)] transition-colors"
                >
                  <CardBody className="p-3.5 flex flex-col justify-between h-full space-y-2">
                    <div>
                      {/* Leadership / Role Badges */}
                      <div className="flex flex-wrap items-center gap-1 mb-1.5">
                        {player.captain && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[#052618]">
                            Captain
                          </span>
                        )}
                        {player.marquee && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-amber-50 text-amber-800 border border-amber-200">
                            Marquee
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-sm)] border ${
                            roleBadgeColors[player.role] || "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {player.role}
                        </span>
                      </div>

                      {/* Name */}
                      <h4 className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors leading-snug">
                        {player.name}
                      </h4>

                      {/* Bat/Bowl quick info */}
                      <p className="text-[11px] text-[var(--color-ink-muted)] mt-1 truncate">
                        {player.bowlingStyle || player.battingStyle || player.nationality}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--color-rule)] flex items-center justify-between text-[11px] text-[var(--color-brand)] font-semibold">
                      <span>View Profile</span>
                      <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>

          {/* Data Accuracy Guarantee Note */}
          <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-3.5 text-xs text-[var(--color-ink-muted)] leading-relaxed flex items-start gap-2.5">
            <span
              className="w-4 h-4 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5"
              aria-hidden="true"
            >
              i
            </span>
            <div>
              <strong className="text-[var(--color-ink)] font-semibold">
                Confirmed Retained Roster:
              </strong>{" "}
              The {verifiedPlayers.length} players listed above represent the
              officially confirmed retained core for {team.name}. Additional domestic
              draft selections and overseas player signings will appear here
              immediately following official verification by CAN and franchise
              management.
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Pending Announcement */
        <Card className="border-[var(--color-rule)] bg-[var(--color-surface)]">
          <CardBody className="p-6 sm:p-8 text-center space-y-4">
            <div
              className="w-12 h-12 rounded-full bg-[var(--color-canvas)] border border-[var(--color-rule)] text-[var(--color-ink-muted)] flex items-center justify-center mx-auto text-xl"
              aria-hidden="true"
            >
              📋
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-bold text-base text-[var(--color-ink)]">
                {team.squadStatus}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                Official player roster, domestic draft picks, and overseas
                international signings for {team.name} have not yet been officially
                released by team management.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--color-rule)] max-w-lg mx-auto text-left flex items-start gap-3 bg-[var(--color-canvas)] p-3.5 rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              <span
                className="w-4 h-4 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5"
                aria-hidden="true"
              >
                i
              </span>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                <strong className="text-[var(--color-ink)] font-semibold">
                  Data Accuracy Guarantee:
                </strong>{" "}
                We do not publish placeholder rosters or unconfirmed squad leaks.
                The full roster will appear here immediately after the official
                Cricket Association of Nepal (CAN) player registration window closes.
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </section>
  );
}

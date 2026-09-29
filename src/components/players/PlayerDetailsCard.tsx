import { Player, getPlayerTeam } from "@/lib/data/players-data";
import { Card, CardBody } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Layout";

interface PlayerDetailsCardProps {
  player: Player;
}

export function PlayerDetailsCard({ player }: PlayerDetailsCardProps) {
  const team = getPlayerTeam(player);

  const profileSpecs = [
    {
      label: "Full Name",
      value: player.name,
    },
    {
      label: "Franchise Team",
      value: team ? team.name : "Unassigned",
    },
    {
      label: "Playing Role",
      value: player.role,
    },
    {
      label: "Nationality",
      value: player.nationality,
    },
    {
      label: "Batting Style",
      value: player.battingStyle || "Not yet available",
    },
    {
      label: "Bowling Style",
      value: player.bowlingStyle || "Not yet available",
    },
    ...(player.dateOfBirth
      ? [
          {
            label: "Date of Birth",
            value: player.dateOfBirth,
          },
        ]
      : []),
    ...(player.birthPlace
      ? [
          {
            label: "Birthplace",
            value: player.birthPlace,
          },
        ]
      : []),
    {
      label: "Leadership & Role",
      value: player.captain
        ? "Team Captain & Primary Leader"
        : player.marquee
        ? "Marquee Player"
        : "Squad Player",
    },
    {
      label: "Data Verification Source",
      value: player.source || "Official Franchise Announcement",
    },
  ];

  return (
    <section aria-labelledby="player-profile-specs-heading" className="space-y-4">
      <SectionHeader title="Player Profile & Verification Details" />

      {/* Bio paragraph if verified */}
      {player.bio && (
        <Card className="border-[var(--color-rule)] bg-[var(--color-surface)]">
          <CardBody className="p-4 sm:p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-brand)] mb-2">
              Player Overview
            </h3>
            <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
              {player.bio}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Structured Factsheet Card */}
      <Card className="border-[var(--color-rule)] overflow-hidden">
        <div className="bg-[var(--color-surface)] px-4 py-3 border-b border-[var(--color-rule)]">
          <h3 className="font-bold text-sm text-[var(--color-ink)]">
            Verified Specifications
          </h3>
        </div>
        <CardBody className="p-0">
          <dl className="divide-y divide-[var(--color-rule)]">
            {profileSpecs.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-3 px-4 py-3 sm:py-3.5 hover:bg-[var(--color-surface)]/50 transition-colors"
              >
                <dt className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  {item.label}
                </dt>
                <dd className="sm:col-span-2 text-xs sm:text-sm font-medium text-[var(--color-ink)] mt-0.5 sm:mt-0">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </section>
  );
}

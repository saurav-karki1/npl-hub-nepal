"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { SeasonId, SeasonStatsDataset, SeasonOption } from "@/lib/data/stats-types";
import type { TeamDetail } from "@/lib/data/teams-data";
import { StatsHero } from "./StatsHero";
import { TournamentOverviewSection } from "./TournamentOverviewSection";
import { FinalStandingsTable } from "./FinalStandingsTable";
import { TournamentAwardsGrid } from "./TournamentAwardsGrid";
import { PlayerLeaderboardsSection } from "./PlayerLeaderboardsSection";
import { PlayoffsSection } from "./PlayoffsSection";
import { VerifiedPlayerStatsTable } from "./VerifiedPlayerStatsTable";
import { VerifiedMatchesSection } from "./VerifiedMatchesSection";
import { PreTournamentStatsState } from "./PreTournamentStatsState";
import { LinkButton } from "@/components/ui/Button";

interface StatsHubClientProps {
  initialSeasonId?: SeasonId;
  datasets: Record<SeasonId, SeasonStatsDataset>;
  availableSeasons: SeasonOption[];
  allTeams?: TeamDetail[];
}

export function StatsHubClient({
  initialSeasonId = "season-2",
  datasets,
  availableSeasons,
  allTeams,
}: StatsHubClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Initialize season from URL query param or default to initialSeasonId (season-2)
  const querySeason = searchParams.get("season");
  const validSeason =
    querySeason && querySeason in datasets ? (querySeason as SeasonId) : initialSeasonId;

  const [selectedSeasonId, setSelectedSeasonId] = useState<SeasonId>(validSeason);

  // Sync if query param changes externally
  const [prevQuerySeason, setPrevQuerySeason] = useState<string | null>(querySeason);
  if (querySeason !== prevQuerySeason) {
    setPrevQuerySeason(querySeason);
    if (querySeason && querySeason in datasets && querySeason !== selectedSeasonId) {
      setSelectedSeasonId(querySeason as SeasonId);
    }
  }

  const handleSelectSeason = (seasonId: SeasonId) => {
    setSelectedSeasonId(seasonId);
    startTransition(() => {
      const url = seasonId === "season-2" ? "/stats" : `/stats?season=${seasonId}`;
      router.replace(url, { scroll: false });
    });
  };

  const currentDataset = datasets[selectedSeasonId] ?? datasets[initialSeasonId];
  const isCompleted = currentDataset.status === "completed";

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
      {/* ── 1. Stats Hero Header with Season Selector ── */}
      <StatsHero
        currentDataset={currentDataset}
        selectedSeasonId={selectedSeasonId}
        onSelectSeason={handleSelectSeason}
        availableSeasons={availableSeasons}
        allTeams={allTeams}
      />

      {/* ── 2. Content for Selected Season ── */}
      {isCompleted ? (
        /* Season 2 (Verified Historical Records) */
        <div id={`stats-panel-${selectedSeasonId}`} className="space-y-10 sm:space-y-12">
          {/* Section 1: Tournament Overview */}
          <TournamentOverviewSection summary={currentDataset.summary} />

          {/* Section 2: Authoritative Final League Points Table */}
          <FinalStandingsTable
            standings={currentDataset.standings}
            seasonName={currentDataset.seasonName}
          />

          {/* Section 3: Tournament Awards */}
          <TournamentAwardsGrid
            awards={currentDataset.awards}
            seasonName={currentDataset.seasonName}
          />

          {/* Section 4: Verified Player Leaderboards */}
          <PlayerLeaderboardsSection
            leaderboards={currentDataset.leaderboards}
            seasonName={currentDataset.seasonName}
          />

          {/* Section 5: Playoff Results */}
          <PlayoffsSection
            playoffs={currentDataset.playoffs}
            seasonName={currentDataset.seasonName}
          />

          {/* Section 6: Verified Player Statistics Table */}
          <VerifiedPlayerStatsTable
            playerStats={currentDataset.playerStats}
            seasonName={currentDataset.seasonName}
          />

          {/* Section 7: Verified League Scorecards */}
          <VerifiedMatchesSection
            matches={currentDataset.verifiedLeagueMatches}
            seasonName={currentDataset.seasonName}
          />
        </div>
      ) : (
        /* Season 3 (Pre-Tournament State) */
        <div id={`stats-panel-${selectedSeasonId}`} className="space-y-10 sm:space-y-12">
          <PreTournamentStatsState dataset={currentDataset} />
        </div>
      )}

      {/* ── 3. Bottom Navigation ── */}
      <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
        <LinkButton href="/" variant="secondary" size="sm">
          ← Back to Home
        </LinkButton>
        <div className="flex flex-wrap items-center gap-2">
          <LinkButton href="/schedule" variant="ghost" size="sm">
            Match Schedule →
          </LinkButton>
          <LinkButton href="/teams" variant="ghost" size="sm">
            Franchise Teams →
          </LinkButton>
          <LinkButton href="/points-table" variant="primary" size="sm">
            Season 3 Points Table →
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

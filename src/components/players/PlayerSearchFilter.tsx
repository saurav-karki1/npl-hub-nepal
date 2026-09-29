"use client";

import { useState, useMemo } from "react";
import { Player, PlayerRole } from "@/lib/data/players-data";
import { TeamDetail } from "@/lib/data/teams-data";
import { PlayerCard } from "./PlayerCard";

interface PlayerSearchFilterProps {
  initialPlayers: Player[];
  teams: TeamDetail[];
}

export function PlayerSearchFilter({
  initialPlayers,
  teams,
}: PlayerSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedSpecial, setSelectedSpecial] = useState<string>("all");

  const roles: PlayerRole[] = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];

  const filteredPlayers = useMemo(() => {
    return initialPlayers.filter((player) => {
      // Search by name
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = player.name.toLowerCase().includes(query);
        const matchesTeam = teams
          .find((t) => t.id === player.teamId)
          ?.name.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesTeam) {
          return false;
        }
      }

      // Filter by team
      if (selectedTeam !== "all" && player.teamId !== selectedTeam) {
        return false;
      }

      // Filter by role
      if (selectedRole !== "all" && player.role !== selectedRole) {
        return false;
      }

      // Filter by special status (Captains / Marquee)
      if (selectedSpecial === "captain" && !player.captain) {
        return false;
      }
      if (selectedSpecial === "marquee" && !player.marquee) {
        return false;
      }

      return true;
    });
  }, [initialPlayers, teams, searchQuery, selectedTeam, selectedRole, selectedSpecial]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedTeam !== "all" ||
    selectedRole !== "all" ||
    selectedSpecial !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTeam("all");
    setSelectedRole("all");
    setSelectedSpecial("all");
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-4 sm:p-5 space-y-4">
        {/* Search Input Bar */}
        <div>
          <label
            htmlFor="player-search"
            className="block text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5"
          >
            Search Players
          </label>
          <div className="relative">
            <input
              id="player-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by player name or franchise (e.g. Sandeep, Rohit, Biratnagar)..."
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Team Filter */}
          <div>
            <label
              htmlFor="team-filter"
              className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1"
            >
              Franchise Team
            </label>
            <select
              id="team-filter"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-canvas)] px-3 py-2 text-xs sm:text-sm text-[var(--color-ink)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            >
              <option value="all">All 8 Franchises</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label
              htmlFor="role-filter"
              className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1"
            >
              Playing Role
            </label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-canvas)] px-3 py-2 text-xs sm:text-sm text-[var(--color-ink)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}s
                </option>
              ))}
            </select>
          </div>

          {/* Special Status Filter */}
          <div>
            <label
              htmlFor="special-filter"
              className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1"
            >
              Category / Leadership
            </label>
            <select
              id="special-filter"
              value={selectedSpecial}
              onChange={(e) => setSelectedSpecial(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-canvas)] px-3 py-2 text-xs sm:text-sm text-[var(--color-ink)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            >
              <option value="all">All Players</option>
              <option value="captain">Team Captains Only</option>
              <option value="marquee">Marquee Players Only</option>
            </select>
          </div>
        </div>

        {/* Results Bar and Active Filter Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-rule)] text-xs text-[var(--color-ink-muted)]">
          <div>
            Showing <strong className="text-[var(--color-ink)]">{filteredPlayers.length}</strong> of{" "}
            <span>{initialPlayers.length}</span> verified players
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="font-semibold text-[var(--color-brand)] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Players Card Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--color-canvas)] border border-[var(--color-rule)] text-[var(--color-ink-muted)] flex items-center justify-center mx-auto text-xl" aria-hidden="true">
            🔍
          </div>
          <h3 className="font-bold text-base text-[var(--color-ink)]">
            No matching players found
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] max-w-md mx-auto leading-relaxed">
            We couldn’t find any verified players matching your current search or filter combination.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center justify-center px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-mid)] transition-colors cursor-pointer mt-2"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

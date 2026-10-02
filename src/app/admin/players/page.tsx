"use client";

/**
 * NPL Hub Nepal — Admin Players Management Page
 *
 * Displays all verified NPL players from Supabase with franchise affiliations and roles.
 * Allows editing core player profile identity and season-specific roster assignments.
 * All writes go through the secure /api/admin/players route (service-role, server-side).
 * No hard delete — players have FK references in player_seasons and historical records.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import {
  getAllPlayersAdmin,
  updatePlayerAdmin,
  AdminPlayerRow,
  AdminPlayerSeasonRow,
  UpdatePlayerInput,
  PlayerRole,
  PlayerStatus,
  PlayerConfidence,
} from "@/lib/repository/players";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEASONS = [
  { id: "season-3", label: "Season 3 (2026)" },
  { id: "season-2", label: "Season 2 (2025)" },
];

const ROLES: PlayerRole[] = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];

const FRANCHISES = [
  { id: "biratnagar-kings", name: "Biratnagar Kings", short_name: "BK", brand_color: "#0284c7" },
  { id: "chitwan-rhinos", name: "Chitwan Rhinos", short_name: "CR", brand_color: "#059669" },
  { id: "janakpur-bolts", name: "Janakpur Bolts", short_name: "JB", brand_color: "#d97706" },
  { id: "karnali-yaks", name: "Karnali Yaks", short_name: "KY", brand_color: "#4f46e5" },
  { id: "kathmandu-gorkhas", name: "Kathmandu Gorkhas", short_name: "KG", brand_color: "#b91c1c" },
  { id: "lumbini-lions", name: "Lumbini Lions", short_name: "LL", brand_color: "#1d4ed8" },
  { id: "pokhara-avengers", name: "Pokhara Avengers", short_name: "PA", brand_color: "#0891b2" },
  { id: "sudurpaschim-royals", name: "Sudurpaschim Royals", short_name: "SR", brand_color: "#b45309" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPlayerSeason(player: AdminPlayerRow, seasonId: string): AdminPlayerSeasonRow | undefined {
  return player.player_seasons.find((ps) => ps.season_id === seasonId);
}

// ---------------------------------------------------------------------------
// Form State Interface
// ---------------------------------------------------------------------------

interface EditPlayerFormState {
  name: string;
  displayName: string;
  nationality: string;
  dateOfBirth: string;
  birthPlace: string;
  battingStyle: string;
  bowlingStyle: string;
  profileImage: string;
  bio: string;
  // Season association
  teamId: string;
  role: PlayerRole;
  status: PlayerStatus;
  captain: boolean;
  marquee: boolean;
  playerNumber: string;
  confidence: PlayerConfidence;
  source: string;
  sourceUrl: string;
  sourceDate: string;
}

function buildEditPlayerForm(player: AdminPlayerRow, seasonId: string): EditPlayerFormState {
  const ps = getPlayerSeason(player, seasonId);
  return {
    name: player.name,
    displayName: player.display_name ?? "",
    nationality: player.nationality ?? "Nepali",
    dateOfBirth: player.date_of_birth ?? "",
    birthPlace: player.birth_place ?? "",
    battingStyle: player.batting_style ?? "",
    bowlingStyle: player.bowling_style ?? "",
    profileImage: player.profile_image ?? "",
    bio: player.bio ?? "",
    teamId: ps?.team_id ?? (FRANCHISES[0]?.id || ""),
    role: ps?.role ?? "All-rounder",
    status: ps?.status ?? "confirmed",
    captain: ps?.captain ?? false,
    marquee: ps?.marquee ?? false,
    playerNumber: ps?.player_number !== null && ps?.player_number !== undefined ? String(ps.player_number) : "",
    confidence: ps?.confidence ?? "confirmed",
    source: ps?.source ?? "",
    sourceUrl: ps?.source_url ?? "",
    sourceDate: ps?.source_date ?? "",
  };
}

// ---------------------------------------------------------------------------
// UI Primitives
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  note?: string;
  textarea?: boolean;
  required?: boolean;
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  note,
  textarea,
  required,
}: FormFieldProps) {
  const base =
    "w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors";
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {textarea ? (
        <textarea
          className={`${base} resize-none`}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Panel
// ---------------------------------------------------------------------------

interface EditPanelProps {
  player: AdminPlayerRow;
  seasonId: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (updated: AdminPlayerRow) => void;
}

function EditPanel({ player, seasonId, accessToken, onClose, onSaved }: EditPanelProps) {
  const [form, setForm] = useState<EditPlayerFormState>(() => buildEditPlayerForm(player, seasonId));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function setField<K extends keyof EditPlayerFormState>(key: K, val: EditPlayerFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError("Player name is required.");
      return;
    }

    if (!form.teamId) {
      setSaveError("Franchise team assignment is required.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const input: UpdatePlayerInput = {
      playerId: player.id,
      seasonId,
      name: form.name.trim(),
      displayName: form.displayName.trim() || null,
      nationality: form.nationality.trim() || "Nepali",
      dateOfBirth: form.dateOfBirth.trim() || null,
      birthPlace: form.birthPlace.trim() || null,
      battingStyle: form.battingStyle.trim() || null,
      bowlingStyle: form.bowlingStyle.trim() || null,
      profileImage: form.profileImage.trim() || null,
      bio: form.bio.trim() || null,
      teamId: form.teamId,
      role: form.role,
      status: form.status,
      captain: form.captain,
      marquee: form.marquee,
      playerNumber: form.playerNumber.trim() ? parseInt(form.playerNumber.trim(), 10) : null,
      confidence: form.confidence,
      source: form.source.trim() || null,
      sourceUrl: form.sourceUrl.trim() || null,
      sourceDate: form.sourceDate.trim() || null,
    };

    const { player: updated, error } = await updatePlayerAdmin(input, accessToken);

    setIsSaving(false);
    if (error) {
      setSaveError(error);
      return;
    }
    if (updated) {
      setSaveSuccess(true);
      onSaved(updated);
      setTimeout(onClose, 800);
    }
  }

  const seasonLabel = seasonId === "season-3" ? "Season 3 (2026)" : seasonId === "season-2" ? "Season 2 (2025)" : seasonId;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Slide Panel */}
      <div className="relative z-10 h-full w-full max-w-xl bg-[#0a0f1a] border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs">🏏</span>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Editing Player Profile
              </span>
            </div>
            <h2 className="text-lg font-black text-white leading-tight">{player.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Season context: <span className="text-white font-semibold">{seasonLabel}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none mt-1"
            aria-label="Close edit panel"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Section 1: Player Identity */}
          <section>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="inline-block w-4 h-px bg-emerald-400/40" />
              Player Identity &amp; Bio
            </h3>
            <div className="space-y-4">
              <FormField
                label="Full Name"
                value={form.name}
                onChange={(v) => setField("name", v)}
                required
                placeholder="e.g. Sandeep Lamichhane"
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Display Name"
                  value={form.displayName}
                  onChange={(v) => setField("displayName", v)}
                  placeholder="e.g. S Lamichhane"
                  note="Optional short scoreboard name"
                />
                <FormField
                  label="Nationality"
                  value={form.nationality}
                  onChange={(v) => setField("nationality", v)}
                  placeholder="e.g. Nepali"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Date of Birth"
                  value={form.dateOfBirth}
                  onChange={(v) => setField("dateOfBirth", v)}
                  type="date"
                  note="Format: YYYY-MM-DD"
                />
                <FormField
                  label="Birth Place"
                  value={form.birthPlace}
                  onChange={(v) => setField("birthPlace", v)}
                  placeholder="e.g. Syangja"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Batting Style"
                  value={form.battingStyle}
                  onChange={(v) => setField("battingStyle", v)}
                  placeholder="e.g. Right-hand bat"
                />
                <FormField
                  label="Bowling Style"
                  value={form.bowlingStyle}
                  onChange={(v) => setField("bowlingStyle", v)}
                  placeholder="e.g. Right-arm leg-break"
                />
              </div>
              <FormField
                label="Profile Image URL"
                value={form.profileImage}
                onChange={(v) => setField("profileImage", v)}
                placeholder="/images/players/sandeep-lamichhane.webp"
                note="Relative path from /public or valid HTTPS URL"
              />
              <FormField
                label="Biographical Note"
                value={form.bio}
                onChange={(v) => setField("bio", v)}
                textarea
                placeholder="Key career context or verified NPL milestone…"
              />
            </div>
          </section>

          {/* Section 2: Season Roster & Roles */}
          <section>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="inline-block w-4 h-px bg-blue-400/40" />
              {seasonLabel} Roster Assignment &amp; Status
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Franchise Team <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  value={form.teamId}
                  onChange={(e) => setField("teamId", e.target.value)}
                  required
                >
                  {FRANCHISES.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.short_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Playing Role <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={form.role}
                    onChange={(e) => setField("role", e.target.value as PlayerRole)}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Roster Status
                  </label>
                  <select
                    className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value as PlayerStatus)}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="reported">Reported</option>
                    <option value="not-announced">Not Announced</option>
                  </select>
                </div>
              </div>

              {/* Status toggles */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.captain}
                    onChange={(e) => setField("captain", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30 bg-[#080e1a]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Franchise Captain</span>
                    <span className="text-[10px] text-slate-400">Designates team captain</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.marquee}
                    onChange={(e) => setField("marquee", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500/30 bg-[#080e1a]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Marquee Player</span>
                    <span className="text-[10px] text-slate-400">Icon / Marquee signing</span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Jersey / Player Number"
                  value={form.playerNumber}
                  onChange={(v) => setField("playerNumber", v)}
                  type="number"
                  placeholder="e.g. 25"
                  note="Optional squad shirt number"
                />
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Confidence Level
                  </label>
                  <select
                    className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={form.confidence}
                    onChange={(e) => setField("confidence", e.target.value as PlayerConfidence)}
                  >
                    <option value="confirmed">Confirmed (Official)</option>
                    <option value="reported">Reported (Press)</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <FormField
                label="Information Source"
                value={form.source}
                onChange={(v) => setField("source", v)}
                placeholder="e.g. Cricket Association of Nepal Press Release"
              />
              <FormField
                label="Source URL"
                value={form.sourceUrl}
                onChange={(v) => setField("sourceUrl", v)}
                placeholder="https://..."
              />
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0 space-y-3">
          {saveError && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-3 py-2">
              ✓ Player changes saved to database successfully.
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-md py-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              onClick={handleSubmit}
              className="flex-1 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md py-2 transition-colors"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 text-center">
            Player records are safely updated in PostgreSQL. Historical match and statistics data are preserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player Row Component
// ---------------------------------------------------------------------------

interface PlayerRowProps {
  player: AdminPlayerRow;
  seasonId: string;
  onEdit: (player: AdminPlayerRow) => void;
}

function PlayerRow({ player, seasonId, onEdit }: PlayerRowProps) {
  const ps = getPlayerSeason(player, seasonId);
  const team = ps?.teams || FRANCHISES.find((f) => f.id === ps?.team_id);

  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start gap-4">
        {/* Role Icon or Avatar */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border"
          style={{
            backgroundColor: team?.brand_color ? `${team.brand_color}20` : "#1e293b",
            borderColor: team?.brand_color ? `${team.brand_color}50` : "#334155",
            color: team?.brand_color || "#38bdf8",
          }}
        >
          {team?.short_name || (ps?.role === "Bowler" ? "🎳" : ps?.role === "Wicketkeeper" ? "🧤" : "🏏")}
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white truncate">{player.name}</h3>
            {player.display_name && player.display_name !== player.name && (
              <span className="text-[11px] text-slate-400">({player.display_name})</span>
            )}
            <span className="text-[10px] font-mono text-slate-500">{player.slug}</span>
          </div>

          {/* Badges row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {/* Team badge */}
            {team ? (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: `${team.brand_color || "#0a5c36"}15`,
                  borderColor: `${team.brand_color || "#0a5c36"}40`,
                  color: team.brand_color || "#34d399",
                }}
              >
                {team.name}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 italic bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                Unassigned this season
              </span>
            )}

            {/* Role badge */}
            {ps && (
              <span className="text-[11px] text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                {ps.role}
              </span>
            )}

            {/* Captain badge */}
            {ps?.captain && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                CAPTAIN
              </span>
            )}

            {/* Marquee badge */}
            {ps?.marquee && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                MARQUEE
              </span>
            )}

            {/* Jersey number */}
            {ps?.player_number !== null && ps?.player_number !== undefined && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                #{ps.player_number}
              </span>
            )}

            {/* Confidence */}
            {ps?.confidence === "confirmed" ? (
              <span className="text-[10px] text-emerald-400/80 bg-emerald-500/5 px-1 rounded">
                verified
              </span>
            ) : ps?.confidence === "reported" ? (
              <span className="text-[10px] text-amber-400/80 bg-amber-500/5 px-1 rounded">
                reported
              </span>
            ) : null}
          </div>

          {/* Extra metadata */}
          <div className="mt-2 text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Nationality: {player.nationality || "Nepali"}</span>
            {player.batting_style && (
              <>
                <span className="text-slate-700">·</span>
                <span>Bat: {player.batting_style}</span>
              </>
            )}
            {player.bowling_style && (
              <>
                <span className="text-slate-700">·</span>
                <span>Bowl: {player.bowling_style}</span>
              </>
            )}
            {ps?.source && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500 truncate max-w-xs">Source: {ps.source}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/players/${player.slug}`}
            target="_blank"
            className="text-[11px] text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-600 px-2.5 py-1 rounded transition-colors"
          >
            View ↗
          </Link>
          <button
            onClick={() => onEdit(player)}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-400/30 hover:border-emerald-400/60 px-3 py-1 rounded transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Players Page
// ---------------------------------------------------------------------------

export default function AdminPlayersPage() {
  const { session, isLoading: authLoading } = useAdminAuth();
  const [players, setPlayers] = useState<AdminPlayerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [seasonId, setSeasonId] = useState("season-3");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [editingPlayer, setEditingPlayer] = useState<AdminPlayerRow | null>(null);

  const accessToken = session?.access_token ?? "";

  // Manual refresh for button click — does not run inside useEffect body
  const handleRefresh = useCallback(() => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadError(null);
    getAllPlayersAdmin(accessToken)
      .then(({ players: data, error }) => {
        if (error) setLoadError(error);
        else setPlayers(data ?? []);
      })
      .catch(() => setLoadError("Failed to load players."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  // Initial load on mount / token change — all setState calls only inside callbacks
  useEffect(() => {
    if (authLoading || !accessToken) return;
    let isMounted = true;
    getAllPlayersAdmin(accessToken)
      .then(({ players: data, error }) => {
        if (!isMounted) return;
        if (error) setLoadError(error);
        else setPlayers(data ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError("Failed to load players.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [authLoading, accessToken]);

  function handleSaved(updated: AdminPlayerRow) {
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  // Filtered player list
  const filtered = useMemo(() => {
    return players.filter((p) => {
      const q = search.toLowerCase().trim();
      const ps = getPlayerSeason(p, seasonId);

      // Search match
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.display_name && p.display_name.toLowerCase().includes(q)) ||
        p.slug.toLowerCase().includes(q) ||
        (p.nationality && p.nationality.toLowerCase().includes(q));

      // Team filter
      const matchesTeam =
        selectedTeam === "all" ||
        ps?.team_id === selectedTeam;

      // Role filter
      const matchesRole =
        selectedRole === "all" ||
        ps?.role === selectedRole;

      return matchesSearch && matchesTeam && matchesRole;
    });
  }, [players, search, seasonId, selectedTeam, selectedRole]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span>🏏</span>
              <span>Player Roster Management</span>
            </div>
            <h1 className="text-2xl font-black text-white">Players</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage NPL player identity, franchise assignments, marquee statuses, and roles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Info bar */}
        <div className="mt-5 flex flex-wrap gap-3 pt-5 border-t border-slate-800 items-center">
          <div className="text-xs text-slate-400">
            <span className="text-white font-semibold">{players.length}</span> players registered
          </div>
          <div className="text-slate-700">·</div>
          <div className="text-xs text-slate-500">
            All edits save to Supabase and reflect live on public player profiles.
          </div>
          <div className="text-slate-700">·</div>
          <div className="text-xs text-amber-400">
            ⚠ Player deletion is disabled to preserve historical statistics and match links.
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search players by name, slug, or nationality…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0c121e] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors"
          />
        </div>

        {/* Season Filter */}
        <select
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="bg-[#0c121e] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600 transition-colors"
        >
          {SEASONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Team Filter */}
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="bg-[#0c121e] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600 transition-colors"
        >
          <option value="all">All Franchises</option>
          {FRANCHISES.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-[#0c121e] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600 transition-colors"
        >
          <option value="all">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-2.5 transition-colors disabled:opacity-40"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Content */}
      {authLoading || isLoading ? (
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading players from database…</p>
        </div>
      ) : loadError ? (
        <div className="bg-[#0c121e] border border-red-900/40 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-red-400">{loadError}</p>
          <button
            onClick={handleRefresh}
            className="text-xs text-slate-400 hover:text-white border border-slate-700 px-4 py-1.5 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-sm text-slate-400">
            {search || selectedTeam !== "all" || selectedRole !== "all"
              ? "No players match your search or filter criteria."
              : "No players found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              seasonId={seasonId}
              onEdit={setEditingPlayer}
            />
          ))}
          <p className="text-[11px] text-slate-600 text-center pt-2">
            Showing {filtered.length} of {players.length} registered players · Season:{" "}
            {SEASONS.find((s) => s.id === seasonId)?.label}
          </p>
        </div>
      )}

      {/* Slide-in Edit Panel */}
      {editingPlayer && (
        <EditPanel
          player={editingPlayer}
          seasonId={seasonId}
          accessToken={accessToken}
          onClose={() => setEditingPlayer(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

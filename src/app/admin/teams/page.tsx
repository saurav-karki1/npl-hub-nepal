"use client";

/**
 * NPL Hub Nepal — Admin Teams Management Page
 *
 * Displays all NPL franchise teams from Supabase.
 * Allows editing core team fields and season-specific fields (captain, coach, squad status).
 * All writes go through the secure /api/admin/teams route (service-role, server-side).
 * No hard delete — teams have FK references in matches, player_seasons, and news.
 */

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import {
  getAllTeamsAdmin,
  updateTeamAdmin,
  AdminTeamRow,
  AdminTeamSeasonRow,
  UpdateTeamInput,
} from "@/lib/repository/teams";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSeasonEntry(team: AdminTeamRow, seasonId: string): AdminTeamSeasonRow | undefined {
  return team.team_seasons.find((ts) => ts.season_id === seasonId);
}

function fmt(val: string | null | undefined, fallback = "—"): string {
  return val?.trim() ? val : fallback;
}

// ---------------------------------------------------------------------------
// Edit Form State
// ---------------------------------------------------------------------------

interface EditFormState {
  name: string;
  shortName: string;
  initials: string;
  region: string;
  city: string;
  logoUrl: string;
  established: string;
  description: string;
  // Season fields
  captainName: string;
  captainConfidence: "confirmed" | "reported";
  captainSource: string;
  coach: string;
  squadStatus: string;
}

function buildEditForm(team: AdminTeamRow, seasonId: string): EditFormState {
  const ts = getSeasonEntry(team, seasonId);
  return {
    name: team.name,
    shortName: team.short_name,
    initials: team.initials,
    region: team.region,
    city: team.city,
    logoUrl: team.logo_url ?? "",
    established: team.established ?? "",
    description: team.description ?? "",
    captainName: ts?.captain_name ?? "",
    captainConfidence: ts?.captain_confidence ?? "reported",
    captainSource: ts?.captain_source ?? "",
    coach: ts?.coach ?? "",
    squadStatus: ts?.squad_status ?? "",
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
      <span className="text-slate-500">{label}</span>
      <span className="text-white">{value}</span>
    </span>
  );
}

function ConfidenceBadge({ val }: { val: "confirmed" | "reported" | null }) {
  if (val === "confirmed")
    return (
      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">
        CONFIRMED
      </span>
    );
  return (
    <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
      REPORTED
    </span>
  );
}

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
  team: AdminTeamRow;
  seasonId: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (updated: AdminTeamRow) => void;
}

function EditPanel({ team, seasonId, accessToken, onClose, onSaved }: EditPanelProps) {
  const [form, setForm] = useState<EditFormState>(() => buildEditForm(team, seasonId));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function setField<K extends keyof EditFormState>(key: K, val: EditFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError("Team name is required.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const input: UpdateTeamInput = {
      teamId: team.id,
      seasonId,
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      initials: form.initials.trim(),
      region: form.region.trim(),
      city: form.city.trim(),
      logoUrl: form.logoUrl.trim() || null,
      established: form.established.trim(),
      description: form.description.trim(),
      captainName: form.captainName.trim(),
      captainConfidence: form.captainConfidence,
      captainSource: form.captainSource.trim(),
      coach: form.coach.trim(),
      squadStatus: form.squadStatus.trim(),
    };

    const { team: updated, error } = await updateTeamAdmin(input, accessToken);

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

  const ts = getSeasonEntry(team, seasonId);
  const seasonLabel = seasonId === "season-3" ? "Season 3" : seasonId === "season-2" ? "Season 2" : seasonId;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative z-10 h-full w-full max-w-lg bg-[#0a0f1a] border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team.brand_color }}
              />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Editing Team
              </span>
            </div>
            <h2 className="text-lg font-black text-white leading-tight">{team.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Season context: <span className="text-white font-semibold">{seasonLabel}</span>
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

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Core Team Info */}
          <section>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="inline-block w-4 h-px bg-emerald-400/40" />
              Team Identity
            </h3>
            <div className="space-y-4">
              <FormField
                label="Full Team Name"
                value={form.name}
                onChange={(v) => setField("name", v)}
                required
                placeholder="e.g. Lumbini Lions"
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Short Name"
                  value={form.shortName}
                  onChange={(v) => setField("shortName", v)}
                  required
                  placeholder="e.g. LL"
                />
                <FormField
                  label="Initials"
                  value={form.initials}
                  onChange={(v) => setField("initials", v)}
                  required
                  placeholder="e.g. LL"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Region"
                  value={form.region}
                  onChange={(v) => setField("region", v)}
                  placeholder="e.g. Lumbini Province"
                />
                <FormField
                  label="City"
                  value={form.city}
                  onChange={(v) => setField("city", v)}
                  placeholder="e.g. Rupandehi"
                />
              </div>
              <FormField
                label="Established Year"
                value={form.established}
                onChange={(v) => setField("established", v)}
                placeholder="e.g. 2024"
              />
              <FormField
                label="Logo URL"
                value={form.logoUrl}
                onChange={(v) => setField("logoUrl", v)}
                placeholder="/images/teams/lumbini-lions.webp"
                note="Relative path from /public or absolute URL"
              />
              <FormField
                label="Description"
                value={form.description}
                onChange={(v) => setField("description", v)}
                textarea
                placeholder="Brief description of the franchise…"
              />
            </div>
          </section>

          {/* Season-Specific */}
          <section>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="inline-block w-4 h-px bg-blue-400/40" />
              {seasonLabel} — Leadership &amp; Squad
            </h3>
            {!ts && (
              <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-3 py-2 mb-4">
                No {seasonLabel} entry found for this team. Season-specific fields will not be saved.
              </div>
            )}
            <div className="space-y-4">
              <FormField
                label="Captain Name"
                value={form.captainName}
                onChange={(v) => setField("captainName", v)}
                placeholder="e.g. Rohit Paudel"
              />
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Captain Confidence
                </label>
                <select
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  value={form.captainConfidence}
                  onChange={(e) =>
                    setField("captainConfidence", e.target.value as "confirmed" | "reported")
                  }
                >
                  <option value="reported">Reported (unconfirmed)</option>
                  <option value="confirmed">Confirmed (official)</option>
                </select>
              </div>
              <FormField
                label="Captain Source / Note"
                value={form.captainSource}
                onChange={(v) => setField("captainSource", v)}
                placeholder="e.g. Official announcement, August 2026"
              />
              <FormField
                label="Coach"
                value={form.coach}
                onChange={(v) => setField("coach", v)}
                placeholder="e.g. Not yet available"
              />
              <FormField
                label="Squad Status"
                value={form.squadStatus}
                onChange={(v) => setField("squadStatus", v)}
                placeholder="e.g. Squad to be announced"
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
              ✓ Saved successfully.
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
              form="edit-team-form"
              disabled={isSaving}
              onClick={handleSubmit}
              className="flex-1 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md py-2 transition-colors"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 text-center">
            Changes are saved directly to the Supabase database.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team Row
// ---------------------------------------------------------------------------

interface TeamRowProps {
  team: AdminTeamRow;
  seasonId: string;
  onEdit: (team: AdminTeamRow) => void;
}

function TeamRow({ team, seasonId, onEdit }: TeamRowProps) {
  const ts = getSeasonEntry(team, seasonId);

  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start gap-4">
        {/* Crest */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shrink-0 mt-0.5"
          style={{
            backgroundColor: team.crest_bg,
            color: team.crest_text,
          }}
        >
          {team.initials}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white truncate">{team.name}</h3>
            <span className="text-[10px] font-mono text-slate-500">{team.slug}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {team.city} · {team.region}
          </p>

          {/* Season info */}
          {ts ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ConfidenceBadge val={ts.captain_confidence} />
              <span className="text-xs text-slate-300">
                {fmt(ts.captain_name, "Captain TBA")}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">
                Coach: {fmt(ts.coach, "TBA")}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-600 mt-1 italic">
              No entry for selected season
            </p>
          )}

          {/* Stats pills */}
          {ts && (ts.played > 0) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatPill label="P" value={ts.played} />
              <StatPill label="W" value={ts.won} />
              <StatPill label="L" value={ts.lost} />
              <StatPill label="Pts" value={ts.points} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/teams/${team.slug}`}
            target="_blank"
            className="text-[11px] text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-600 px-2 py-1 rounded transition-colors"
          >
            View ↗
          </Link>
          <button
            onClick={() => onEdit(team)}
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
// Main Page
// ---------------------------------------------------------------------------

const SEASONS = [
  { id: "season-3", label: "Season 3 (2026)" },
  { id: "season-2", label: "Season 2 (2025)" },
];

export default function AdminTeamsPage() {
  const { session, isLoading: authLoading } = useAdminAuth();
  const [teams, setTeams] = useState<AdminTeamRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [seasonId, setSeasonId] = useState("season-3");
  const [editingTeam, setEditingTeam] = useState<AdminTeamRow | null>(null);

  const accessToken = session?.access_token ?? "";

  // Manual refresh (used by Refresh button — does not run inside useEffect body)
  const loadTeams = useCallback(() => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadError(null);
    getAllTeamsAdmin(accessToken)
      .then(({ teams: data, error }) => {
        if (error) setLoadError(error);
        else setTeams(data ?? []);
      })
      .catch(() => setLoadError("Failed to load teams."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  // Initial load on mount / token change — all setState only inside .then/.catch/.finally
  useEffect(() => {
    if (authLoading || !accessToken) return;
    let isMounted = true;
    getAllTeamsAdmin(accessToken)
      .then(({ teams: data, error }) => {
        if (!isMounted) return;
        if (error) setLoadError(error);
        else setTeams(data ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError("Failed to load teams.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [authLoading, accessToken]);

  function handleSaved(updated: AdminTeamRow) {
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.region.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span>🛡️</span>
              <span>Franchise Management</span>
            </div>
            <h1 className="text-2xl font-black text-white">Teams</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Edit team identity, leadership, and season-specific information.
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
        <div className="mt-5 flex flex-wrap gap-3 pt-5 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            <span className="text-white font-semibold">{teams.length}</span> teams loaded
          </div>
          <div className="text-slate-700">·</div>
          <div className="text-xs text-slate-500">
            All edits are saved directly to Supabase. Public website updates immediately.
          </div>
          <div className="text-slate-700">·</div>
          <div className="text-xs text-amber-400">
            ⚠ Teams cannot be deleted — historical match and player records are preserved.
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
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
            placeholder="Search teams by name, city, or region…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0c121e] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors"
          />
        </div>
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
        <button
          onClick={loadTeams}
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
          <p className="text-sm text-slate-400">Loading teams from database…</p>
        </div>
      ) : loadError ? (
        <div className="bg-[#0c121e] border border-red-900/40 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-red-400">{loadError}</p>
          <button
            onClick={loadTeams}
            className="text-xs text-slate-400 hover:text-white border border-slate-700 px-4 py-1.5 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-sm text-slate-400">
            {search ? `No teams match "${search}"` : "No teams found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((team) => (
            <TeamRow
              key={team.id}
              team={team}
              seasonId={seasonId}
              onEdit={setEditingTeam}
            />
          ))}
          <p className="text-[11px] text-slate-600 text-center pt-2">
            {filtered.length} of {teams.length} teams · Season context: {SEASONS.find(s=>s.id===seasonId)?.label}
          </p>
        </div>
      )}

      {/* Edit Panel */}
      {editingTeam && (
        <EditPanel
          team={editingTeam}
          seasonId={seasonId}
          accessToken={accessToken}
          onClose={() => setEditingTeam(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

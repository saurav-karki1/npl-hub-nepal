"use client";

/**
 * NPL Hub Nepal — Admin Stats Management Page
 *
 * Manage player season statistics (player_season_stats) and tournament awards (tournament_awards).
 * All writes go through the secure /api/admin/stats route (service-role, server-side).
 *
 * Rules:
 * - NULL values are preserved (unavailable ≠ zero)
 * - No hard delete — stats and awards are historical records
 * - Season 3 is pre-tournament: do not invent statistics
 * - Unique constraint on player_season_stats: (season_id, player_name, team_id)
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import {
  getAllStatsAdmin,
  updatePlayerSeasonStatAdmin,
  updateTournamentAwardAdmin,
  AdminPlayerSeasonStatRow,
  AdminTournamentAwardRow,
  UpdatePlayerSeasonStatInput,
  UpdateTournamentAwardInput,
  StatConfidence,
} from "@/lib/repository/stats";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEASONS = [
  { id: "season-2", label: "Season 2 (2025)" },
  { id: "season-3", label: "Season 3 (2026)" },
];

const CONFIDENCE_LEVELS: StatConfidence[] = ["High", "Medium", "Low"];

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

function fmtNull(val: number | null | undefined): string {
  return val === null || val === undefined ? "—" : String(val);
}

function confidenceBadgeClass(c: StatConfidence): string {
  if (c === "High") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
  if (c === "Medium") return "text-amber-400 bg-amber-500/10 border-amber-500/25";
  return "text-red-400 bg-red-500/10 border-red-500/25";
}

// ---------------------------------------------------------------------------
// Stat Edit Form State
// ---------------------------------------------------------------------------

interface StatFormState {
  matches: string;
  innings: string;
  runs: string;
  highest_score: string;
  average: string;
  strike_rate: string;
  wickets: string;
  best_bowling: string;
  economy: string;
  fours: string;
  sixes: string;
  hundreds: string;
  fifties: string;
  catches: string;
  wicketkeeper_dismissals: string;
  confidence: StatConfidence;
  source_note: string;
}

function statToForm(s: AdminPlayerSeasonStatRow): StatFormState {
  return {
    matches: s.matches !== null ? String(s.matches) : "",
    innings: s.innings !== null ? String(s.innings) : "",
    runs: s.runs !== null ? String(s.runs) : "",
    highest_score: s.highest_score ?? "",
    average: s.average !== null ? String(s.average) : "",
    strike_rate: s.strike_rate !== null ? String(s.strike_rate) : "",
    wickets: s.wickets !== null ? String(s.wickets) : "",
    best_bowling: s.best_bowling ?? "",
    economy: s.economy !== null ? String(s.economy) : "",
    fours: s.fours !== null ? String(s.fours) : "",
    sixes: s.sixes !== null ? String(s.sixes) : "",
    hundreds: s.hundreds !== null ? String(s.hundreds) : "",
    fifties: s.fifties !== null ? String(s.fifties) : "",
    catches: s.catches !== null ? String(s.catches) : "",
    wicketkeeper_dismissals:
      s.wicketkeeper_dismissals !== null ? String(s.wicketkeeper_dismissals) : "",
    confidence: s.confidence,
    source_note: s.source_note ?? "",
  };
}

// Form value to null-preserving number: empty string → null
function parseNullableNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formToStatInput(id: string, f: StatFormState): UpdatePlayerSeasonStatInput {
  return {
    id,
    matches: parseNullableNum(f.matches),
    innings: parseNullableNum(f.innings),
    runs: parseNullableNum(f.runs),
    highest_score: f.highest_score.trim() || null,
    average: parseNullableNum(f.average),
    strike_rate: parseNullableNum(f.strike_rate),
    wickets: parseNullableNum(f.wickets),
    best_bowling: f.best_bowling.trim() || null,
    economy: parseNullableNum(f.economy),
    fours: parseNullableNum(f.fours),
    sixes: parseNullableNum(f.sixes),
    hundreds: parseNullableNum(f.hundreds),
    fifties: parseNullableNum(f.fifties),
    catches: parseNullableNum(f.catches),
    wicketkeeper_dismissals: parseNullableNum(f.wicketkeeper_dismissals),
    confidence: f.confidence,
    source_note: f.source_note.trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Award Edit Form State
// ---------------------------------------------------------------------------

interface AwardFormState {
  award_name: string;
  recipient_name: string;
  recipient_player_slug: string;
  recipient_team_id: string;
  recipient_team_name: string;
  stat_metric: string;
  secondary_detail: string;
  confidence: StatConfidence;
  source_note: string;
  sort_order: string;
}

function awardToForm(a: AdminTournamentAwardRow): AwardFormState {
  return {
    award_name: a.award_name,
    recipient_name: a.recipient_name,
    recipient_player_slug: a.recipient_player_slug ?? "",
    recipient_team_id: a.recipient_team_id ?? "",
    recipient_team_name: a.recipient_team_name,
    stat_metric: a.stat_metric ?? "",
    secondary_detail: a.secondary_detail ?? "",
    confidence: a.confidence,
    source_note: a.source_note ?? "",
    sort_order: String(a.sort_order),
  };
}

function formToAwardInput(id: string, f: AwardFormState): UpdateTournamentAwardInput {
  return {
    id,
    award_name: f.award_name,
    recipient_name: f.recipient_name,
    recipient_player_slug: f.recipient_player_slug.trim() || null,
    recipient_team_id: f.recipient_team_id.trim() || null,
    recipient_team_name: f.recipient_team_name,
    stat_metric: f.stat_metric.trim() || null,
    secondary_detail: f.secondary_detail.trim() || null,
    confidence: f.confidence,
    source_note: f.source_note.trim() || null,
    sort_order: parseInt(f.sort_order) || 0,
  };
}

// ---------------------------------------------------------------------------
// Numeric input helper
// ---------------------------------------------------------------------------

function NumInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
        {label}
        {hint && <span className="ml-1 text-slate-600 normal-case font-normal">{hint}</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Edit Drawer
// ---------------------------------------------------------------------------

interface StatEditorProps {
  stat: AdminPlayerSeasonStatRow;
  form: StatFormState;
  isSaving: boolean;
  saveError: string | null;
  onFormChange: (patch: Partial<StatFormState>) => void;
  onSave: () => void;
  onClose: () => void;
}

function StatEditor({ stat, form, isSaving, saveError, onFormChange, onSave, onClose }: StatEditorProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-xl bg-[#080e1a] border-l border-slate-800 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#080e1a] z-10">
          <div>
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-0.5">
              Edit Player Statistics
            </div>
            <h2 className="text-base font-bold text-white">{stat.player_name}</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              {stat.team_name} · {stat.season_id === "season-2" ? "Season 2 (2025)" : "Season 3 (2026)"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-800 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {saveError}
            </div>
          )}

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-400">
            <strong>Note:</strong> Leave a field blank to set it to null (unavailable). Do not enter{" "}
            <strong>0</strong> for missing statistics — use blank/null to preserve data integrity.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumInput label="Matches" value={form.matches} onChange={(v) => onFormChange({ matches: v })} />
            <NumInput label="Innings" value={form.innings} onChange={(v) => onFormChange({ innings: v })} />
            <NumInput label="Runs" value={form.runs} onChange={(v) => onFormChange({ runs: v })} />
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Highest Score
              </label>
              <input
                type="text"
                value={form.highest_score}
                onChange={(e) => onFormChange({ highest_score: e.target.value })}
                placeholder="e.g. 67* or —"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
              />
            </div>
            <NumInput label="Average" value={form.average} onChange={(v) => onFormChange({ average: v })} />
            <NumInput label="Strike Rate" value={form.strike_rate} onChange={(v) => onFormChange({ strike_rate: v })} />
            <NumInput label="Wickets" value={form.wickets} onChange={(v) => onFormChange({ wickets: v })} />
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Best Bowling
              </label>
              <input
                type="text"
                value={form.best_bowling}
                onChange={(e) => onFormChange({ best_bowling: e.target.value })}
                placeholder="e.g. 3/22 or —"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
              />
            </div>
            <NumInput label="Economy" value={form.economy} onChange={(v) => onFormChange({ economy: v })} />
            <NumInput label="Fours" value={form.fours} onChange={(v) => onFormChange({ fours: v })} />
            <NumInput label="Sixes" value={form.sixes} onChange={(v) => onFormChange({ sixes: v })} />
            <NumInput label="Fifties" value={form.fifties} onChange={(v) => onFormChange({ fifties: v })} />
            <NumInput label="Hundreds" value={form.hundreds} onChange={(v) => onFormChange({ hundreds: v })} />
            <NumInput label="Catches" value={form.catches} onChange={(v) => onFormChange({ catches: v })} />
            <NumInput
              label="WK Dismissals"
              value={form.wicketkeeper_dismissals}
              onChange={(v) => onFormChange({ wicketkeeper_dismissals: v })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Confidence
            </label>
            <select
              value={form.confidence}
              onChange={(e) => onFormChange({ confidence: e.target.value as StatConfidence })}
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CONFIDENCE_LEVELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Source Note
            </label>
            <input
              type="text"
              value={form.source_note}
              onChange={(e) => onFormChange({ source_note: e.target.value })}
              placeholder="e.g. ESPN Cricinfo S2 final standings"
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 sticky bottom-0 bg-[#080e1a] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-md transition-colors"
          >
            {isSaving ? "Saving…" : "Save Statistics"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Award Edit Drawer
// ---------------------------------------------------------------------------

interface AwardEditorProps {
  award: AdminTournamentAwardRow;
  form: AwardFormState;
  isSaving: boolean;
  saveError: string | null;
  onFormChange: (patch: Partial<AwardFormState>) => void;
  onSave: () => void;
  onClose: () => void;
}

function AwardEditor({ award, form, isSaving, saveError, onFormChange, onSave, onClose }: AwardEditorProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-xl bg-[#080e1a] border-l border-slate-800 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#080e1a] z-10">
          <div>
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-0.5">
              Edit Tournament Award
            </div>
            <h2 className="text-base font-bold text-white">{award.award_name}</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              {award.season_id === "season-2" ? "Season 2 (2025)" : "Season 3 (2026)"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-800 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4">
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {saveError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Award Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.award_name}
              onChange={(e) => onFormChange({ award_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Recipient Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.recipient_name}
                onChange={(e) => onFormChange({ recipient_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Player Slug
              </label>
              <input
                type="text"
                value={form.recipient_player_slug}
                onChange={(e) => onFormChange({ recipient_player_slug: e.target.value })}
                placeholder="e.g. sandeep-lamichhane"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Team
              </label>
              <select
                value={form.recipient_team_id}
                onChange={(e) => {
                  const f = FRANCHISES.find((fr) => fr.id === e.target.value);
                  onFormChange({
                    recipient_team_id: e.target.value,
                    recipient_team_name: f ? f.name : form.recipient_team_name,
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">— No team —</option>
                {FRANCHISES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Team Name (stored)
              </label>
              <input
                type="text"
                value={form.recipient_team_name}
                onChange={(e) => onFormChange({ recipient_team_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Stat Metric
              </label>
              <input
                type="text"
                value={form.stat_metric}
                onChange={(e) => onFormChange({ stat_metric: e.target.value })}
                placeholder="e.g. 287 runs"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Secondary Detail
              </label>
              <input
                type="text"
                value={form.secondary_detail}
                onChange={(e) => onFormChange({ secondary_detail: e.target.value })}
                placeholder="e.g. HS: 67*"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Confidence
              </label>
              <select
                value={form.confidence}
                onChange={(e) => onFormChange({ confidence: e.target.value as StatConfidence })}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {CONFIDENCE_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Sort Order
              </label>
              <input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => onFormChange({ sort_order: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Source Note
            </label>
            <input
              type="text"
              value={form.source_note}
              onChange={(e) => onFormChange({ source_note: e.target.value })}
              placeholder="e.g. ESPN Cricinfo S2 awards ceremony"
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 sticky bottom-0 bg-[#080e1a] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !form.award_name || !form.recipient_name || !form.recipient_team_name}
            className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-md transition-colors"
          >
            {isSaving ? "Saving…" : "Save Award"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type ActiveTab = "stats" | "awards";

export default function AdminStatsPage() {
  const { session, isLoading: authLoading } = useAdminAuth();
  const accessToken = session?.access_token ?? null;

  const [stats, setStats] = useState<AdminPlayerSeasonStatRow[]>([]);
  const [awards, setAwards] = useState<AdminTournamentAwardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<ActiveTab>("stats");
  const [seasonFilter, setSeasonFilter] = useState<string>("season-2");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Stat editor
  const [editingStat, setEditingStat] = useState<AdminPlayerSeasonStatRow | null>(null);
  const [statForm, setStatForm] = useState<StatFormState | null>(null);
  const [isSavingStat, setIsSavingStat] = useState(false);
  const [saveStatError, setSaveStatError] = useState<string | null>(null);

  // Award editor
  const [editingAward, setEditingAward] = useState<AdminTournamentAwardRow | null>(null);
  const [awardForm, setAwardForm] = useState<AwardFormState | null>(null);
  const [isSavingAward, setIsSavingAward] = useState(false);
  const [saveAwardError, setSaveAwardError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Refresh (called from button — not in effect body to avoid lint error)
  // ---------------------------------------------------------------------------

  const handleRefresh = useCallback(() => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadError(null);
    getAllStatsAdmin(accessToken, seasonFilter)
      .then(({ stats: s, awards: a, error }) => {
        if (error) setLoadError(error);
        else {
          setStats(s);
          setAwards(a);
        }
      })
      .catch(() => setLoadError("Failed to load statistics."))
      .finally(() => setIsLoading(false));
  }, [accessToken, seasonFilter]);

  // ---------------------------------------------------------------------------
  // Initial load (isMounted pattern — no synchronous setState in body)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (authLoading || !accessToken) return;
    let isMounted = true;
    getAllStatsAdmin(accessToken, seasonFilter)
      .then(({ stats: s, awards: a, error }) => {
        if (!isMounted) return;
        if (error) setLoadError(error);
        else {
          setStats(s);
          setAwards(a);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError("Failed to load statistics.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [authLoading, accessToken, seasonFilter]);

  // ---------------------------------------------------------------------------
  // Filtered stat list
  // ---------------------------------------------------------------------------

  const filteredStats = useMemo(() => {
    return stats.filter((s) => {
      if (teamFilter !== "all" && s.team_id !== teamFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.player_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [stats, teamFilter, searchQuery]);

  const filteredAwards = useMemo(() => {
    return awards.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !a.award_name.toLowerCase().includes(q) &&
          !a.recipient_name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [awards, searchQuery]);

  // ---------------------------------------------------------------------------
  // Open / close stat editor
  // ---------------------------------------------------------------------------

  const openStatEdit = useCallback((s: AdminPlayerSeasonStatRow) => {
    setEditingStat(s);
    setStatForm(statToForm(s));
    setSaveStatError(null);
  }, []);

  const closeStatEdit = useCallback(() => {
    setEditingStat(null);
    setStatForm(null);
    setSaveStatError(null);
  }, []);

  const handleStatFormChange = useCallback((patch: Partial<StatFormState>) => {
    setStatForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleSaveStat = useCallback(() => {
    if (!accessToken || !editingStat || !statForm || isSavingStat) return;
    setIsSavingStat(true);
    setSaveStatError(null);
    const input = formToStatInput(editingStat.id, statForm);
    updatePlayerSeasonStatAdmin(input, accessToken)
      .then(({ stat, error }) => {
        setIsSavingStat(false);
        if (error) {
          setSaveStatError(error);
          return;
        }
        if (stat) {
          setStats((prev) => prev.map((s) => (s.id === stat.id ? stat : s)));
        }
        setSaveSuccess("Statistics updated.");
        setTimeout(() => setSaveSuccess(null), 3000);
        closeStatEdit();
      })
      .catch(() => {
        setIsSavingStat(false);
        setSaveStatError("Network error. Please try again.");
      });
  }, [accessToken, editingStat, statForm, isSavingStat, closeStatEdit]);

  // ---------------------------------------------------------------------------
  // Open / close award editor
  // ---------------------------------------------------------------------------

  const openAwardEdit = useCallback((a: AdminTournamentAwardRow) => {
    setEditingAward(a);
    setAwardForm(awardToForm(a));
    setSaveAwardError(null);
  }, []);

  const closeAwardEdit = useCallback(() => {
    setEditingAward(null);
    setAwardForm(null);
    setSaveAwardError(null);
  }, []);

  const handleAwardFormChange = useCallback((patch: Partial<AwardFormState>) => {
    setAwardForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleSaveAward = useCallback(() => {
    if (!accessToken || !editingAward || !awardForm || isSavingAward) return;
    setIsSavingAward(true);
    setSaveAwardError(null);
    const input = formToAwardInput(editingAward.id, awardForm);
    updateTournamentAwardAdmin(input, accessToken)
      .then(({ award, error }) => {
        setIsSavingAward(false);
        if (error) {
          setSaveAwardError(error);
          return;
        }
        if (award) {
          setAwards((prev) => prev.map((a) => (a.id === award.id ? award : a)));
        }
        setSaveSuccess("Award updated.");
        setTimeout(() => setSaveSuccess(null), 3000);
        closeAwardEdit();
      })
      .catch(() => {
        setIsSavingAward(false);
        setSaveAwardError("Network error. Please try again.");
      });
  }, [accessToken, editingAward, awardForm, isSavingAward, closeAwardEdit]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span>📈</span>
              <span>Statistics &amp; Historical Archives</span>
            </div>
            <h1 className="text-2xl font-black text-white">Stats Management</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Edit player season statistics and tournament awards. Historical records are preserved — no hard delete.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm text-emerald-400">
          ✓ {saveSuccess}
        </div>
      )}

      {/* Season 3 warning */}
      {seasonFilter === "season-3" && (
        <div className="bg-amber-500/5 border border-amber-500/25 rounded-lg px-4 py-3 text-xs text-amber-400">
          <strong>Season 3 is pre-tournament.</strong> Statistics tables are expected to be empty until official
          matches are concluded. Do not create or invent statistics.
        </div>
      )}

      {/* Filters + Tabs */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-4 space-y-3">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("stats")}
            className={`text-sm font-semibold px-4 py-1.5 rounded-md transition-colors ${
              activeTab === "stats"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Player Stats ({stats.length})
          </button>
          <button
            onClick={() => setActiveTab("awards")}
            className={`text-sm font-semibold px-4 py-1.5 rounded-md transition-colors ${
              activeTab === "awards"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Awards ({awards.length})
          </button>
        </div>

        {/* Filter row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "stats"
                ? "Search player name…"
                : "Search award or recipient…"
            }
            className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
          />
          {/* Season filter */}
          <select
            value={seasonFilter}
            onChange={(e) => {
              setSeasonFilter(e.target.value);
              setTeamFilter("all");
              setSearchQuery("");
            }}
            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {SEASONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {/* Team filter (stats tab only) */}
          {activeTab === "stats" && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Teams</option>
              {FRANCHISES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-sm text-slate-400 hover:text-white bg-slate-800 border border-slate-700 px-3 py-2 rounded-md transition-colors disabled:opacity-50"
            title="Refresh"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
          Loading statistics…
        </div>
      ) : loadError ? (
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <div className="text-red-400 text-sm">{loadError}</div>
          <button
            onClick={handleRefresh}
            className="text-xs text-slate-400 hover:text-white bg-slate-800 px-4 py-2 rounded-md border border-slate-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : activeTab === "stats" ? (
        /* ---------------------------------------------------------------- */
        /* PLAYER STATS TAB                                                  */
        /* ---------------------------------------------------------------- */
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl overflow-hidden">
          {filteredStats.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              {stats.length === 0
                ? "No player statistics found for this season."
                : "No players match the current filters."}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {[
                        "Player",
                        "Team",
                        "M",
                        "Inn",
                        "Runs",
                        "HS",
                        "Avg",
                        "SR",
                        "Wkts",
                        "BBI",
                        "Eco",
                        "4s",
                        "6s",
                        "50s",
                        "100s",
                        "Ct",
                        "WK",
                        "Conf",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStats.map((s) => {
                      const teamColor =
                        FRANCHISES.find((f) => f.id === s.team_id)?.brand_color ?? "#64748b";
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-3 py-3 font-medium text-white text-sm whitespace-nowrap">
                            {s.player_slug ? (
                              <a
                                href={`/players/${s.player_slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-emerald-400 transition-colors"
                              >
                                {s.player_name}
                              </a>
                            ) : (
                              s.player_name
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-700 text-slate-300"
                              style={{ borderColor: teamColor + "40", color: teamColor }}
                            >
                              {FRANCHISES.find((f) => f.id === s.team_id)?.short_name ?? s.team_id}
                            </span>
                          </td>
                          {[
                            fmtNull(s.matches),
                            fmtNull(s.innings),
                            fmtNull(s.runs),
                            s.highest_score ?? "—",
                            s.average !== null ? s.average.toFixed(2) : "—",
                            s.strike_rate !== null ? s.strike_rate.toFixed(2) : "—",
                            fmtNull(s.wickets),
                            s.best_bowling ?? "—",
                            s.economy !== null ? s.economy.toFixed(2) : "—",
                            fmtNull(s.fours),
                            fmtNull(s.sixes),
                            fmtNull(s.fifties),
                            fmtNull(s.hundreds),
                            fmtNull(s.catches),
                            fmtNull(s.wicketkeeper_dismissals),
                          ].map((val, i) => (
                            <td
                              key={i}
                              className={`px-3 py-3 text-xs whitespace-nowrap ${
                                val === "—" ? "text-slate-600" : "text-slate-300"
                              }`}
                            >
                              {val}
                            </td>
                          ))}
                          <td className="px-3 py-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${confidenceBadgeClass(s.confidence)}`}
                            >
                              {s.confidence}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => openStatEdit(s)}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors whitespace-nowrap"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-800/60">
                {filteredStats.map((s) => (
                  <div key={s.id} className="px-4 py-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white text-sm">{s.player_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{s.team_name}</div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${confidenceBadgeClass(s.confidence)}`}
                      >
                        {s.confidence}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {[
                        ["M", fmtNull(s.matches)],
                        ["R", fmtNull(s.runs)],
                        ["Wkts", fmtNull(s.wickets)],
                      ].map(([lbl, val]) => (
                        <div key={lbl} className="bg-slate-900 rounded px-2 py-1">
                          <div className="text-[10px] text-slate-500">{lbl}</div>
                          <div className={val === "—" ? "text-slate-600" : "text-slate-200"}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => openStatEdit(s)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                    >
                      Edit Stats
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ---------------------------------------------------------------- */
        /* AWARDS TAB                                                        */
        /* ---------------------------------------------------------------- */
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl overflow-hidden">
          {filteredAwards.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              {awards.length === 0
                ? "No awards found for this season."
                : "No awards match the current search."}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filteredAwards.map((a) => (
                <div
                  key={a.id}
                  className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{a.award_name}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${confidenceBadgeClass(a.confidence)}`}
                      >
                        {a.confidence}
                      </span>
                    </div>
                    <div className="text-sm text-slate-300 mt-0.5">{a.recipient_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {a.recipient_team_name}
                      {a.stat_metric ? ` · ${a.stat_metric}` : ""}
                      {a.secondary_detail ? ` · ${a.secondary_detail}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => openAwardEdit(a)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No delete notice */}
      <div className="bg-[#0c121e] border border-slate-700/50 rounded-lg px-4 py-3 text-[11px] text-slate-500">
        <strong className="text-slate-400">Note:</strong> Statistics and awards are historical records and cannot be
        deleted through the admin panel. Contact a database administrator if a record requires removal.
      </div>

      {/* Stat editor drawer */}
      {editingStat && statForm && (
        <StatEditor
          stat={editingStat}
          form={statForm}
          isSaving={isSavingStat}
          saveError={saveStatError}
          onFormChange={handleStatFormChange}
          onSave={handleSaveStat}
          onClose={closeStatEdit}
        />
      )}

      {/* Award editor drawer */}
      {editingAward && awardForm && (
        <AwardEditor
          award={editingAward}
          form={awardForm}
          isSaving={isSavingAward}
          saveError={saveAwardError}
          onFormChange={handleAwardFormChange}
          onSave={handleSaveAward}
          onClose={closeAwardEdit}
        />
      )}
    </div>
  );
}

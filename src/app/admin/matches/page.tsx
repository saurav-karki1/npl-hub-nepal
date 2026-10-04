"use client";

/**
 * NPL Hub Nepal — Admin Matches & Fixtures Management Page
 *
 * Displays all 32 NPL tournament fixtures from Supabase.
 * Allows editing match numbers, stages, dates, times, venues, statuses, and team/placeholder assignments.
 * All writes go through the secure /api/admin/matches route (service-role, server-side).
 * No hard delete — matches have relational invariants and historical links.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import {
  getAllMatchesAdmin,
  updateMatchAdmin,
  AdminMatchRow,
  UpdateMatchInput,
} from "@/lib/repository/matches";
import { resolveMatchTeam } from "@/lib/data/schedule-data";
import { AdminLiveSyncCard } from "@/components/admin/AdminLiveSyncCard";

// ---------------------------------------------------------------------------
// Constants & Metadata
// ---------------------------------------------------------------------------

const SEASONS = [
  { id: "season-3", label: "Season 3 (2026)" },
  { id: "season-2", label: "Season 2 (2025)" },
];

const STAGES = ["League", "Qualifier 1", "Eliminator", "Qualifier 2", "Final"] as const;
const STATUSES = ["upcoming", "tba", "live", "postponed", "abandoned", "completed"] as const;

const FRANCHISES = [
  { id: "biratnagar-kings", name: "Biratnagar Kings", shortName: "BK", color: "#0284c7" },
  { id: "chitwan-rhinos", name: "Chitwan Rhinos", shortName: "CR", color: "#059669" },
  { id: "janakpur-bolts", name: "Janakpur Bolts", shortName: "JB", color: "#d97706" },
  { id: "karnali-yaks", name: "Karnali Yaks", shortName: "KY", color: "#4f46e5" },
  { id: "kathmandu-gorkhas", name: "Kathmandu Gorkhas", shortName: "KG", color: "#b91c1c" },
  { id: "lumbini-lions", name: "Lumbini Lions", shortName: "LL", color: "#1d4ed8" },
  { id: "pokhara-avengers", name: "Pokhara Avengers", shortName: "PA", color: "#0891b2" },
  { id: "sudurpaschim-royals", name: "Sudurpaschim Royals", shortName: "SR", color: "#b45309" },
];

const PLAYOFF_PLACEHOLDERS = [
  { id: "rank-1", name: "Rank 1 Team (League Stage Top 1)" },
  { id: "rank-2", name: "Rank 2 Team (League Stage Top 2)" },
  { id: "rank-3", name: "Rank 3 Team (League Stage Top 3)" },
  { id: "rank-4", name: "Rank 4 Team (League Stage Top 4)" },
  { id: "q1-loser", name: "Loser of Qualifier 1" },
  { id: "elim-winner", name: "Winner of Eliminator" },
  { id: "q1-winner", name: "Winner of Qualifier 1" },
  { id: "q2-winner", name: "Winner of Qualifier 2" },
];

// ---------------------------------------------------------------------------
// Helper Formatter Functions
// ---------------------------------------------------------------------------

function formatDateToReadable(isoDateStr: string): { formatted: string; day: string } {
  try {
    const parts = isoDateStr.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
      const formatted = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      const day = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
      return { formatted, day };
    }
  } catch {
    // ignore
  }
  return { formatted: isoDateStr, day: "" };
}

// ---------------------------------------------------------------------------
// Form State Interface
// ---------------------------------------------------------------------------

interface EditMatchFormState {
  matchNumber: number;
  stage: (typeof STAGES)[number];
  status: (typeof STATUSES)[number];
  // Side 1
  side1Type: "franchise" | "placeholder";
  team1Id: string;
  team1Placeholder: string;
  // Side 2
  side2Type: "franchise" | "placeholder";
  team2Id: string;
  team2Placeholder: string;
  // Date & Time
  matchDate: string;
  formattedDate: string;
  bsDate: string;
  bsDateNepali: string;
  dayOfWeek: string;
  matchTime: string;
  venue: string;
  isProvisional: boolean;
  // Scorecard, results & external sync
  result: string;
  winnerTeamId: string;
  winMargin: string;
  winType: "runs" | "wickets" | "super_over" | "no_result" | "abandoned" | "";
  playerOfTheMatch: string;
  tossWinnerTeamId: string;
  tossDecision: "bat" | "bowl" | "";
  team1Runs: string;
  team1Wickets: string;
  team1Overs: string;
  team2Runs: string;
  team2Wickets: string;
  team2Overs: string;
  externalProvider: string;
  externalMatchId: string;
}

function buildEditMatchForm(match: AdminMatchRow): EditMatchFormState {
  const isSide1Placeholder = Boolean(match.team1_placeholder);
  const isSide2Placeholder = Boolean(match.team2_placeholder);

  return {
    matchNumber: match.match_number,
    stage: match.stage,
    status: match.status,
    side1Type: isSide1Placeholder ? "placeholder" : "franchise",
    team1Id: match.team1_id || (FRANCHISES[0]?.id ?? ""),
    team1Placeholder: match.team1_placeholder || "rank-1",
    side2Type: isSide2Placeholder ? "placeholder" : "franchise",
    team2Id: match.team2_id || (FRANCHISES[1]?.id ?? ""),
    team2Placeholder: match.team2_placeholder || "rank-2",
    matchDate: match.match_date,
    formattedDate: match.formatted_date,
    bsDate: match.bs_date,
    bsDateNepali: match.bs_date_nepali,
    dayOfWeek: match.day_of_week,
    matchTime: match.match_time,
    venue: match.venue,
    isProvisional: match.is_provisional,
    result: match.result || "",
    winnerTeamId: match.winner_team_id || "",
    winMargin: match.win_margin || "",
    winType: (match.win_type as EditMatchFormState["winType"]) || "",
    playerOfTheMatch: match.player_of_the_match || "",
    tossWinnerTeamId: match.toss_winner_team_id || "",
    tossDecision: (match.toss_decision as EditMatchFormState["tossDecision"]) || "",
    team1Runs:
      match.scores?.team1?.runs !== undefined && match.scores?.team1?.runs !== null
        ? String(match.scores.team1.runs)
        : "",
    team1Wickets:
      match.scores?.team1?.wickets !== undefined && match.scores?.team1?.wickets !== null
        ? String(match.scores.team1.wickets)
        : "",
    team1Overs:
      match.scores?.team1?.overs !== undefined && match.scores?.team1?.overs !== null
        ? String(match.scores.team1.overs)
        : "",
    team2Runs:
      match.scores?.team2?.runs !== undefined && match.scores?.team2?.runs !== null
        ? String(match.scores.team2.runs)
        : "",
    team2Wickets:
      match.scores?.team2?.wickets !== undefined && match.scores?.team2?.wickets !== null
        ? String(match.scores.team2.wickets)
        : "",
    team2Overs:
      match.scores?.team2?.overs !== undefined && match.scores?.team2?.overs !== null
        ? String(match.scores.team2.overs)
        : "",
    externalProvider: match.external_provider || "",
    externalMatchId: match.external_match_id || "",
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
  required?: boolean;
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  note,
  required,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Panel Drawer
// ---------------------------------------------------------------------------

interface EditPanelProps {
  match: AdminMatchRow;
  seasonId: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (updated: AdminMatchRow) => void;
}

function EditPanel({ match, seasonId, accessToken, onClose, onSaved }: EditPanelProps) {
  const [form, setForm] = useState<EditMatchFormState>(() => buildEditMatchForm(match));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function setField<K extends keyof EditMatchFormState>(key: K, val: EditMatchFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSaveError(null);
    setSaveSuccess(false);
  }

  // Handle Date picker changes to auto-suggest formatted date & day of week
  function handleDateChange(isoDate: string) {
    const { formatted, day } = formatDateToReadable(isoDate);
    setForm((prev) => ({
      ...prev,
      matchDate: isoDate,
      formattedDate: formatted || prev.formattedDate,
      dayOfWeek: day || prev.dayOfWeek,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    // Validate sides
    const finalTeam1Id = form.side1Type === "franchise" ? form.team1Id : null;
    const finalTeam1Placeholder = form.side1Type === "placeholder" ? form.team1Placeholder : null;

    const finalTeam2Id = form.side2Type === "franchise" ? form.team2Id : null;
    const finalTeam2Placeholder = form.side2Type === "placeholder" ? form.team2Placeholder : null;

    if (finalTeam1Id && finalTeam2Id && finalTeam1Id === finalTeam2Id) {
      setSaveError("Team 1 and Team 2 cannot be the same franchise.");
      return;
    }

    if (!form.matchDate) {
      setSaveError("Match date is required.");
      return;
    }

    if (!form.matchTime.trim()) {
      setSaveError("Match time is required.");
      return;
    }

    if (!form.venue.trim()) {
      setSaveError("Venue is required.");
      return;
    }

    setIsSaving(true);

    // Construct scores object if runs or overs are given
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scoresObj: any = null;
    const hasTeam1Score = form.team1Runs !== "" || form.team1Overs !== "";
    const hasTeam2Score = form.team2Runs !== "" || form.team2Overs !== "";
    if (hasTeam1Score || hasTeam2Score) {
      scoresObj = {};
      if (hasTeam1Score) {
        scoresObj.team1 = {
          runs: parseInt(form.team1Runs, 10) || 0,
          wickets: parseInt(form.team1Wickets, 10) || 0,
          overs: form.team1Overs.trim() || "0.0",
        };
      }
      if (hasTeam2Score) {
        scoresObj.team2 = {
          runs: parseInt(form.team2Runs, 10) || 0,
          wickets: parseInt(form.team2Wickets, 10) || 0,
          overs: form.team2Overs.trim() || "0.0",
        };
      }
    }

    const selectedWinner = FRANCHISES.find((f) => f.id === form.winnerTeamId);

    const input: UpdateMatchInput = {
      matchId: match.id,
      seasonId,
      matchNumber: form.matchNumber,
      stage: form.stage,
      team1Id: finalTeam1Id,
      team1Placeholder: finalTeam1Placeholder,
      team2Id: finalTeam2Id,
      team2Placeholder: finalTeam2Placeholder,
      matchDate: form.matchDate.trim(),
      formattedDate: form.formattedDate.trim(),
      bsDate: form.bsDate.trim(),
      bsDateNepali: form.bsDateNepali.trim(),
      dayOfWeek: form.dayOfWeek.trim(),
      matchTime: form.matchTime.trim(),
      venue: form.venue.trim(),
      status: form.status,
      isProvisional: form.isProvisional,
      result: form.result.trim() || null,
      winnerTeamId: form.winnerTeamId || null,
      winnerName: selectedWinner ? selectedWinner.name : null,
      winMargin: form.winMargin.trim() || null,
      winType: form.winType ? form.winType : null,
      playerOfTheMatch: form.playerOfTheMatch.trim() || null,
      tossWinnerTeamId: form.tossWinnerTeamId || null,
      tossDecision: form.tossDecision ? form.tossDecision : null,
      scores: scoresObj,
      externalProvider: form.externalProvider.trim() || null,
      externalMatchId: form.externalMatchId.trim() || null,
    };

    const { match: updated, error } = await updateMatchAdmin(input, accessToken);

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
              <span className="text-xs">📅</span>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Editing Tournament Fixture
              </span>
            </div>
            <h2 className="text-lg font-black text-white leading-tight">
              Match #{match.match_number} — {match.stage}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Slug: <span className="text-slate-300 font-mono">{match.slug}</span>
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
          {/* Section 1: Match Meta & Stage */}
          <section>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="inline-block w-4 h-px bg-emerald-400/40" />
              Fixture Specification
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Match # <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={64}
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={form.matchNumber}
                  onChange={(e) => setField("matchNumber", parseInt(e.target.value, 10) || 1)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Stage <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={form.stage}
                  onChange={(e) => setField("stage", e.target.value as (typeof STAGES)[number])}
                >
                  {STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Status <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as (typeof STATUSES)[number])}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Side 1 Assignment */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>🛡️</span> Team 1 (Side 1)
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setField("side1Type", "franchise")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    form.side1Type === "franchise"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Confirmed Franchise
                </button>
                <button
                  type="button"
                  onClick={() => setField("side1Type", "placeholder")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    form.side1Type === "placeholder"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Playoff Placeholder
                </button>
              </div>
            </div>

            {form.side1Type === "franchise" ? (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Select Franchise
                </label>
                <select
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={form.team1Id}
                  onChange={(e) => setField("team1Id", e.target.value)}
                >
                  {FRANCHISES.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.shortName})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Select Playoff Qualification Seed
                </label>
                <select
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={form.team1Placeholder}
                  onChange={(e) => setField("team1Placeholder", e.target.value)}
                >
                  {PLAYOFF_PLACEHOLDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Section 3: Side 2 Assignment */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span>🛡️</span> Team 2 (Side 2)
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setField("side2Type", "franchise")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    form.side2Type === "franchise"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Confirmed Franchise
                </button>
                <button
                  type="button"
                  onClick={() => setField("side2Type", "placeholder")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    form.side2Type === "placeholder"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Playoff Placeholder
                </button>
              </div>
            </div>

            {form.side2Type === "franchise" ? (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Select Franchise
                </label>
                <select
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={form.team2Id}
                  onChange={(e) => setField("team2Id", e.target.value)}
                >
                  {FRANCHISES.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.shortName})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Select Playoff Qualification Seed
                </label>
                <select
                  className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={form.team2Placeholder}
                  onChange={(e) => setField("team2Placeholder", e.target.value)}
                >
                  {PLAYOFF_PLACEHOLDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Section 4: Schedule, Dates & Venue */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <span className="inline-block w-4 h-px bg-emerald-400/40" />
              Schedule &amp; Venue
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Date (Gregorian)"
                type="date"
                value={form.matchDate}
                onChange={handleDateChange}
                required
              />
              <FormField
                label="Match Time"
                value={form.matchTime}
                onChange={(v) => setField("matchTime", v)}
                placeholder="e.g. 12:30 PM NPT or 4:30 PM NPT"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Formatted Gregorian Date"
                value={form.formattedDate}
                onChange={(v) => setField("formattedDate", v)}
                placeholder="e.g. 26 October 2026"
                note="Auto-computed on date change"
              />
              <FormField
                label="Day of Week"
                value={form.dayOfWeek}
                onChange={(v) => setField("dayOfWeek", v)}
                placeholder="e.g. Monday"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Bikram Sambat (Romanized)"
                value={form.bsDate}
                onChange={(v) => setField("bsDate", v)}
                placeholder="e.g. 09 Kartik 2083"
              />
              <FormField
                label="Bikram Sambat (Nepali)"
                value={form.bsDateNepali}
                onChange={(v) => setField("bsDateNepali", v)}
                placeholder="e.g. सोमबार, ९ कार्तिक २०८३"
              />
            </div>

            <FormField
              label="Venue Ground"
              value={form.venue}
              onChange={(v) => setField("venue", v)}
              placeholder="e.g. TU International Cricket Stadium, Kirtipur"
              required
            />
          </section>

          {/* Section 5: Match Scorecard & Results */}
          <section className="space-y-5">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <span className="inline-block w-4 h-px bg-emerald-400/40" />
              Match Scorecard &amp; Results
            </h3>

            {/* Scores sub-section */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scores</p>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  label="Team 1 Runs"
                  value={form.team1Runs}
                  onChange={(v) => setField("team1Runs", v)}
                  placeholder="168"
                />
                <FormField
                  label="Team 1 Wickets"
                  value={form.team1Wickets}
                  onChange={(v) => setField("team1Wickets", v)}
                  placeholder="5"
                />
                <FormField
                  label="Team 1 Overs"
                  value={form.team1Overs}
                  onChange={(v) => setField("team1Overs", v)}
                  placeholder="20.0"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  label="Team 2 Runs"
                  value={form.team2Runs}
                  onChange={(v) => setField("team2Runs", v)}
                  placeholder="142"
                />
                <FormField
                  label="Team 2 Wickets"
                  value={form.team2Wickets}
                  onChange={(v) => setField("team2Wickets", v)}
                  placeholder="4"
                />
                <FormField
                  label="Team 2 Overs"
                  value={form.team2Overs}
                  onChange={(v) => setField("team2Overs", v)}
                  placeholder="17.2"
                />
              </div>
            </div>

            {/* Result sub-section */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Result</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Toss Winner</label>
                  <select
                    className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={form.tossWinnerTeamId}
                    onChange={(e) => setField("tossWinnerTeamId", e.target.value)}
                  >
                    <option value="">-- Not Set --</option>
                    {FRANCHISES.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Toss Decision</label>
                  <select
                    className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={form.tossDecision}
                    onChange={(e) => setField("tossDecision", e.target.value as EditMatchFormState["tossDecision"])}
                  >
                    <option value="">-- Not Set --</option>
                    <option value="bat">Bat</option>
                    <option value="bowl">Bowl</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Winner</label>
                  <select
                    className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={form.winnerTeamId}
                    onChange={(e) => setField("winnerTeamId", e.target.value)}
                  >
                    <option value="">-- Not Completed --</option>
                    {FRANCHISES.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Win Type</label>
                  <select
                    className="w-full bg-[#080e1a] border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={form.winType}
                    onChange={(e) => setField("winType", e.target.value as EditMatchFormState["winType"])}
                  >
                    <option value="">-- Not Set --</option>
                    <option value="runs">runs</option>
                    <option value="wickets">wickets</option>
                    <option value="super_over">super_over</option>
                    <option value="no_result">no_result</option>
                    <option value="abandoned">abandoned</option>
                  </select>
                </div>
              </div>

              <FormField
                label="Win Margin"
                value={form.winMargin}
                onChange={(v) => setField("winMargin", v)}
                placeholder="26 runs"
              />
              <FormField
                label="Player of the Match"
                value={form.playerOfTheMatch}
                onChange={(v) => setField("playerOfTheMatch", v)}
                placeholder=""
              />
              <FormField
                label="Result Statement"
                value={form.result}
                onChange={(v) => setField("result", v)}
                placeholder=""
              />
            </div>

            {/* External Provider sub-section */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">External Provider</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="External Provider"
                  value={form.externalProvider}
                  onChange={(v) => setField("externalProvider", v)}
                  placeholder="thesportsdb or sportmonks"
                />
                <FormField
                  label="External Match ID"
                  value={form.externalMatchId}
                  onChange={(v) => setField("externalMatchId", v)}
                  placeholder="2408031"
                />
              </div>
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
              ✓ Fixture updated successfully.
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
            Fixture edits save directly to Supabase and update the public schedule immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match Row Component
// ---------------------------------------------------------------------------

interface MatchRowProps {
  match: AdminMatchRow;
  onEdit: (match: AdminMatchRow) => void;
}

function MatchRow({ match, onEdit }: MatchRowProps) {
  const team1Info = resolveMatchTeam(match.team1_id, match.team1_placeholder);
  const team2Info = resolveMatchTeam(match.team2_id, match.team2_placeholder);

  const isPlayoff = match.stage !== "League";

  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Match # and Stage */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500">MATCH</span>
            <span className="text-sm font-black text-white">#{match.match_number}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  match.stage === "Final"
                    ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                    : isPlayoff
                    ? "bg-blue-400/10 border-blue-400/30 text-blue-400"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
              >
                {match.stage}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                  match.status === "upcoming"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : match.status === "live"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                    : match.status === "completed"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {match.status}
              </span>
            </div>

            {/* Matchup Title */}
            <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              <span className={team1Info.isPlaceholder ? "text-amber-300/90" : "text-white"}>
                {team1Info.name}
              </span>
              <span className="text-xs font-semibold text-slate-500">vs</span>
              <span className={team2Info.isPlaceholder ? "text-amber-300/90" : "text-white"}>
                {team2Info.name}
              </span>
            </div>

            {/* Date, Time, Venue */}
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{match.formatted_date}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-300 font-mono">{match.match_time}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500">{match.bs_date}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500 truncate max-w-xs">{match.venue}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          <Link
            href={`/matches/${match.slug}`}
            target="_blank"
            className="text-[11px] text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-600 px-2.5 py-1 rounded transition-colors"
          >
            View ↗
          </Link>
          <button
            onClick={() => onEdit(match)}
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
// Main Admin Matches Page
// ---------------------------------------------------------------------------

export default function AdminMatchesPage() {
  const { session, isLoading: authLoading } = useAdminAuth();
  const [matches, setMatches] = useState<AdminMatchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [seasonId, setSeasonId] = useState("season-3");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingMatch, setEditingMatch] = useState<AdminMatchRow | null>(null);

  const accessToken = session?.access_token ?? "";

  // Manual refresh callback
  const handleRefresh = useCallback(() => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadError(null);
    getAllMatchesAdmin(accessToken)
      .then(({ matches: data, error }) => {
        if (error) setLoadError(error);
        else setMatches(data ?? []);
      })
      .catch(() => setLoadError("Failed to load match fixtures."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  // Initial load on mount / token change
  useEffect(() => {
    if (authLoading || !accessToken) return;
    let isMounted = true;
    getAllMatchesAdmin(accessToken)
      .then(({ matches: data, error }) => {
        if (!isMounted) return;
        if (error) setLoadError(error);
        else setMatches(data ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError("Failed to load match fixtures.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [authLoading, accessToken]);

  function handleSaved(updated: AdminMatchRow) {
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  // Filter matches
  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const q = search.toLowerCase().trim();

      // Season filter
      if (m.season_id !== seasonId) return false;

      // Stage filter
      if (selectedStage !== "all" && m.stage !== selectedStage) return false;

      // Status filter
      if (selectedStatus !== "all" && m.status !== selectedStatus) return false;

      if (!q) return true;

      // Search match
      const team1 = resolveMatchTeam(m.team1_id, m.team1_placeholder);
      const team2 = resolveMatchTeam(m.team2_id, m.team2_placeholder);

      return (
        m.match_number.toString().includes(q) ||
        `match ${m.match_number}`.includes(q) ||
        `#${m.match_number}`.includes(q) ||
        m.stage.toLowerCase().includes(q) ||
        m.venue.toLowerCase().includes(q) ||
        m.formatted_date.toLowerCase().includes(q) ||
        m.bs_date.toLowerCase().includes(q) ||
        team1.name.toLowerCase().includes(q) ||
        team2.name.toLowerCase().includes(q)
      );
    });
  }, [matches, search, seasonId, selectedStage, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span>📅</span>
              <span>Tournament Fixture Management</span>
            </div>
            <h1 className="text-2xl font-black text-white">Matches &amp; Schedule</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage fixture schedules, venues, stages, timings, and playoff seed match-ups.
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
            <span className="text-white font-semibold">{matches.length}</span> fixtures registered in database
          </div>
          <div className="text-slate-700">·</div>
          <div className="text-xs text-slate-500">
            All updates sync immediately with the public schedule and match centers.
          </div>
          <div className="text-slate-700">·</div>
          <div className="text-xs text-amber-400">
            ⚠ Match deletion is disabled to preserve tournament bracket and statistical integrity.
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
            placeholder="Search by match #, team, stage, or date…"
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

        {/* Stage Filter */}
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="bg-[#0c121e] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600 transition-colors"
        >
          <option value="all">All Stages</option>
          {STAGES.map((stg) => (
            <option key={stg} value={stg}>
              {stg}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-[#0c121e] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-600 transition-colors"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {st.toUpperCase()}
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

      {/* Live Sync Card */}
      <AdminLiveSyncCard />

      {/* Content */}
      {authLoading || isLoading ? (

        <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading tournament fixtures from database…</p>
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
            {search || selectedStage !== "all" || selectedStatus !== "all"
              ? "No fixtures match your search or filter criteria."
              : "No fixtures found for selected season."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => (
            <MatchRow key={match.id} match={match} onEdit={setEditingMatch} />
          ))}
          <p className="text-[11px] text-slate-600 text-center pt-2">
            Showing {filtered.length} of {matches.filter((m) => m.season_id === seasonId).length} fixtures for{" "}
            {SEASONS.find((s) => s.id === seasonId)?.label}
          </p>
        </div>
      )}

      {/* Slide-in Edit Panel */}
      {editingMatch && (
        <EditPanel
          match={editingMatch}
          seasonId={seasonId}
          accessToken={accessToken}
          onClose={() => setEditingMatch(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  InternalLinkCategory,
  InternalLinkItem,
  searchInternalLinks,
  validateExternalUrl,
} from "@/lib/seo/internal-links";

interface AdminLinkModalProps {
  isOpen: boolean;
  initialAnchorText: string;
  initialUrl?: string;
  isEditingExistingLink?: boolean;
  extraArticles?: Array<{ title: string; slug: string }>;
  onApply: (anchorText: string, url: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

const CATEGORY_TABS: Array<{ id: InternalLinkCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "team", label: "Teams" },
  { id: "player", label: "Players" },
  { id: "page", label: "Tournament Pages" },
  { id: "match", label: "Fixtures" },
  { id: "news", label: "News" },
  { id: "venue", label: "Venues" },
];

export function AdminLinkModal({
  isOpen,
  initialAnchorText,
  initialUrl = "",
  isEditingExistingLink = false,
  extraArticles,
  onApply,
  onRemove,
  onClose,
}: AdminLinkModalProps) {
  const [anchorText, setAnchorText] = useState(initialAnchorText);
  const [mode, setMode] = useState<"internal" | "external">(
    initialUrl.startsWith("http://") || initialUrl.startsWith("https://")
      ? "external"
      : "internal"
  );

  // Internal search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<InternalLinkCategory>("all");
  const [selectedInternalUrl, setSelectedInternalUrl] = useState(
    initialUrl.startsWith("/") ? initialUrl : ""
  );

  // External URL state
  const [externalUrl, setExternalUrl] = useState(
    initialUrl.startsWith("http") ? initialUrl : ""
  );
  const [externalValidation, setExternalValidation] = useState<{
    valid: boolean;
    normalizedUrl: string;
    error?: string;
  }>({ valid: false, normalizedUrl: "" });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAnchorText(initialAnchorText);
      const isExt =
        initialUrl.startsWith("http://") || initialUrl.startsWith("https://");
      setMode(isExt ? "external" : "internal");

      if (isExt) {
        setExternalUrl(initialUrl);
        setExternalValidation(validateExternalUrl(initialUrl));
        setSelectedInternalUrl("");
        setSearchQuery("");
      } else {
        setSelectedInternalUrl(initialUrl.startsWith("/") ? initialUrl : "");
        setExternalUrl("");
        // Pre-fill search query with anchor text if not a link yet, to get instant relevant recommendations
        const cleanAnchor = initialAnchorText.replace(/[^\w\s]/g, "").trim();
        setSearchQuery(initialUrl ? "" : cleanAnchor);
      }
    }
  }, [isOpen, initialAnchorText, initialUrl]);

  // Handle external URL change with live validation
  const handleExternalUrlChange = (val: string) => {
    setExternalUrl(val);
    if (!val.trim()) {
      setExternalValidation({ valid: false, normalizedUrl: "" });
    } else {
      setExternalValidation(validateExternalUrl(val));
    }
  };

  // Search results
  const searchResults = useMemo(() => {
    return searchInternalLinks(searchQuery, selectedCategory, extraArticles);
  }, [searchQuery, selectedCategory, extraArticles]);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAnchor = anchorText.trim() || initialAnchorText.trim() || "link";

    if (mode === "internal") {
      if (!selectedInternalUrl) return;
      onApply(finalAnchor, selectedInternalUrl);
    } else {
      if (!externalValidation.valid || !externalValidation.normalizedUrl) return;
      onApply(finalAnchor, externalValidation.normalizedUrl);
    }
  };

  const isApplyDisabled =
    mode === "internal"
      ? !selectedInternalUrl || !anchorText.trim()
      : !externalValidation.valid || !anchorText.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#090f1d] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-sm">🔗</span>
            <h3 className="text-sm font-bold text-white">
              {isEditingExistingLink ? "Edit Link" : "Insert SEO-Friendly Link"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleApply} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 1. Anchor Text Field */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Anchor Text <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              placeholder="e.g. Janakpur Bolts"
              required
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-600"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Use natural, descriptive text (e.g. entity or team name). Avoid generic anchors like &quot;click here&quot;.
            </p>
          </div>

          {/* 2. Destination Mode Switcher */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Link Destination Type
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setMode("internal")}
                className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  mode === "internal"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🇳🇵 Internal NPL Page</span>
                <span className="text-[10px] px-1 rounded bg-black/20">Canonical</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("external")}
                className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  mode === "external"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🌐 External Web URL</span>
              </button>
            </div>
          </div>

          {/* 3A. Internal Link Search Interface */}
          {mode === "internal" && (
            <div className="space-y-3 pt-1">
              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search NPL teams, players, schedule, standings, venues, news..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-500"
                />
                <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">
                  🔍
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1.5 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-slate-700 text-white border border-slate-600"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Selected Destination Preview */}
              {selectedInternalUrl && (
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-[10px] uppercase bg-emerald-800/80 px-1.5 py-0.2 rounded text-emerald-100">
                      Target
                    </span>
                    <span className="font-mono text-[11px] truncate">
                      {selectedInternalUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInternalUrl("")}
                    className="text-slate-400 hover:text-white text-xs ml-2"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Search Results List */}
              <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800/70 max-h-56 overflow-y-auto bg-slate-950/60">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching destinations found. Try searching for a franchise, player, or page.
                  </div>
                ) : (
                  searchResults.map((item) => {
                    const isSelected = selectedInternalUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedInternalUrl(item.url)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? "bg-emerald-950/60 text-emerald-200 border-l-2 border-emerald-400"
                            : "hover:bg-slate-850 text-slate-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white truncate">
                              {item.title}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                                item.category === "team"
                                  ? "bg-purple-950/80 text-purple-300 border border-purple-800/50"
                                  : item.category === "player"
                                  ? "bg-sky-950/80 text-sky-300 border border-sky-800/50"
                                  : item.category === "match"
                                  ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                                  : "bg-slate-800 text-slate-300 border border-slate-700"
                              }`}
                            >
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {item.url}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 3B. External Web Link Interface */}
          {mode === "external" && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  External URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => handleExternalUrlChange(e.target.value)}
                  placeholder="https://www.can.org.np or https://www.espncricinfo.com/..."
                  className={`w-full bg-slate-900 border text-white rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 ${
                    externalValidation.error
                      ? "border-red-500/80 focus:ring-red-500"
                      : externalValidation.valid
                      ? "border-emerald-500/80 focus:ring-emerald-500"
                      : "border-slate-700 focus:ring-emerald-500"
                  }`}
                />
              </div>

              {/* Live validation feedback */}
              {externalValidation.error && (
                <div className="p-2 rounded bg-red-950/40 border border-red-800/60 text-[11px] text-red-300">
                  ⚠️ {externalValidation.error}
                </div>
              )}

              {externalValidation.valid && (
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/50 text-[11px] text-emerald-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>✓ Valid external URL</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      ({externalValidation.normalizedUrl})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    This link will automatically render with <code>target=&quot;_blank&quot;</code> and <code>rel=&quot;noopener noreferrer&quot;</code> for visitor security.
                  </p>
                </div>
              )}

              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">
                  SEO &amp; Editorial Guidelines:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-400">
                  <li>Link only to authoritative cricket sources or official announcements.</li>
                  <li>Ensure the external destination directly supports the article claim.</li>
                </ul>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2">
          {isEditingExistingLink && onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-800/40 rounded transition-colors"
            >
              ✕ Remove Link
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplyDisabled}
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded transition-colors shadow-sm"
            >
              {isEditingExistingLink ? "Update Link" : "Apply Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

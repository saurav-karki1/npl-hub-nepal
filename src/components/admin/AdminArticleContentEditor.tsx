"use client";

import React, { useState } from "react";
import {
  ArticleBlock,
  blocksToPlainText,
} from "@/lib/types/article-blocks";

interface AdminArticleContentEditorProps {
  rawText: string;
  blocks: ArticleBlock[];
  accessToken: string | null;
  onRawTextChange: (text: string) => void;
  onBlocksChange: (blocks: ArticleBlock[]) => void;
}

export function AdminArticleContentEditor({
  rawText,
  blocks,
  accessToken,
  onRawTextChange,
  onBlocksChange,
}: AdminArticleContentEditorProps) {
  // Mode: "raw" = pasting / writing plain text; "structured" = reviewing / editing AI blocks
  const [activeTab, setActiveTab] = useState<"raw" | "structured">(
    blocks.length > 0 ? "structured" : "raw"
  );
  const [isFormatting, setIsFormatting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [formatSuccess, setFormatSuccess] = useState(false);

  // Backup of original raw text in case user wants to restore
  const [rawBackup, setRawBackup] = useState<string>(rawText);

  // ---------------------------------------------------------------------------
  // AI Format Handler
  // ---------------------------------------------------------------------------
  const handleFormatWithAI = async () => {
    const textToFormat = rawText.trim();
    if (!textToFormat) {
      setAiError("Please paste or write some article content first.");
      return;
    }

    if (!accessToken) {
      setAiError("Authentication token is missing. Please log in again.");
      return;
    }

    setIsFormatting(true);
    setAiError(null);
    setFormatSuccess(false);
    setRawBackup(rawText);

    try {
      const res = await fetch("/api/admin/news/ai-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: textToFormat }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAiError(data.error || "Failed to structure article with AI.");
        setIsFormatting(false);
        return;
      }

      if (Array.isArray(data.blocks) && data.blocks.length > 0) {
        onBlocksChange(data.blocks);
        setFormatSuccess(true);
        setActiveTab("structured");
        setTimeout(() => setFormatSuccess(false), 4000);
      } else {
        setAiError("AI returned an empty response. Please try again.");
      }
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : "Network error calling AI formatting service."
      );
    } finally {
      setIsFormatting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Block Manipulation Handlers
  // ---------------------------------------------------------------------------
  const updateBlock = (index: number, updated: ArticleBlock) => {
    const next = [...blocks];
    next[index] = updated;
    onBlocksChange(next);
  };

  const removeBlock = (index: number) => {
    const next = blocks.filter((_, i) => i !== index);
    onBlocksChange(next);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    onBlocksChange(next);
  };

  const addBlock = (type: ArticleBlock["type"], level: 2 | 3 = 2) => {
    let newBlock: ArticleBlock;
    switch (type) {
      case "heading":
        newBlock = { type: "heading", level, text: "" };
        break;
      case "list":
        newBlock = { type: "list", style: "unordered", items: [""] };
        break;
      case "quote":
        newBlock = { type: "quote", text: "" };
        break;
      case "faq":
        newBlock = { type: "faq", question: "", answer: "" };
        break;
      case "link":
        newBlock = { type: "link", text: "", url: "" };
        break;
      case "paragraph":
      default:
        newBlock = { type: "paragraph", text: "" };
        break;
    }
    onBlocksChange([...blocks, newBlock]);
  };

  const restoreRawText = () => {
    if (window.confirm("Restore original unformatted text? Current block changes will be kept in raw text.")) {
      if (rawBackup && rawBackup.trim()) {
        onRawTextChange(rawBackup);
      } else if (blocks.length > 0) {
        onRawTextChange(blocksToPlainText(blocks));
      }
      setActiveTab("raw");
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Article Content <span className="text-red-400">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Paste complete text → Format with AI → Review semantic blocks → Save
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("raw")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "raw"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ✎ Raw / Paste
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("structured")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "structured"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🧱 Structured Blocks</span>
            {blocks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-700/80 rounded-full font-mono">
                {blocks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notification banners */}
      {aiError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400 flex items-start justify-between gap-2">
          <div>
            <strong className="font-semibold block mb-0.5">AI Formatting Error</strong>
            <span>{aiError}</span>
            <p className="mt-1 text-[11px] text-slate-400">
              Your raw text is safe. You can retry or edit/save manually.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAiError(null)}
            className="text-red-300 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {formatSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-400 flex items-center justify-between">
          <span>✓ Article successfully structured into {blocks.length} semantic blocks!</span>
        </div>
      )}

      {/* TAB 1: RAW TEXT INPUT */}
      {activeTab === "raw" && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => onRawTextChange(e.target.value)}
              rows={14}
              placeholder="Paste or write your full article here...

Include any section headings, subheadings, paragraphs, bullet points, numbers, questions and answers (FAQs).

Click 'Format with AI' below and Gemini will automatically detect the structure without inventing any facts."
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md p-3.5 resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600 font-mono leading-relaxed"
            />
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c121e] border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFormatWithAI}
                disabled={isFormatting || !rawText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isFormatting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Article Structure…</span>
                  </>
                ) : (
                  <>
                    <span>✦ Format with AI</span>
                  </>
                )}
              </button>

              {blocks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("structured")}
                  className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  View Structured Blocks ({blocks.length}) →
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="text-emerald-400">🛡️</span>
              <span>Preserves all facts verbatim. Zero hallucination.</span>
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURED BLOCKS REVIEW / EDITOR */}
      {activeTab === "structured" && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0c121e] border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFormatWithAI}
                disabled={isFormatting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isFormatting ? "Analyzing…" : "✦ Re-run AI"}
              </button>

              <button
                type="button"
                onClick={restoreRawText}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
              >
                ✎ Back to Raw Text
              </button>
            </div>

            {/* Quick Add Block dropdown/buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 mr-1">+ Add:</span>
              <button
                type="button"
                onClick={() => addBlock("paragraph")}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => addBlock("heading", 2)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-purple-300 border border-slate-700"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => addBlock("heading", 3)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-sky-300 border border-slate-700"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => addBlock("list")}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 border border-slate-700"
              >
                List
              </button>
              <button
                type="button"
                onClick={() => addBlock("faq")}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 border border-slate-700"
              >
                FAQ
              </button>
              <button
                type="button"
                onClick={() => addBlock("quote")}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
              >
                Quote
              </button>
            </div>
          </div>

          {blocks.length === 0 ? (
            <div className="bg-[#0c121e] border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
              <p className="text-sm text-slate-400">No structured blocks yet.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Paste your article in the &ldquo;Raw / Paste&rdquo; tab and click &ldquo;Format with AI&rdquo;, or use the buttons above to manually add blocks.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className="text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md"
              >
                Go to Raw / Paste Tab
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a101d] border border-slate-800 rounded-lg p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
                >
                  {/* Block Header Toolbar */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        #{idx + 1}
                      </span>

                      {/* Block Type Badge */}
                      {block.type === "heading" && (
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              block.level === 3
                                ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            }`}
                          >
                            H{block.level} Heading
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(idx, {
                                ...block,
                                level: block.level === 2 ? 3 : 2,
                              })
                            }
                            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
                            title="Toggle between H2 and H3"
                          >
                            Switch to H{block.level === 2 ? 3 : 2}
                          </button>
                        </div>
                      )}

                      {block.type === "paragraph" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          Paragraph
                        </span>
                      )}

                      {block.type === "list" && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {block.style === "ordered" ? "Numbered List" : "Bullet List"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(idx, {
                                ...block,
                                style: block.style === "ordered" ? "unordered" : "ordered",
                              })
                            }
                            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
                          >
                            Switch to {block.style === "ordered" ? "Bullets" : "Numbers"}
                          </button>
                        </div>
                      )}

                      {block.type === "faq" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          FAQ Question &amp; Answer
                        </span>
                      )}

                      {block.type === "quote" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                          Quote / Callout
                        </span>
                      )}

                      {block.type === "link" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          Hyperlink
                        </span>
                      )}
                    </div>

                    {/* Reorder and Delete Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, "up")}
                        disabled={idx === 0}
                        className="text-xs text-slate-400 hover:text-white disabled:opacity-20 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, "down")}
                        disabled={idx === blocks.length - 1}
                        className="text-xs text-slate-400 hover:text-white disabled:opacity-20 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(idx)}
                        className="text-xs text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded bg-red-950/30 border border-red-800/40 ml-1"
                        title="Delete Block"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Block Content Inputs */}
                  <div>
                    {block.type === "heading" && (
                      <input
                        type="text"
                        value={block.text}
                        onChange={(e) =>
                          updateBlock(idx, { ...block, text: e.target.value })
                        }
                        placeholder={`Section heading text...`}
                        className={`w-full bg-slate-900 border text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          block.level === 3
                            ? "font-semibold border-sky-800/60"
                            : "font-bold border-purple-800/60"
                        }`}
                      />
                    )}

                    {block.type === "paragraph" && (
                      <textarea
                        value={block.text}
                        onChange={(e) =>
                          updateBlock(idx, { ...block, text: e.target.value })
                        }
                        rows={3}
                        placeholder="Paragraph text..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y font-sans"
                      />
                    )}

                    {block.type === "list" && (
                      <div className="space-y-1.5">
                        {block.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-5 text-right font-mono">
                              {block.style === "ordered" ? `${itemIdx + 1}.` : "•"}
                            </span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...block.items];
                                newItems[itemIdx] = e.target.value;
                                updateBlock(idx, { ...block, items: newItems });
                              }}
                              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = block.items.filter((_, i) => i !== itemIdx);
                                updateBlock(idx, { ...block, items: newItems });
                              }}
                              className="text-xs text-slate-500 hover:text-red-400 px-1"
                              title="Delete Item"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            updateBlock(idx, {
                              ...block,
                              items: [...block.items, ""],
                            })
                          }
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold mt-1 ml-7"
                        >
                          + Add List Item
                        </button>
                      </div>
                    )}

                    {block.type === "faq" && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            value={block.question}
                            onChange={(e) =>
                              updateBlock(idx, { ...block, question: e.target.value })
                            }
                            placeholder="e.g. When does NPL Season 3 start?"
                            className="w-full bg-slate-900 border border-emerald-900/60 text-white rounded-md px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                            Answer
                          </label>
                          <textarea
                            value={block.answer}
                            onChange={(e) =>
                              updateBlock(idx, { ...block, answer: e.target.value })
                            }
                            rows={2}
                            placeholder="Answer to the question..."
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                          />
                        </div>
                      </div>
                    )}

                    {block.type === "quote" && (
                      <div className="space-y-2">
                        <textarea
                          value={block.text}
                          onChange={(e) =>
                            updateBlock(idx, { ...block, text: e.target.value })
                          }
                          rows={2}
                          placeholder="Quoted text or callout note..."
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-1.5 text-xs italic focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                        />
                        <input
                          type="text"
                          value={block.author || ""}
                          onChange={(e) =>
                            updateBlock(idx, { ...block, author: e.target.value })
                          }
                          placeholder="Author / Attribution (optional)"
                          className="w-full bg-slate-900 border border-slate-750 text-slate-300 rounded-md px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    )}

                    {block.type === "link" && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={block.text}
                          onChange={(e) =>
                            updateBlock(idx, { ...block, text: e.target.value })
                          }
                          placeholder="Link text..."
                          className="bg-slate-900 border border-slate-700 text-white rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <input
                          type="url"
                          value={block.url}
                          onChange={(e) =>
                            updateBlock(idx, { ...block, url: e.target.value })
                          }
                          placeholder="https://..."
                          className="bg-slate-900 border border-slate-700 text-white rounded-md px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

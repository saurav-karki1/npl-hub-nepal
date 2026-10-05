"use client";

import React, { useState, useRef } from "react";
import {
  ArticleBlock,
  ImageBlock,
  blocksToPlainText,
} from "@/lib/types/article-blocks";

interface AdminArticleContentEditorProps {
  rawText: string;
  blocks: ArticleBlock[];
  accessToken: string | null;
  articleId?: string;
  onRawTextChange: (text: string) => void;
  onBlocksChange: (blocks: ArticleBlock[]) => void;
}

export function AdminArticleContentEditor({
  rawText,
  blocks,
  accessToken,
  articleId = "general",
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Backup of original raw text in case user wants to restore
  const [rawBackup, setRawBackup] = useState<string>(rawText);

  // Inserter state: which index is currently expanded to insert a new block
  const [activeInsertIndex, setActiveInsertIndex] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Replacing existing image state
  const [replacingBlockIndex, setReplacingBlockIndex] = useState<number | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const slotFileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingInsertIndexRef = useRef<number | null>(null);

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

  const createDefaultBlock = (
    type: ArticleBlock["type"],
    level: 2 | 3 = 2
  ): ArticleBlock => {
    switch (type) {
      case "heading":
        return { type: "heading", level, text: "" };
      case "list":
        return { type: "list", style: "unordered", items: [""] };
      case "quote":
        return { type: "quote", text: "" };
      case "faq":
        return { type: "faq", question: "", answer: "" };
      case "link":
        return { type: "link", text: "", url: "" };
      case "image":
        return { type: "image", src: "", alt: "" };
      case "paragraph":
      default:
        return { type: "paragraph", text: "" };
    }
  };

  const insertBlockAt = (
    index: number,
    type: ArticleBlock["type"],
    level: 2 | 3 = 2
  ) => {
    if (type === "image") {
      // Trigger file selector for this slot
      pendingInsertIndexRef.current = index;
      slotFileInputRef.current?.click();
      return;
    }

    const newBlock = createDefaultBlock(type, level);
    const next = [...blocks];
    next.splice(index, 0, newBlock);
    onBlocksChange(next);
    setActiveInsertIndex(null);
  };

  const addBlockToEnd = (type: ArticleBlock["type"], level: 2 | 3 = 2) => {
    insertBlockAt(blocks.length, type, level);
  };

  // ---------------------------------------------------------------------------
  // Inline Image Upload Handlers
  // ---------------------------------------------------------------------------
  const uploadInlineImage = async (file: File, targetIndex: number) => {
    if (!accessToken) {
      setUploadError("Authentication required. Please re-login.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files (JPG, PNG, WebP, GIF, AVIF) are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image exceeds the 10MB limit.");
      return;
    }

    setUploadingSlot(targetIndex);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("articleId", articleId || "general");
      formData.append("type", "inline");

      const res = await fetch("/api/admin/news/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(data.error || "Failed to upload image.");
        return;
      }

      const cleanAlt = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();

      const newImgBlock: ImageBlock = {
        type: "image",
        src: data.url,
        alt: cleanAlt || "Article illustration",
        caption: "",
        width: data.width,
        height: data.height,
      };

      const next = [...blocks];
      next.splice(targetIndex, 0, newImgBlock);
      onBlocksChange(next);
      setActiveInsertIndex(null);
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Network error uploading image."
      );
    } finally {
      setUploadingSlot(null);
    }
  };

  const replaceInlineImage = async (file: File, blockIndex: number) => {
    if (!accessToken) {
      setUploadError("Authentication required.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image exceeds 10MB limit.");
      return;
    }

    setUploadingSlot(blockIndex);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("articleId", articleId || "general");
      formData.append("type", "inline");

      const res = await fetch("/api/admin/news/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(data.error || "Failed to replace image.");
        return;
      }

      const existing = blocks[blockIndex];
      if (existing && existing.type === "image") {
        const updated: ImageBlock = {
          ...existing,
          src: data.url,
          width: data.width,
          height: data.height,
        };
        updateBlock(blockIndex, updated);
      }
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Error replacing image."
      );
    } finally {
      setUploadingSlot(null);
      setReplacingBlockIndex(null);
    }
  };

  const handleSlotFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetIdx = pendingInsertIndexRef.current ?? blocks.length;
    if (file) {
      uploadInlineImage(file, targetIdx);
    }
    e.target.value = "";
    pendingInsertIndexRef.current = null;
  };

  const handleReplaceFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && replacingBlockIndex !== null) {
      replaceInlineImage(file, replacingBlockIndex);
    }
    e.target.value = "";
  };

  const handleDropOnSlot = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      uploadInlineImage(file, targetIndex);
    }
  };

  const restoreRawText = () => {
    if (
      window.confirm(
        "Restore original unformatted text? Current block changes will be kept in raw text."
      )
    ) {
      if (rawBackup && rawBackup.trim()) {
        onRawTextChange(rawBackup);
      } else if (blocks.length > 0) {
        onRawTextChange(blocksToPlainText(blocks));
      }
      setActiveTab("raw");
    }
  };

  // ---------------------------------------------------------------------------
  // Sub-component: Inserter Divider between blocks
  // ---------------------------------------------------------------------------
  const renderInserter = (slotIndex: number) => {
    const isExpanded = activeInsertIndex === slotIndex;
    const isDragTarget = dragOverIndex === slotIndex;
    const isSlotUploading = uploadingSlot === slotIndex;

    return (
      <div
        key={`inserter-${slotIndex}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverIndex(slotIndex);
        }}
        onDragLeave={() => {
          setDragOverIndex(null);
        }}
        onDrop={(e) => handleDropOnSlot(e, slotIndex)}
        className="my-1.5 relative group"
      >
        {isSlotUploading ? (
          <div className="py-3 px-4 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center gap-2 text-xs text-emerald-300">
            <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Uploading inline image to storage…</span>
          </div>
        ) : isDragTarget ? (
          <div className="py-4 px-4 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-500/10 text-center text-xs font-semibold text-emerald-300 animate-pulse">
            📷 Drop image file here to insert at position #{slotIndex + 1}
          </div>
        ) : isExpanded ? (
          <div className="bg-[#0b1220] border border-emerald-500/40 rounded-lg p-3 space-y-2.5 shadow-lg animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                Insert block at #{slotIndex + 1}
              </span>
              <button
                type="button"
                onClick={() => setActiveInsertIndex(null)}
                className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5"
              >
                ✕ Cancel
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => insertBlockAt(slotIndex, "paragraph")}
                className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
              >
                + Paragraph
              </button>
              <button
                type="button"
                onClick={() => insertBlockAt(slotIndex, "heading", 2)}
                className="px-2.5 py-1 text-xs font-medium bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 rounded border border-purple-800/40"
              >
                + H2 Heading
              </button>
              <button
                type="button"
                onClick={() => insertBlockAt(slotIndex, "heading", 3)}
                className="px-2.5 py-1 text-xs font-medium bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 rounded border border-sky-800/40"
              >
                + H3 Subheading
              </button>
              <button
                type="button"
                onClick={() => insertBlockAt(slotIndex, "image")}
                className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-sm flex items-center gap-1"
              >
                <span>📷</span>
                <span>+ Upload Image</span>
              </button>
              <button
                type="button"
                onClick={() => insertBlockAt(slotIndex, "list")}
                className="px-2.5 py-1 text-xs font-medium bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded border border-amber-800/40"
              >
                + List
              </button>
              <button
                type="button"
                onClick={() => insertBlockAt(slotIndex, "faq")}
                className="px-2.5 py-1 text-xs font-medium bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 rounded border border-emerald-800/40"
              >
                + FAQ
              </button>
              <button
                type="button"
                onClick={() => insertBlockAt(slotIndex, "quote")}
                className="px-2.5 py-1 text-xs font-medium bg-teal-950/40 hover:bg-teal-900/60 text-teal-300 rounded border border-teal-800/40"
              >
                + Quote
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Tip: You can also drag an image file from your laptop and drop it directly on this divider.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-1 opacity-40 hover:opacity-100 transition-opacity">
            <div className="h-px bg-slate-800 flex-1" />
            <button
              type="button"
              onClick={() => setActiveInsertIndex(slotIndex)}
              className="mx-2 px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-emerald-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 rounded-full transition-all flex items-center gap-1 shadow-sm"
              title="Insert block or drop image here"
            >
              <span>+</span>
              <span>Add</span>
            </button>
            <div className="h-px bg-slate-800 flex-1" />
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Hidden file pickers */}
      <input
        ref={slotFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={handleSlotFileSelected}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={handleReplaceFileSelected}
        className="hidden"
      />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Article Content <span className="text-red-400">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Paste text → Format with AI → Insert inline images &amp; review blocks → Save
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
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-200">AI Formatting Error</span>
            <button
              type="button"
              onClick={() => setAiError(null)}
              className="text-red-400 hover:text-red-200 text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-red-300/90 leading-relaxed">{aiError}</p>
          <p className="text-[11px] text-slate-400 pt-0.5">
            Your raw text is safe. You can retry or edit/save manually.
          </p>
        </div>
      )}

      {uploadError && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-200">Image Upload Error</span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-200 text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-red-300/90 leading-relaxed">{uploadError}</p>
        </div>
      )}

      {formatSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-300 flex items-center justify-between">
          <span>✓ Article successfully structured into semantic blocks! Review or edit below.</span>
          <button
            type="button"
            onClick={() => setFormatSuccess(false)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: RAW / PASTE */}
      {activeTab === "raw" && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => onRawTextChange(e.target.value)}
              rows={14}
              placeholder="Paste or write your full article here...&#10;&#10;Normal paragraphs, section titles (e.g. Venue Details, Match Schedule), lists, quotes, and Q&A will be automatically recognized by AI when you click 'Format with AI'."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3.5 text-xs sm:text-sm font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600 leading-relaxed resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-500">
              {rawText.trim()
                ? `${rawText.trim().split(/\s+/).length} words · ${rawText.length} characters`
                : "Empty article content"}
            </p>

            <div className="flex items-center gap-2">
              {blocks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("structured")}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
                >
                  View Structured Blocks ({blocks.length}) →
                </button>
              )}

              <button
                type="button"
                onClick={handleFormatWithAI}
                disabled={isFormatting || !rawText.trim()}
                className="px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isFormatting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Article Structure…</span>
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    <span>Format with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURED BLOCKS */}
      {activeTab === "structured" && (
        <div className="space-y-3">
          {/* Action Sub-bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFormatWithAI}
                disabled={isFormatting || !rawText.trim()}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors disabled:opacity-40"
              >
                {isFormatting ? "Analyzing…" : "✦ Re-run AI"}
              </button>
              <button
                type="button"
                onClick={restoreRawText}
                className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
              >
                ✎ Back to Raw Text
              </button>
            </div>

            {/* Quick add at end */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-[11px] text-slate-500 mr-1">+ Append:</span>
              <button
                type="button"
                onClick={() => addBlockToEnd("paragraph")}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[11px]"
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => addBlockToEnd("heading", 2)}
                className="px-2 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 text-[11px]"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => addBlockToEnd("heading", 3)}
                className="px-2 py-0.5 rounded bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-800/40 text-[11px]"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => addBlockToEnd("image")}
                className="px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 text-[11px] font-semibold flex items-center gap-1"
              >
                <span>📷</span>
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => addBlockToEnd("list")}
                className="px-2 py-0.5 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 text-[11px]"
              >
                List
              </button>
              <button
                type="button"
                onClick={() => addBlockToEnd("faq")}
                className="px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 text-[11px]"
              >
                FAQ
              </button>
              <button
                type="button"
                onClick={() => addBlockToEnd("quote")}
                className="px-2 py-0.5 rounded bg-teal-950/40 hover:bg-teal-900/60 text-teal-300 border border-teal-800/40 text-[11px]"
              >
                Quote
              </button>
            </div>
          </div>

          {blocks.length === 0 ? (
            <div className="bg-[#0c121e] border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
              <p className="text-sm text-slate-400">No structured blocks yet.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Paste your article in the &ldquo;Raw / Paste&rdquo; tab and click &ldquo;Format with AI&rdquo;, or use the buttons above to manually add blocks and images.
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
            <div className="space-y-1">
              {/* Top inserter */}
              {renderInserter(0)}

              {blocks.map((block, idx) => (
                <React.Fragment key={idx}>
                  <div className="bg-[#0a101d] border border-slate-800 rounded-lg p-3.5 space-y-2.5 hover:border-slate-700 transition-colors">
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

                        {block.type === "image" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span>📷</span>
                            <span>Inline Image</span>
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

                      {/* INLINE IMAGE BLOCK */}
                      {block.type === "image" && (
                        <div className="space-y-3">
                          {block.src ? (
                            <div className="relative max-h-72 w-full rounded-md overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={block.src}
                                alt={block.alt || "Inline image"}
                                className="max-h-64 max-w-full object-contain rounded"
                              />
                            </div>
                          ) : (
                            <div className="p-4 rounded-md border-2 border-dashed border-slate-700 text-center text-xs text-slate-400">
                              No image file selected yet.
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                                Alt Text <span className="text-slate-500 normal-case">(accessibility &amp; SEO)</span>
                              </label>
                              <input
                                type="text"
                                value={block.alt}
                                onChange={(e) =>
                                  updateBlock(idx, { ...block, alt: e.target.value })
                                }
                                placeholder="e.g. NPL Season 3 match schedule at TU ground"
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                                Caption <span className="text-slate-500 normal-case">(optional, displayed below image)</span>
                              </label>
                              <input
                                type="text"
                                value={block.caption || ""}
                                onChange={(e) =>
                                  updateBlock(idx, { ...block, caption: e.target.value })
                                }
                                placeholder="e.g. Official NPL Season 3 tournament schedule"
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-500">
                            <div className="flex items-center gap-2">
                              {block.width && block.height && (
                                <span className="font-mono text-[10px] bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
                                  {block.width} × {block.height} px
                                </span>
                              )}
                              <span
                                className="truncate max-w-[240px] text-[10px] font-mono text-slate-500"
                                title={block.src}
                              >
                                {block.src}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplacingBlockIndex(idx);
                                  replaceFileInputRef.current?.click();
                                }}
                                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-medium transition-colors"
                              >
                                Replace Image
                              </button>
                            </div>
                          </div>
                        </div>
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

                  {/* Inserter after each block */}
                  {renderInserter(idx + 1)}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

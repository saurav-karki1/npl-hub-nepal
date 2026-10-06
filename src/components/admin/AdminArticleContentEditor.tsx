"use client";

import React, { useState, useRef } from "react";
import {
  ArticleBlock,
  ImageBlock,
  blocksToPlainText,
} from "@/lib/types/article-blocks";
import { AdminLinkModal } from "@/components/admin/AdminLinkModal";
import {
  extractMarkdownLinks,
  unlinkMarkdown,
  updateMarkdownLink,
} from "@/lib/seo/internal-links";

interface AdminArticleContentEditorProps {
  rawText: string;
  blocks: ArticleBlock[];
  accessToken: string | null;
  articleId?: string;
  availableArticles?: Array<{ title: string; slug: string }>;
  onRawTextChange: (text: string) => void;
  onBlocksChange: (blocks: ArticleBlock[]) => void;
}

type FieldType =
  | "heading"
  | "paragraph"
  | "quote"
  | "list_item"
  | "faq_q"
  | "faq_a"
  | "link"
  | "raw";

interface LinkTargetState {
  blockIndex: number;
  fieldType: FieldType;
  itemIndex?: number;
  selectionStart: number;
  selectionEnd: number;
  anchorText: string;
  url: string;
  rawLink?: string;
  isEditingExistingLink: boolean;
}

export function AdminArticleContentEditor({
  rawText,
  blocks,
  accessToken,
  articleId = "general",
  availableArticles,
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
  // SEO Linking State & Handlers
  // ---------------------------------------------------------------------------
  const [linkTarget, setLinkTarget] = useState<LinkTargetState | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<{
    blockIndex: number;
    fieldType: FieldType;
    itemIndex?: number;
    start: number;
    end: number;
    text: string;
  } | null>(null);

  const handleTextSelect = (
    blockIndex: number,
    fieldType: FieldType,
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
    itemIndex?: number
  ) => {
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const selText = target.value.substring(start, end);

    if (selText.trim().length > 0) {
      const existingLinks = extractMarkdownLinks(selText);
      if (existingLinks.length > 0) {
        const first = existingLinks[0];
        setCurrentSelection({
          blockIndex,
          fieldType,
          itemIndex,
          start,
          end,
          text: first.text,
        });
      } else {
        setCurrentSelection({
          blockIndex,
          fieldType,
          itemIndex,
          start,
          end,
          text: selText,
        });
      }
    }
  };

  const handleKeyDown = (
    blockIndex: number,
    fieldType: FieldType,
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    itemIndex?: number
  ) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      openLinkModal(blockIndex, fieldType, itemIndex, e.currentTarget);
    }
  };

  const openLinkModal = (
    blockIndex: number,
    fieldType: FieldType,
    itemIndex?: number,
    inputEl?: HTMLInputElement | HTMLTextAreaElement,
    existingLink?: { raw: string; text: string; url: string }
  ) => {
    let anchor = "";
    let url = "";
    let start = 0;
    let end = 0;
    let rawLnk: string | undefined = undefined;
    let isEditing = false;

    if (existingLink) {
      anchor = existingLink.text;
      url = existingLink.url;
      rawLnk = existingLink.raw;
      isEditing = true;
    } else if (inputEl) {
      start = inputEl.selectionStart ?? 0;
      end = inputEl.selectionEnd ?? 0;
      const selected = inputEl.value.substring(start, end);
      if (selected.trim()) {
        const links = extractMarkdownLinks(selected);
        if (links.length > 0) {
          anchor = links[0].text;
          url = links[0].url;
          rawLnk = links[0].raw;
          isEditing = true;
        } else {
          anchor = selected;
        }
      }
    } else if (
      currentSelection &&
      currentSelection.blockIndex === blockIndex &&
      currentSelection.fieldType === fieldType &&
      currentSelection.itemIndex === itemIndex
    ) {
      anchor = currentSelection.text;
      start = currentSelection.start;
      end = currentSelection.end;
    }

    setLinkTarget({
      blockIndex,
      fieldType,
      itemIndex,
      selectionStart: start,
      selectionEnd: end,
      anchorText: anchor,
      url,
      rawLink: rawLnk,
      isEditingExistingLink: isEditing,
    });
    setIsLinkModalOpen(true);
  };

  const applyLink = (newAnchor: string, newUrl: string) => {
    if (!linkTarget) return;

    const {
      blockIndex,
      fieldType,
      itemIndex,
      selectionStart,
      selectionEnd,
      rawLink,
      isEditingExistingLink,
    } = linkTarget;

    const updateFieldValue = (currentVal: string): string => {
      if (isEditingExistingLink && rawLink) {
        return updateMarkdownLink(currentVal, rawLink, newAnchor, newUrl);
      }
      const markdownLnk = `[${newAnchor.trim()}](${newUrl.trim()})`;
      if (selectionStart !== selectionEnd && selectionStart >= 0) {
        return (
          currentVal.substring(0, selectionStart) +
          markdownLnk +
          currentVal.substring(selectionEnd)
        );
      }
      if (currentVal.trim().length > 0) {
        return `${currentVal} ${markdownLnk}`;
      }
      return markdownLnk;
    };

    if (fieldType === "raw") {
      onRawTextChange(updateFieldValue(rawText));
    } else if (blockIndex >= 0 && blockIndex < blocks.length) {
      const block = blocks[blockIndex];
      if (fieldType === "heading" && block.type === "heading") {
        updateBlock(blockIndex, { ...block, text: updateFieldValue(block.text) });
      } else if (fieldType === "paragraph" && block.type === "paragraph") {
        updateBlock(blockIndex, { ...block, text: updateFieldValue(block.text) });
      } else if (fieldType === "quote" && block.type === "quote") {
        updateBlock(blockIndex, { ...block, text: updateFieldValue(block.text) });
      } else if (
        fieldType === "list_item" &&
        block.type === "list" &&
        itemIndex !== undefined
      ) {
        const newItems = [...block.items];
        newItems[itemIndex] = updateFieldValue(newItems[itemIndex] || "");
        updateBlock(blockIndex, { ...block, items: newItems });
      } else if (fieldType === "faq_q" && block.type === "faq") {
        updateBlock(blockIndex, {
          ...block,
          question: updateFieldValue(block.question),
        });
      } else if (fieldType === "faq_a" && block.type === "faq") {
        updateBlock(blockIndex, {
          ...block,
          answer: updateFieldValue(block.answer),
        });
      } else if (fieldType === "link" && block.type === "link") {
        updateBlock(blockIndex, {
          ...block,
          text: updateFieldValue(block.text),
        });
      }
    }

    setIsLinkModalOpen(false);
    setLinkTarget(null);
    setCurrentSelection(null);
  };

  const handleRemoveLink = (
    blockIndex: number,
    fieldType: FieldType,
    rawLink: string,
    itemIndex?: number
  ) => {
    const removeFieldValue = (currentVal: string) => unlinkMarkdown(currentVal, rawLink);

    if (fieldType === "raw") {
      onRawTextChange(removeFieldValue(rawText));
    } else if (blockIndex >= 0 && blockIndex < blocks.length) {
      const block = blocks[blockIndex];
      if (fieldType === "heading" && block.type === "heading") {
        updateBlock(blockIndex, { ...block, text: removeFieldValue(block.text) });
      } else if (fieldType === "paragraph" && block.type === "paragraph") {
        updateBlock(blockIndex, { ...block, text: removeFieldValue(block.text) });
      } else if (fieldType === "quote" && block.type === "quote") {
        updateBlock(blockIndex, { ...block, text: removeFieldValue(block.text) });
      } else if (
        fieldType === "list_item" &&
        block.type === "list" &&
        itemIndex !== undefined
      ) {
        const newItems = [...block.items];
        newItems[itemIndex] = removeFieldValue(newItems[itemIndex] || "");
        updateBlock(blockIndex, { ...block, items: newItems });
      } else if (fieldType === "faq_q" && block.type === "faq") {
        updateBlock(blockIndex, {
          ...block,
          question: removeFieldValue(block.question),
        });
      } else if (fieldType === "faq_a" && block.type === "faq") {
        updateBlock(blockIndex, {
          ...block,
          answer: removeFieldValue(block.answer),
        });
      } else if (fieldType === "link" && block.type === "link") {
        updateBlock(blockIndex, {
          ...block,
          text: removeFieldValue(block.text),
        });
      }
    }
  };

  const renderActiveLinks = (
    text: string,
    blockIndex: number,
    fieldType: FieldType,
    itemIndex?: number
  ) => {
    const links = extractMarkdownLinks(text);
    if (links.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 mt-1 border-t border-slate-800/60 text-xs">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <span>🔗 Active Links:</span>
        </span>
        {links.map((lnk, lIdx) => {
          const isExt =
            lnk.url.startsWith("http://") || lnk.url.startsWith("https://");
          return (
            <div
              key={lIdx}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] ${
                isExt
                  ? "bg-amber-950/40 border-amber-500/30 text-amber-300"
                  : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <span className="font-semibold">{lnk.text}</span>
              <span
                className="text-[10px] opacity-75 font-mono truncate max-w-[140px]"
                title={lnk.url}
              >
                → {lnk.url}
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  openLinkModal(blockIndex, fieldType, itemIndex, undefined, lnk)
                }
                className="text-[10px] px-1 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium ml-0.5"
                title="Edit link destination or anchor text"
              >
                Edit
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  handleRemoveLink(blockIndex, fieldType, lnk.raw, itemIndex)
                }
                className="text-[10px] text-red-400 hover:text-red-200 px-0.5 font-bold"
                title="Remove link (keep plain text)"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    );
  };

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

  const restoreRawText = () => {
    if (blocks.length > 0) {
      const regenerated = blocksToPlainText(blocks);
      onRawTextChange(regenerated || rawBackup);
    } else {
      onRawTextChange(rawBackup);
    }
    setActiveTab("raw");
  };

  // Block manipulation helpers
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
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    onBlocksChange(next);
  };

  const addBlockAt = (index: number, block: ArticleBlock) => {
    const next = [...blocks];
    next.splice(index, 0, block);
    onBlocksChange(next);
    setActiveInsertIndex(null);
  };

  const addBlockToEnd = (type: ArticleBlock["type"], level?: 2 | 3) => {
    let newBlock: ArticleBlock;
    if (type === "heading") {
      newBlock = { type: "heading", level: level || 2, text: "" };
    } else if (type === "list") {
      newBlock = { type: "list", style: "unordered", items: [""] };
    } else if (type === "quote") {
      newBlock = { type: "quote", text: "" };
    } else if (type === "faq") {
      newBlock = { type: "faq", question: "", answer: "" };
    } else if (type === "image") {
      newBlock = { type: "image", src: "", alt: "", caption: "" };
    } else {
      newBlock = { type: "paragraph", text: "" };
    }
    onBlocksChange([...blocks, newBlock]);
  };

  // Image upload helpers
  const uploadAndInsertImage = async (file: File, targetIndex: number) => {
    if (!accessToken) {
      setUploadError("Authentication required to upload images.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files (JPG, PNG, WebP, GIF, SVG) are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image size exceeds the 10MB maximum limit.");
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
    }
  };

  // Drag and Drop handlers for dropping external images directly between blocks
  const handleDragOverSlot = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleDragLeaveSlot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
  };

  const handleDropSlot = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFile = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (imageFile) {
        uploadAndInsertImage(imageFile, index);
      } else {
        setUploadError("Please drop a valid image file.");
      }
    }
  };

  // Inserter UI component
  const renderInserter = (insertIndex: number) => {
    const isExpanded = activeInsertIndex === insertIndex;
    const isDragTarget = dragOverIndex === insertIndex;
    const isUploadingThisSlot = uploadingSlot === insertIndex;

    return (
      <div
        onDragOver={(e) => handleDragOverSlot(e, insertIndex)}
        onDragLeave={handleDragLeaveSlot}
        onDrop={(e) => handleDropSlot(e, insertIndex)}
        className={`group relative py-1.5 transition-all ${
          isDragTarget ? "py-4 bg-emerald-950/30 rounded-lg border-2 border-dashed border-emerald-500" : ""
        }`}
      >
        {isDragTarget ? (
          <div className="text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2 pointer-events-none py-2">
            <span>📷 Drop image here to insert block</span>
          </div>
        ) : isUploadingThisSlot ? (
          <div className="text-center text-xs text-emerald-400 font-semibold py-2 bg-slate-900 border border-emerald-500/40 rounded-lg flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Uploading dropped image…</span>
          </div>
        ) : isExpanded ? (
          <div className="bg-slate-900 border border-emerald-500/50 rounded-lg p-3 space-y-2 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Insert Content Block at position #{insertIndex + 1}
              </span>
              <button
                type="button"
                onClick={() => setActiveInsertIndex(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => addBlockAt(insertIndex, { type: "paragraph", text: "" })}
                className="p-2.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex flex-col items-center gap-1 transition-colors"
              >
                <span className="font-bold">Paragraph</span>
                <span className="text-[10px] text-slate-400">Standard text body</span>
              </button>

              <button
                type="button"
                onClick={() => addBlockAt(insertIndex, { type: "heading", level: 2, text: "" })}
                className="p-2.5 rounded bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-800/40 flex flex-col items-center gap-1 transition-colors"
              >
                <span className="font-bold">H2 Heading</span>
                <span className="text-[10px] text-purple-300/80">Major section title</span>
              </button>

              <button
                type="button"
                onClick={() => addBlockAt(insertIndex, { type: "heading", level: 3, text: "" })}
                className="p-2.5 rounded bg-sky-950/40 hover:bg-sky-900/50 text-sky-200 border border-sky-800/40 flex flex-col items-center gap-1 transition-colors"
              >
                <span className="font-bold">H3 Heading</span>
                <span className="text-[10px] text-sky-300/80">Sub-section title</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  pendingInsertIndexRef.current = insertIndex;
                  slotFileInputRef.current?.click();
                }}
                className="p-2.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-600/50 flex flex-col items-center gap-1 transition-colors font-semibold"
              >
                <span className="font-bold flex items-center gap-1">
                  <span>📷</span>
                  <span>Inline Image</span>
                </span>
                <span className="text-[10px] text-emerald-300/80">Upload from laptop</span>
              </button>

              <button
                type="button"
                onClick={() => addBlockAt(insertIndex, { type: "list", style: "unordered", items: [""] })}
                className="p-2.5 rounded bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border border-amber-800/40 flex flex-col items-center gap-1 transition-colors"
              >
                <span className="font-bold">List</span>
                <span className="text-[10px] text-amber-300/80">Bullet or numbered</span>
              </button>

              <button
                type="button"
                onClick={() => addBlockAt(insertIndex, { type: "faq", question: "", answer: "" })}
                className="p-2.5 rounded bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 border border-emerald-800/40 flex flex-col items-center gap-1 transition-colors"
              >
                <span className="font-bold">FAQ Block</span>
                <span className="text-[10px] text-emerald-300/80">Q&amp;A accordion</span>
              </button>

              <button
                type="button"
                onClick={() => addBlockAt(insertIndex, { type: "quote", text: "" })}
                className="p-2.5 rounded bg-teal-950/40 hover:bg-teal-900/50 text-teal-200 border border-teal-800/40 flex flex-col items-center gap-1 transition-colors"
              >
                <span className="font-bold">Quote</span>
                <span className="text-[10px] text-teal-300/80">Callout blockquote</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800 group-hover:border-slate-700 transition-colors" />
            </div>
            <button
              type="button"
              onClick={() => setActiveInsertIndex(insertIndex)}
              className="relative bg-slate-900 hover:bg-slate-800 text-slate-500 group-hover:text-emerald-400 border border-slate-800 group-hover:border-emerald-500/50 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm"
              title="Insert block or drop image here"
            >
              <span>+</span>
              <span className="text-[10px]">Insert content / image here</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs for image uploads */}
      <input
        type="file"
        ref={replaceFileInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replacingBlockIndex !== null) {
            replaceInlineImage(file, replacingBlockIndex);
            setReplacingBlockIndex(null);
          }
          e.target.value = "";
        }}
      />

      <input
        type="file"
        ref={slotFileInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingInsertIndexRef.current !== null) {
            uploadAndInsertImage(file, pendingInsertIndexRef.current);
            pendingInsertIndexRef.current = null;
          }
          e.target.value = "";
        }}
      />

      {/* Editor Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-3 rounded-lg">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Article Content &amp; Formatting</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              AI-Powered
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Format plain text with AI, insert inline images, add SEO links (Ctrl+K), or edit blocks manually.
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
              onSelect={(e) => handleTextSelect(0, "raw", e)}
              onKeyDown={(e) => handleKeyDown(0, "raw", e)}
              rows={14}
              placeholder="Paste or write your full article here...&#10;&#10;Normal paragraphs, section titles, lists, quotes, and FAQs will be structured automatically by AI when you click 'Format with AI'.&#10;&#10;Highlight text & press Ctrl+K to add SEO internal/external links."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3.5 text-xs sm:text-sm font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600 leading-relaxed resize-y"
            />
          </div>

          {currentSelection && currentSelection.fieldType === "raw" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => openLinkModal(0, "raw")}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-md shadow flex items-center gap-1.5 animate-pulse"
              >
                <span>🔗 Link Selection:</span>
                <span className="underline italic max-w-[180px] truncate">
                  &ldquo;{currentSelection.text}&rdquo;
                </span>
                <span className="text-[10px] bg-emerald-700 px-1 py-0.2 rounded font-mono">
                  Ctrl+K
                </span>
              </button>
            </div>
          )}

          {renderActiveLinks(rawText, 0, "raw")}

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
                Paste your article in the &ldquo;Raw / Paste&rdquo; tab and click &ldquo;Format with AI&rdquo;, or use the buttons above to manually add blocks, images, and links.
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

                        {/* Link Tool Button in Block Toolbar */}
                        {block.type !== "image" && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => openLinkModal(idx, block.type === "list" ? "list_item" : block.type === "faq" ? "faq_q" : block.type)}
                            className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 flex items-center gap-1 transition-colors"
                            title="Add or edit SEO link in this block (Ctrl+K)"
                          >
                            <span>🔗</span>
                            <span>Link</span>
                          </button>
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
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={block.text}
                            onChange={(e) =>
                              updateBlock(idx, { ...block, text: e.target.value })
                            }
                            onSelect={(e) => handleTextSelect(idx, "heading", e)}
                            onKeyDown={(e) => handleKeyDown(idx, "heading", e)}
                            placeholder={`Section heading text...`}
                            className={`w-full bg-slate-900 border text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              block.level === 3
                                ? "font-semibold border-sky-800/60"
                                : "font-bold border-purple-800/60"
                            }`}
                          />
                          {currentSelection &&
                            currentSelection.blockIndex === idx &&
                            currentSelection.fieldType === "heading" && (
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => openLinkModal(idx, "heading")}
                                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-md shadow flex items-center gap-1.5 animate-pulse"
                                >
                                  <span>🔗 Link Selection:</span>
                                  <span className="underline italic max-w-[160px] truncate">
                                    &ldquo;{currentSelection.text}&rdquo;
                                  </span>
                                  <span className="text-[10px] bg-emerald-700 px-1 py-0.2 rounded font-mono">
                                    Ctrl+K
                                  </span>
                                </button>
                              </div>
                            )}
                          {renderActiveLinks(block.text, idx, "heading")}
                        </div>
                      )}

                      {block.type === "paragraph" && (
                        <div className="space-y-1">
                          <textarea
                            value={block.text}
                            onChange={(e) =>
                              updateBlock(idx, { ...block, text: e.target.value })
                            }
                            onSelect={(e) => handleTextSelect(idx, "paragraph", e)}
                            onKeyDown={(e) => handleKeyDown(idx, "paragraph", e)}
                            rows={3}
                            placeholder="Paragraph text..."
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y font-sans"
                          />
                          {currentSelection &&
                            currentSelection.blockIndex === idx &&
                            currentSelection.fieldType === "paragraph" && (
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => openLinkModal(idx, "paragraph")}
                                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-md shadow flex items-center gap-1.5 animate-pulse"
                                >
                                  <span>🔗 Link Selection:</span>
                                  <span className="underline italic max-w-[160px] truncate">
                                    &ldquo;{currentSelection.text}&rdquo;
                                  </span>
                                  <span className="text-[10px] bg-emerald-700 px-1 py-0.2 rounded font-mono">
                                    Ctrl+K
                                  </span>
                                </button>
                              </div>
                            )}
                          {renderActiveLinks(block.text, idx, "paragraph")}
                        </div>
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
                        <div className="space-y-2">
                          {block.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="space-y-1">
                              <div className="flex items-center gap-2">
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
                                  onSelect={(e) => handleTextSelect(idx, "list_item", e, itemIdx)}
                                  onKeyDown={(e) => handleKeyDown(idx, "list_item", e, itemIdx)}
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

                              {currentSelection &&
                                currentSelection.blockIndex === idx &&
                                currentSelection.fieldType === "list_item" &&
                                currentSelection.itemIndex === itemIdx && (
                                  <div className="flex items-center gap-2 ml-7 mt-0.5">
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => openLinkModal(idx, "list_item", itemIdx)}
                                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2.5 py-0.5 rounded shadow flex items-center gap-1 animate-pulse"
                                    >
                                      <span>🔗 Link:</span>
                                      <span className="underline italic max-w-[140px] truncate">
                                        &ldquo;{currentSelection.text}&rdquo;
                                      </span>
                                    </button>
                                  </div>
                                )}

                              <div className="ml-7">
                                {renderActiveLinks(item, idx, "list_item", itemIdx)}
                              </div>
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
                              onSelect={(e) => handleTextSelect(idx, "faq_q", e)}
                              onKeyDown={(e) => handleKeyDown(idx, "faq_q", e)}
                              placeholder="e.g. When does NPL Season 3 start?"
                              className="w-full bg-slate-900 border border-emerald-900/60 text-white rounded-md px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            {currentSelection &&
                              currentSelection.blockIndex === idx &&
                              currentSelection.fieldType === "faq_q" && (
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => openLinkModal(idx, "faq_q")}
                                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-md shadow flex items-center gap-1.5 animate-pulse"
                                  >
                                    <span>🔗 Link Selection:</span>
                                    <span className="underline italic max-w-[160px] truncate">
                                      &ldquo;{currentSelection.text}&rdquo;
                                    </span>
                                  </button>
                                </div>
                              )}
                            {renderActiveLinks(block.question, idx, "faq_q")}
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
                              onSelect={(e) => handleTextSelect(idx, "faq_a", e)}
                              onKeyDown={(e) => handleKeyDown(idx, "faq_a", e)}
                              rows={2}
                              placeholder="Answer to the question..."
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                            />
                            {currentSelection &&
                              currentSelection.blockIndex === idx &&
                              currentSelection.fieldType === "faq_a" && (
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => openLinkModal(idx, "faq_a")}
                                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-md shadow flex items-center gap-1.5 animate-pulse"
                                  >
                                    <span>🔗 Link Selection:</span>
                                    <span className="underline italic max-w-[160px] truncate">
                                      &ldquo;{currentSelection.text}&rdquo;
                                    </span>
                                  </button>
                                </div>
                              )}
                            {renderActiveLinks(block.answer, idx, "faq_a")}
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
                            onSelect={(e) => handleTextSelect(idx, "quote", e)}
                            onKeyDown={(e) => handleKeyDown(idx, "quote", e)}
                            rows={2}
                            placeholder="Quoted text or callout note..."
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-1.5 text-xs italic focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                          />
                          {currentSelection &&
                            currentSelection.blockIndex === idx &&
                            currentSelection.fieldType === "quote" && (
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => openLinkModal(idx, "quote")}
                                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-md shadow flex items-center gap-1.5 animate-pulse"
                                >
                                  <span>🔗 Link Selection:</span>
                                  <span className="underline italic max-w-[160px] truncate">
                                    &ldquo;{currentSelection.text}&rdquo;
                                  </span>
                                </button>
                              </div>
                            )}
                          {renderActiveLinks(block.text, idx, "quote")}

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

      {/* Admin Link Modal Dialog */}
      <AdminLinkModal
        isOpen={isLinkModalOpen}
        initialAnchorText={linkTarget?.anchorText || ""}
        initialUrl={linkTarget?.url || ""}
        isEditingExistingLink={linkTarget?.isEditingExistingLink || false}
        extraArticles={availableArticles}
        onApply={applyLink}
        onRemove={
          linkTarget?.isEditingExistingLink && linkTarget.rawLink
            ? () => {
                handleRemoveLink(
                  linkTarget.blockIndex,
                  linkTarget.fieldType,
                  linkTarget.rawLink!,
                  linkTarget.itemIndex
                );
                setIsLinkModalOpen(false);
                setLinkTarget(null);
              }
            : undefined
        }
        onClose={() => {
          setIsLinkModalOpen(false);
          setLinkTarget(null);
        }}
      />
    </div>
  );
}

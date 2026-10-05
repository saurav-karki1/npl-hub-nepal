"use client";

/**
 * NPL Hub Nepal — Admin News Management Page
 *
 * Manage all news articles (published + drafts) from the Supabase database.
 * Supports creating new articles, editing existing ones, and toggling publish status.
 * All writes go through the secure /api/admin/news route (service-role, server-side).
 * No hard delete — use "Unpublish" (draft) to hide articles from the public site.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import {
  getAllNewsAdmin,
  createNewsAdmin,
  updateNewsAdmin,
  AdminNewsRow,
  CreateNewsInput,
  UpdateNewsInput,
  NewsCategory,
  ArticleStatus,
} from "@/lib/repository/news";
import { AdminArticleContentEditor } from "@/components/admin/AdminArticleContentEditor";
import { AdminFeaturedImageUploader } from "@/components/admin/AdminFeaturedImageUploader";
import {
  ArticleBlock,
  normalizeArticleBlocks,
  blocksToPlainText,
} from "@/lib/types/article-blocks";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: NewsCategory[] = [
  "Tournament",
  "Teams",
  "Matches",
  "Points Table",
  "Announcements",
];

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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function generateId(): string {
  return `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Form State Interface
// ---------------------------------------------------------------------------

interface ArticleFormState {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentText: string; // Raw textarea value
  blocks: ArticleBlock[]; // Structured blocks
  category: NewsCategory;
  status: ArticleStatus;
  featured: boolean;
  image_url: string;
  author: string;
  author_role: string;
  read_time: string;
  tags: string; // Comma-separated
  source: string;
  source_url: string;
  published_at: string;
  teamIds: string[];
}

function defaultForm(): ArticleFormState {
  return {
    id: generateId(),
    slug: "",
    title: "",
    excerpt: "",
    contentText: "",
    blocks: [],
    category: "Tournament",
    status: "draft",
    featured: false,
    image_url: "",
    author: "NPL Hub Nepal Editorial",
    author_role: "Staff Writer",
    read_time: "3 min read",
    tags: "",
    source: "",
    source_url: "",
    published_at: new Date().toISOString().slice(0, 16),
    teamIds: [],
  };
}

function articleToForm(a: AdminNewsRow): ArticleFormState {
  const blocks = normalizeArticleBlocks(a.content);
  const plainText =
    blocks.length > 0
      ? blocksToPlainText(blocks)
      : Array.isArray(a.content)
      ? a.content.join("\n\n")
      : String(a.content ?? "");

  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    contentText: plainText,
    blocks,
    category: a.category,
    status: a.status,
    featured: a.featured,
    image_url: a.image_url ?? "",
    author: a.author,
    author_role: a.author_role,
    read_time: a.read_time,
    tags: Array.isArray(a.tags) ? a.tags.join(", ") : "",
    source: a.source ?? "",
    source_url: a.source_url ?? "",
    published_at: a.published_at?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
    teamIds: a.news_team_relations.map((r) => r.team_id),
  };
}

function formToContentArray(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function formToTagsArray(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ArticleStatus }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
      Draft
    </span>
  );
}

// ---------------------------------------------------------------------------
// Category Badge
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  Tournament: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  Teams: "text-sky-400 bg-sky-500/10 border-sky-500/25",
  Matches: "text-orange-400 bg-orange-500/10 border-orange-500/25",
  "Points Table": "text-pink-400 bg-pink-500/10 border-pink-500/25",
  Announcements: "text-teal-400 bg-teal-500/10 border-teal-500/25",
};

function CategoryBadge({ category }: { category: NewsCategory }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLORS[category]}`}
    >
      {category}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Article Editor Drawer
// ---------------------------------------------------------------------------

interface ArticleEditorProps {
  form: ArticleFormState;
  isCreating: boolean;
  isSaving: boolean;
  saveError: string | null;
  slugManuallyEdited: boolean;
  accessToken: string | null;
  onFormChange: (patch: Partial<ArticleFormState>) => void;
  onSlugManualEdit: () => void;
  onSave: () => void;
  onClose: () => void;
}

function ArticleEditor({
  form,
  isCreating,
  isSaving,
  saveError,
  slugManuallyEdited,
  accessToken,
  onFormChange,
  onSlugManualEdit,
  onSave,
  onClose,
}: ArticleEditorProps) {
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value;
      if (!slugManuallyEdited) {
        onFormChange({ title, slug: generateSlug(title) });
      } else {
        onFormChange({ title });
      }
    },
    [slugManuallyEdited, onFormChange]
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSlugManualEdit();
      onFormChange({ slug: e.target.value });
    },
    [onSlugManualEdit, onFormChange]
  );

  const toggleTeam = useCallback(
    (teamId: string) => {
      const next = form.teamIds.includes(teamId)
        ? form.teamIds.filter((t) => t !== teamId)
        : [...form.teamIds, teamId];
      onFormChange({ teamIds: next });
    },
    [form.teamIds, onFormChange]
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" onClick={onClose} />

      {/* Drawer panel */}
      <div className="w-full max-w-2xl bg-[#080e1a] border-l border-slate-800 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#080e1a] z-10">
          <div>
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-0.5">
              {isCreating ? "New Article" : "Edit Article"}
            </div>
            <h2 className="text-base font-bold text-white">
              {isCreating ? "Create News Article" : form.title || "Edit Article"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-800 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Save error */}
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {saveError}
            </div>
          )}

          {/* Status + Featured row */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => onFormChange({ status: e.target.value as ArticleStatus })}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) => onFormChange({ featured: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <label htmlFor="featured" className="text-sm text-slate-300 cursor-pointer">
                Featured
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Article headline..."
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Slug <span className="text-red-400">*</span>
              {!slugManuallyEdited && isCreating && (
                <span className="ml-2 text-slate-500 normal-case font-normal">auto-generated</span>
              )}
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={handleSlugChange}
              placeholder="url-friendly-slug"
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Excerpt <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => onFormChange({ excerpt: e.target.value })}
              rows={2}
              placeholder="One or two sentence summary for cards and meta descriptions..."
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => onFormChange({ category: e.target.value as NewsCategory })}
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Author + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Author <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => onFormChange({ author: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Author Role <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.author_role}
                onChange={(e) => onFormChange({ author_role: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Read Time + Published At */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Read Time <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.read_time}
                onChange={(e) => onFormChange({ read_time: e.target.value })}
                placeholder="3 min read"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Published At
              </label>
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => onFormChange({ published_at: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Featured Image Upload Area */}
          <div>
            <AdminFeaturedImageUploader
              imageUrl={form.image_url}
              articleId={form.id || form.slug || "article"}
              accessToken={accessToken}
              onImageUrlChange={(url) => onFormChange({ image_url: url })}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Tags <span className="text-slate-500 normal-case font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => onFormChange({ tags: e.target.value })}
              placeholder="NPL, Season 3, Cricket"
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
            />
          </div>

          {/* Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Source
              </label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => onFormChange({ source: e.target.value })}
                placeholder="NPL Hub Nepal Editorial"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Source URL
              </label>
              <input
                type="url"
                value={form.source_url}
                onChange={(e) => onFormChange({ source_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Team Associations */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Associated Teams
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FRANCHISES.map((f) => {
                const selected = form.teamIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleTeam(f.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors ${
                      selected
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: f.brand_color }}
                    />
                    <span className="truncate">{f.name}</span>
                    {selected && <span className="ml-auto">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Article Content with AI Structuring & Inline Images */}
          <div className="pt-1">
            <AdminArticleContentEditor
              rawText={form.contentText}
              blocks={form.blocks}
              accessToken={accessToken}
              articleId={form.id || form.slug || "article"}
              onRawTextChange={(text) => onFormChange({ contentText: text })}
              onBlocksChange={(blocks) => onFormChange({ blocks })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 sticky bottom-0 bg-[#080e1a] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !form.title || !form.slug || !form.excerpt || !form.contentText}
            className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-md transition-colors"
          >
            {isSaving ? "Saving…" : isCreating ? "Create Article" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function AdminNewsPage() {
  const { session, isLoading: authLoading } = useAdminAuth();
  const accessToken = session?.access_token ?? null;

  const [articles, setArticles] = useState<AdminNewsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ArticleStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | NewsCategory>("all");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<AdminNewsRow | null>(null);
  const [form, setForm] = useState<ArticleFormState>(defaultForm);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load articles
  // ---------------------------------------------------------------------------

  const handleRefresh = useCallback(() => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadError(null);
    getAllNewsAdmin(accessToken)
      .then(({ articles: data, error }) => {
        if (error) setLoadError(error);
        else setArticles(data ?? []);
      })
      .catch(() => setLoadError("Failed to load articles."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (authLoading || !accessToken) return;
    let isMounted = true;
    getAllNewsAdmin(accessToken)
      .then(({ articles: data, error }) => {
        if (!isMounted) return;
        if (error) setLoadError(error);
        else setArticles(data ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError("Failed to load articles.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [authLoading, accessToken]);

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.slug.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [articles, statusFilter, categoryFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // Open / close editor
  // ---------------------------------------------------------------------------

  const openCreate = useCallback(() => {
    setEditingArticle(null);
    setForm(defaultForm());
    setSlugManuallyEdited(false);
    setSaveError(null);
    setEditorOpen(true);
  }, []);

  const openEdit = useCallback((article: AdminNewsRow) => {
    setEditingArticle(article);
    setForm(articleToForm(article));
    setSlugManuallyEdited(true); // Editing existing — keep slug as-is
    setSaveError(null);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingArticle(null);
    setSaveError(null);
  }, []);

  const handleFormChange = useCallback((patch: Partial<ArticleFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---------------------------------------------------------------------------
  // Save (create or update)
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(() => {
    if (!accessToken || isSaving) return;

    const contentPayload =
      form.blocks && form.blocks.length > 0
        ? { blocks: form.blocks }
        : formToContentArray(form.contentText);

    const hasValidContent =
      (Array.isArray(contentPayload) && contentPayload.length > 0) ||
      (typeof contentPayload === "object" &&
        "blocks" in contentPayload &&
        contentPayload.blocks.length > 0);

    if (!hasValidContent) {
      setSaveError("Content cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);

    const isCreating = !editingArticle;

    if (isCreating) {
      const input: CreateNewsInput = {
        id: form.id,
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        content: contentPayload,
        category: form.category,
        status: form.status,
        featured: form.featured,
        image_url: form.image_url || null,
        author: form.author,
        author_role: form.author_role,
        read_time: form.read_time,
        tags: formToTagsArray(form.tags),
        source: form.source || null,
        source_url: form.source_url || null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : undefined,
        teamIds: form.teamIds,
      };
      createNewsAdmin(input, accessToken)
        .then(({ article, error }) => {
          setIsSaving(false);
          if (error) {
            setSaveError(error);
            return;
          }
          if (article) {
            setArticles((prev) => [article, ...prev]);
          }
          setSaveSuccess("Article created.");
          setTimeout(() => setSaveSuccess(null), 3000);
          closeEditor();
        })
        .catch(() => {
          setIsSaving(false);
          setSaveError("Network error. Please try again.");
        });
    } else {
      const input: UpdateNewsInput = {
        id: form.id,
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        content: contentPayload,
        category: form.category,
        status: form.status,
        featured: form.featured,
        image_url: form.image_url || null,
        author: form.author,
        author_role: form.author_role,
        read_time: form.read_time,
        tags: formToTagsArray(form.tags),
        source: form.source || null,
        source_url: form.source_url || null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : undefined,
        teamIds: form.teamIds,
      };
      updateNewsAdmin(input, accessToken)
        .then(({ article, error }) => {
          setIsSaving(false);
          if (error) {
            setSaveError(error);
            return;
          }
          if (article) {
            setArticles((prev) => prev.map((a) => (a.id === article.id ? article : a)));
          }
          setSaveSuccess("Article updated.");
          setTimeout(() => setSaveSuccess(null), 3000);
          closeEditor();
        })
        .catch(() => {
          setIsSaving(false);
          setSaveError("Network error. Please try again.");
        });
    }
  }, [accessToken, isSaving, form, editingArticle, closeEditor]);

  // ---------------------------------------------------------------------------
  // Quick publish / unpublish toggle
  // ---------------------------------------------------------------------------

  const handleToggleStatus = useCallback(
    (article: AdminNewsRow) => {
      if (!accessToken) return;
      const newStatus: ArticleStatus = article.status === "published" ? "draft" : "published";
      setToggleError(null);

      const input: UpdateNewsInput = {
        id: article.id,
        status: newStatus,
      };
      updateNewsAdmin(input, accessToken)
        .then(({ article: updated, error }) => {
          if (error) {
            setToggleError(`Could not update "${article.title}": ${error}`);
            return;
          }
          if (updated) {
            setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          }
        })
        .catch(() => {
          setToggleError("Network error toggling article status.");
        });
    },
    [accessToken]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const publishedCount = articles.filter((a) => a.status === "published").length;
  const draftCount = articles.filter((a) => a.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span>📰</span>
              <span>Editorial &amp; CMS</span>
            </div>
            <h1 className="text-2xl font-black text-white">News Management</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Create, edit, and manage NPL Hub Nepal news articles and announcements.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 transition-colors"
            >
              ← Dashboard
            </Link>
            <button
              onClick={openCreate}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md transition-colors"
            >
              + New Article
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Articles", value: articles.length, color: "text-white" },
          { label: "Published", value: publishedCount, color: "text-emerald-400" },
          { label: "Drafts", value: draftCount, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0c121e] border border-slate-800 rounded-xl p-4 text-center">
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Success / toggle error banners */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm text-emerald-400">
          ✓ {saveSuccess}
        </div>
      )}
      {toggleError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{toggleError}</span>
          <button onClick={() => setToggleError(null)} className="ml-4 text-red-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or slug..."
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
            />
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ArticleStatus)}
            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as "all" | NewsCategory)}
            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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

      {/* Articles Table */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading articles…</div>
        ) : loadError ? (
          <div className="p-12 text-center">
            <div className="text-red-400 text-sm mb-3">{loadError}</div>
            <button
              onClick={handleRefresh}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-4 py-2 rounded-md border border-slate-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {articles.length === 0 ? "No articles found." : "No articles match the current filters."}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Article
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-28">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-36">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-32">
                      Published
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-32">
                      Teams
                    </th>
                    <th className="px-4 py-3 w-36" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-white text-sm leading-snug line-clamp-1">
                          {article.featured && (
                            <span className="text-amber-400 mr-1.5 text-[10px]">★</span>
                          )}
                          {article.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          /{article.slug}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={article.status} />
                      </td>
                      <td className="px-4 py-4">
                        <CategoryBadge category={article.category} />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {formatDate(article.published_at)}
                      </td>
                      <td className="px-4 py-4">
                        {article.news_team_relations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {article.news_team_relations.slice(0, 3).map((rel) => {
                              const f = FRANCHISES.find((fr) => fr.id === rel.team_id);
                              return (
                                <span
                                  key={rel.team_id}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-700 text-slate-300"
                                >
                                  {f?.short_name ?? rel.team_id}
                                </span>
                              );
                            })}
                            {article.news_team_relations.length > 3 && (
                              <span className="text-[10px] text-slate-500">
                                +{article.news_team_relations.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(article)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors ${
                              article.status === "published"
                                ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                                : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                          >
                            {article.status === "published" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            onClick={() => openEdit(article)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-800/60">
              {filteredArticles.map((article) => (
                <div key={article.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-white text-sm line-clamp-2">
                        {article.featured && <span className="text-amber-400 mr-1">★</span>}
                        {article.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        /{article.slug}
                      </div>
                    </div>
                    <StatusBadge status={article.status} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge category={article.category} />
                    <span className="text-[11px] text-slate-500">{formatDate(article.published_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleToggleStatus(article)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors ${
                        article.status === "published"
                          ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {article.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => openEdit(article)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* No hard delete notice */}
      <div className="bg-[#0c121e] border border-slate-700/50 rounded-lg px-4 py-3 text-[11px] text-slate-500">
        <strong className="text-slate-400">Note:</strong> Articles are never hard-deleted. Use{" "}
        <strong className="text-slate-400">Unpublish</strong> to hide an article from the public site
        (it becomes a draft). This preserves editorial history and prevents broken links.
      </div>

      {/* Editor drawer */}
      {editorOpen && (
        <ArticleEditor
          form={form}
          isCreating={!editingArticle}
          isSaving={isSaving}
          saveError={saveError}
          slugManuallyEdited={slugManuallyEdited}
          accessToken={accessToken}
          onFormChange={handleFormChange}
          onSlugManualEdit={() => setSlugManuallyEdited(true)}
          onSave={handleSave}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}

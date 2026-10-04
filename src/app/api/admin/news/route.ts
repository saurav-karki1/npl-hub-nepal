/**
 * NPL Hub Nepal — Admin News API Route
 *
 * Secure server-side endpoint for admin news/article management.
 * All write operations require a valid Supabase Auth session token.
 * Uses the service-role client (server-only) — never exposes the key to the browser.
 *
 * GET  /api/admin/news          — List ALL articles (including drafts) + team relations
 * POST /api/admin/news          — Create a new article + optional team relations
 * PUT  /api/admin/news          — Update an existing article + replace team relations
 *
 * Auth: Bearer token in Authorization header (Supabase Auth JWT from session.access_token)
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { ArticleBlock } from "@/lib/types/article-blocks";

// ---------------------------------------------------------------------------
// Auth Helpers
// ---------------------------------------------------------------------------

/** Verify the caller has a valid Supabase Auth session. Returns user or throws. */
async function verifyAuthSession(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header.");
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!anonKey) {
    throw new Error("Supabase public key is not configured.");
  }

  // Use the anon client to verify the user's JWT — this is a standard pattern.
  // The service-role client is only used for actual data mutations.
  const anonClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Invalid or expired session token.");
  }

  return data.user;
}

// ---------------------------------------------------------------------------
// Input Types
// ---------------------------------------------------------------------------

type NewsCategory =
  | "Tournament"
  | "Teams"
  | "Matches"
  | "Points Table"
  | "Announcements";

const VALID_CATEGORIES: NewsCategory[] = [
  "Tournament",
  "Teams",
  "Matches",
  "Points Table",
  "Announcements",
];
const VALID_STATUSES = ["published", "draft"] as const;

export type NewsArticleContent =
  | string[]
  | { blocks: ArticleBlock[] }
  | ArticleBlock[];

interface CreateNewsPayload {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: NewsArticleContent;
  category: NewsCategory;
  status?: "published" | "draft";
  featured?: boolean;
  image_url?: string | null;
  author: string;
  author_role: string;
  read_time: string;
  tags?: string[];
  source?: string | null;
  source_url?: string | null;
  published_at?: string;
  teamIds?: string[];
}

interface UpdateNewsPayload {
  id: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: NewsArticleContent;
  category?: NewsCategory;
  status?: "published" | "draft";
  featured?: boolean;
  image_url?: string | null;
  author?: string;
  author_role?: string;
  read_time?: string;
  tags?: string[];
  source?: string | null;
  source_url?: string | null;
  published_at?: string;
  teamIds?: string[];
}

// ---------------------------------------------------------------------------
// GET /api/admin/news
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    await verifyAuthSession(req);
    const admin = getSupabaseAdminClient();

    // Return ALL articles (published + draft) with team relations & content
    const { data: articles, error } = await admin
      .from("news_articles")
      .select(
        `
        id, slug, title, excerpt, content, category, status,
        featured, image_url, author, author_role, read_time,
        tags, source, source_url, published_at, updated_at, created_at,
        news_team_relations ( id, team_id )
      `
      )
      .order("published_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/news
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    const body: CreateNewsPayload = await req.json();
    const {
      id,
      slug,
      title,
      excerpt,
      content,
      category,
      author,
      author_role,
      read_time,
      teamIds = [],
      ...rest
    } = body;

    // --- Required field validation ---
    if (!id || !slug || !title || !excerpt || !author || !author_role || !read_time) {
      return NextResponse.json(
        { error: "id, slug, title, excerpt, author, author_role, and read_time are required." },
        { status: 400 }
      );
    }
    const hasValidContent =
      (Array.isArray(content) && content.length > 0) ||
      (typeof content === "object" &&
        content !== null &&
        "blocks" in content &&
        Array.isArray((content as { blocks: unknown[] }).blocks) &&
        (content as { blocks: unknown[] }).blocks.length > 0);

    if (!hasValidContent) {
      return NextResponse.json(
        { error: "content must be a non-empty array of paragraph strings or structured blocks." },
        { status: 400 }
      );
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }
    if (rest.status && !VALID_STATUSES.includes(rest.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'published' or 'draft'." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // --- Slug uniqueness check ---
    const { data: existing } = await admin
      .from("news_articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `A news article with slug "${slug}" already exists.` },
        { status: 409 }
      );
    }

    // --- Insert article ---
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertPayload: Record<string, any> = {
      id,
      slug,
      title,
      excerpt,
      content,
      category,
      author,
      author_role,
      read_time,
      status: rest.status ?? "draft",
      featured: rest.featured ?? false,
      tags: rest.tags ?? [],
      published_at: rest.published_at ?? now,
      updated_at: now,
      created_at: now,
    };
    if (rest.image_url !== undefined) insertPayload.image_url = rest.image_url;
    if (rest.source !== undefined) insertPayload.source = rest.source;
    if (rest.source_url !== undefined) insertPayload.source_url = rest.source_url;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (admin as any)
      .from("news_articles")
      .insert(insertPayload);

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // --- Insert team relations ---
    if (teamIds.length > 0) {
      const relations = teamIds.map((team_id: string) => ({ article_id: id, team_id }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: relErr } = await (admin as any)
        .from("news_team_relations")
        .insert(relations);
      if (relErr) {
        return NextResponse.json({ error: relErr.message }, { status: 500 });
      }
    }

    // --- Return the created article ---
    const { data: created, error: fetchErr } = await admin
      .from("news_articles")
      .select(
        `
        id, slug, title, excerpt, content, category, status,
        featured, image_url, author, author_role, read_time,
        tags, source, source_url, published_at, updated_at, created_at,
        news_team_relations ( id, team_id )
      `
      )
      .eq("id", id)
      .single();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    try {
      revalidatePath("/news");
      revalidatePath("/");
      if (slug) revalidatePath(`/news/${slug}`);
    } catch {
      // Ignore revalidation errors in non-edge environments
    }

    return NextResponse.json({ article: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/news
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    const body: UpdateNewsPayload = await req.json();
    const { id, teamIds, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    // --- Validate enum fields if provided ---
    if (fields.category !== undefined && !VALID_CATEGORIES.includes(fields.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }
    if (fields.status !== undefined && !VALID_STATUSES.includes(fields.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'published' or 'draft'." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // --- Slug uniqueness check (must not conflict with OTHER articles) ---
    if (fields.slug !== undefined) {
      const { data: existing } = await admin
        .from("news_articles")
        .select("id")
        .eq("slug", fields.slug)
        .neq("id", id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `A different article already uses slug "${fields.slug}".` },
          { status: 409 }
        );
      }
    }

    // --- Build update object from provided fields ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (fields.slug !== undefined) updatePayload.slug = fields.slug;
    if (fields.title !== undefined) updatePayload.title = fields.title;
    if (fields.excerpt !== undefined) updatePayload.excerpt = fields.excerpt;
    if (fields.content !== undefined) updatePayload.content = fields.content;
    if (fields.category !== undefined) updatePayload.category = fields.category;
    if (fields.status !== undefined) updatePayload.status = fields.status;
    if (fields.featured !== undefined) updatePayload.featured = fields.featured;
    if (fields.image_url !== undefined) updatePayload.image_url = fields.image_url;
    if (fields.author !== undefined) updatePayload.author = fields.author;
    if (fields.author_role !== undefined) updatePayload.author_role = fields.author_role;
    if (fields.read_time !== undefined) updatePayload.read_time = fields.read_time;
    if (fields.tags !== undefined) updatePayload.tags = fields.tags;
    if (fields.source !== undefined) updatePayload.source = fields.source;
    if (fields.source_url !== undefined) updatePayload.source_url = fields.source_url;
    if (fields.published_at !== undefined) updatePayload.published_at = fields.published_at;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("news_articles")
      .update(updatePayload)
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // --- Replace team relations if teamIds was provided ---
    if (teamIds !== undefined) {
      // DELETE existing relations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: delErr } = await (admin as any)
        .from("news_team_relations")
        .delete()
        .eq("article_id", id);

      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      // INSERT new relations
      if (teamIds.length > 0) {
        const relations = teamIds.map((team_id: string) => ({ article_id: id, team_id }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: relErr } = await (admin as any)
          .from("news_team_relations")
          .insert(relations);
        if (relErr) {
          return NextResponse.json({ error: relErr.message }, { status: 500 });
        }
      }
    }

    // --- Return updated article ---
    const { data: updated, error: fetchErr } = await admin
      .from("news_articles")
      .select(
        `
        id, slug, title, excerpt, content, category, status,
        featured, image_url, author, author_role, read_time,
        tags, source, source_url, published_at, updated_at, created_at,
        news_team_relations ( id, team_id )
      `
      )
      .eq("id", id)
      .single();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    try {
      revalidatePath("/news");
      revalidatePath("/");
      const updatedSlug = (updated as { slug?: string } | null)?.slug;
      if (updatedSlug) revalidatePath(`/news/${updatedSlug}`);
      if (fields.slug && fields.slug !== updatedSlug) revalidatePath(`/news/${fields.slug}`);
    } catch {
      // Ignore revalidation errors
    }

    return NextResponse.json({ article: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

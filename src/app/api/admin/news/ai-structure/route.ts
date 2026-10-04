/**
 * NPL Hub Nepal — Admin AI Article Structuring API Route
 *
 * Calls Google Gemini API server-side to analyze raw text and return structured JSON blocks.
 * Protected by Supabase Auth (admin-only).
 * Server-only: GEMINI_API_KEY is never exposed to the client.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { structureArticleWithGemini } from "@/lib/ai-news/gemini-structurer";
import type { Database } from "@/lib/supabase/types";

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

export async function POST(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Article text cannot be empty." },
        { status: 400 }
      );
    }

    const result = await structureArticleWithGemini(text);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to structure article with AI." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      blocks: result.blocks,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

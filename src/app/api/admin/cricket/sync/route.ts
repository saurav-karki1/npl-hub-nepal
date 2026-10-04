/**
 * NPL Hub Nepal — Admin Cricket Sync API
 *
 * POST /api/admin/cricket/sync
 * Triggers live cricket data ingestion from the active provider.
 * Optionally accepts { provider: 'mock' | 'thesportsdb' | 'sportmonks' } in body.
 * Requires a valid Supabase Auth session token.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ingestLiveCricketData } from "@/lib/cricket-api/ingestion";
import { getCricketProvider, CricketProviderName } from "@/lib/cricket-api";

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
  if (!anonKey) throw new Error("Supabase public key is not configured.");
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid or expired session token.");
  return data.user;
}

export async function POST(req: NextRequest) {
  try {
    await verifyAuthSession(req);

    let overrideProvider: CricketProviderName | undefined;
    try {
      const body = await req.json();
      if (body.provider) {
        overrideProvider = body.provider as CricketProviderName;
      }
    } catch {
      // Body is optional
    }

    const providerInstance = overrideProvider
      ? getCricketProvider(overrideProvider)
      : undefined;

    const summary = await ingestLiveCricketData(providerInstance);

    return NextResponse.json({ success: true, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");
    return NextResponse.json({ error: message }, { status: isAuth ? 401 : 500 });
  }
}

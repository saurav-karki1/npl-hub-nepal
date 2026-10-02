/**
 * NPL Hub Nepal — Supabase Server-Only Admin Client
 *
 * Uses the service-role key to bypass RLS for admin write operations.
 * MUST only be imported in server-side code (API routes, Server Actions).
 * NEVER import this file in client components or pages marked "use client".
 *
 * The service-role key is only available server-side via SUPABASE_SERVICE_ROLE_KEY
 * (no NEXT_PUBLIC_ prefix) — it is never exposed to the browser.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Create a fresh Supabase admin client per request.
 * Do NOT cache this as a module-level singleton — service-role clients
 * should not persist across requests.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
        "This key must only be set server-side and never exposed to the browser."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      // Admin client does not manage user sessions — it bypasses RLS via service role.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

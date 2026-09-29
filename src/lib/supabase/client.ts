/**
 * NPL Hub Nepal — Supabase Client
 *
 * Lightweight, type-safe Supabase client initialized via public environment variables.
 * Safe for client-side and server-side usage with zero service-role exposure.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get or initialize the singleton Supabase client
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are set.'
    );
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

/**
 * Direct export for convenient query building
 */
export const supabase = (function () {
  if (typeof window !== 'undefined' || (supabaseUrl && supabaseAnonKey)) {
    try {
      return getSupabaseClient();
    } catch {
      return null as unknown as SupabaseClient<Database>;
    }
  }
  return null as unknown as SupabaseClient<Database>;
})();

/**
 * Helper to check whether Supabase is configured in the current environment
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

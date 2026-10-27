/**
 * NPL Hub Nepal — Admin Server-Side Authorization
 *
 * Verifies Supabase Auth JWT and ensures the authenticated user's email
 * matches the server-side ADMIN_ALLOWED_EMAILS allowlist.
 *
 * Server-side only. Never expose allowlist, tokens, or raw credentials to client or logs.
 */

import type { NextRequest } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Normalizes email address safely by trimming and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Parses a comma-separated list of allowed admin emails from environment variable.
 * Returns an array of normalized emails, excluding empty entries.
 */
export function parseAllowedEmails(rawEnv?: string): string[] {
  if (!rawEnv || typeof rawEnv !== "string") return [];
  return rawEnv
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter((e) => e.length > 0);
}

/**
 * Checks whether a given user email is contained in the allowlist.
 */
export function isEmailAllowed(
  userEmail: string | undefined | null,
  allowedList: string[]
): boolean {
  if (!userEmail || typeof userEmail !== "string") return false;
  const normalized = normalizeEmail(userEmail);
  if (!normalized) return false;
  return allowedList.includes(normalized);
}

export interface VerifyAdminOptions {
  allowedEmails?: string;
  supabaseClient?: {
    auth: {
      getUser: (token: string) => Promise<{ data: { user: User | null }; error: unknown }>;
    };
  };
}

/**
 * Verifies that the incoming request has a valid Supabase Auth session token
 * AND that the authenticated user's email is on the ADMIN_ALLOWED_EMAILS allowlist.
 *
 * Throws AuthError(401) if unauthenticated or token is invalid.
 * Throws AuthError(403) if authenticated but not on the admin allowlist, or if allowlist is not configured.
 */
export async function verifyAdminSession(
  req: NextRequest | { headers: { get: (name: string) => string | null } },
  options?: VerifyAdminOptions
): Promise<User> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or malformed Authorization header.", 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AuthError("Missing or malformed Authorization header.", 401);
  }

  // 1. Authenticate user via Supabase
  let user: User | null = null;

  if (options?.supabaseClient) {
    const { data, error } = await options.supabaseClient.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthError("Invalid or expired session token.", 401);
    }
    user = data.user;
  } else {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new AuthError("Supabase public key is not configured.", 500);
    }

    const anonClient = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data, error } = await anonClient.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthError("Invalid or expired session token.", 401);
    }
    user = data.user;
  }

  // 2. Authorize user against admin allowlist
  const rawAllowed =
    options?.allowedEmails !== undefined
      ? options.allowedEmails
      : process.env.ADMIN_ALLOWED_EMAILS;

  const allowedList = parseAllowedEmails(rawAllowed);

  // If allowlist is missing or empty, fail closed (403)
  if (allowedList.length === 0) {
    throw new AuthError("Forbidden: Insufficient administrative privileges.", 403);
  }

  // User must have an email and it must be in the allowlist
  if (!user.email || !isEmailAllowed(user.email, allowedList)) {
    throw new AuthError("Forbidden: Insufficient administrative privileges.", 403);
  }

  return user;
}

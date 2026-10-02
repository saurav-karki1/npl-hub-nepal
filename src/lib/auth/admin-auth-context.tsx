"use client";

/**
 * NPL Hub Nepal — Admin Auth Context
 *
 * Dedicated Supabase authentication provider for the admin panel.
 * Uses the public anon/publishable key only in browser context.
 * Securely manages session lifecycle, token refresh, and user state.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => configured);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let isMounted = true;
    const client = getSupabaseClient();

    // 1. Initial session check from localStorage
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error && data?.session) {
          setSession(data.session);
          setUser(data.session.user);
        } else {
          setSession(null);
          setUser(null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // 2. Real-time auth state listener (handles token refresh, multi-tab sync, sign-out)
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (!configured) {
        return { error: "Supabase is not configured in this environment." };
      }

      try {
        const client = getSupabaseClient();
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { error: error.message };
        }

        setSession(data.session);
        setUser(data.user);
        return { error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication request failed.";
        return { error: message };
      }
    },
    [configured]
  );

  const signOut = useCallback(async (): Promise<{ error: string | null }> => {
    if (!configured) {
      setUser(null);
      setSession(null);
      return { error: null };
    }

    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      setUser(null);
      setSession(null);
      return { error: error ? error.message : null };
    } catch (err: unknown) {
      setUser(null);
      setSession(null);
      const message = err instanceof Error ? err.message : "Sign out request failed.";
      return { error: message };
    }
  }, [configured]);

  const contextValue = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isConfigured: configured,
      signIn,
      signOut,
    }),
    [user, session, isLoading, configured, signIn, signOut]
  );

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

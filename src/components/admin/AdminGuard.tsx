"use client";

/**
 * NPL Hub Nepal — Admin Route Guard
 *
 * Intercepts all /admin routes:
 * 1. Unauthenticated users visiting /admin/* are redirected to /admin/login.
 * 2. Authenticated users visiting /admin/login are redirected to /admin.
 * 3. Shows a polished loading state while verifying the Supabase session to prevent flash.
 */

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";
import { AdminShell } from "./AdminShell";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isLoginPage) {
      // Unauthenticated user trying to access protected admin page
      router.replace("/admin/login");
    } else if (user && isLoginPage) {
      // Authenticated user trying to access login page
      router.replace("/admin");
    }
  }, [user, isLoading, isLoginPage, router]);

  // Loading state while verifying Supabase session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto relative flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="NPL Hub Nepal Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain animate-pulse"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">
              Verifying Session
            </h2>
            <p className="text-xs text-slate-500">
              Checking Supabase authentication credentials...
            </p>
          </div>
          <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-[#0a5c36] origin-left animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  // Login page handling
  if (isLoginPage) {
    if (user) {
      // Waiting for redirect to /admin
      return null;
    }
    return <>{children}</>;
  }

  // Protected admin routes: if not authenticated, do not render children
  if (!user) {
    return null;
  }

  // Authenticated user: wrap in AdminShell
  return <AdminShell>{children}</AdminShell>;
}

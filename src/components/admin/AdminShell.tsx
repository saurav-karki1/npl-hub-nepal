"use client";

/**
 * NPL Hub Nepal — Admin Dashboard Shell
 *
 * Provides a dedicated, professional management layout with sidebar navigation,
 * system status indicators, user email display, and secure logout.
 */

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Teams",
    href: "/admin/teams",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    name: "Players",
    href: "/admin/players",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: "Matches",
    href: "/admin/matches",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "News",
    href: "/admin/news",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    name: "Stats",
    href: "/admin/stats",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAdminAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col antialiased font-sans">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Site brand */}
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="NPL Hub Nepal Logo"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <span className="font-black tracking-tight text-white text-base sm:text-lg">
              NPL<span className="text-[#10b981]">Hub</span>
            </span>
            <span className="bg-[#0a5c36]/40 border border-[#0a5c36] text-[#34d399] text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ml-1">
              Admin Panel
            </span>
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* View Live Site link */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700/60 transition-colors"
          >
            <span>Live Site</span>
            <span className="text-slate-500">↗</span>
          </Link>

          {/* User badge */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 pl-2.5 pr-3 py-1.5 bg-slate-900/90 rounded-md border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="max-w-[200px] truncate font-medium">
                {user.email}
              </span>
            </div>
          )}

          {/* Logout button */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-100 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoggingOut ? (
              <span>Signing out...</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-[#0c121e] border-r border-slate-800 shrink-0">
          <div className="p-4 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">
                Navigation
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Session Active
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#0a5c36] text-white shadow-sm border border-[#10b981]/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-200" : "text-slate-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer User Info */}
          <div className="p-4 border-t border-slate-800 bg-[#080d16] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-[#10b981]">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {user?.email}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Administrator
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Public Site ↗
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Menu */}
            <div className="relative w-64 max-w-[80%] bg-[#0c121e] border-r border-slate-800 p-4 flex flex-col h-full z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="font-bold text-sm text-white">
                    Admin Navigation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold ${
                        isActive
                          ? "bg-[#0a5c36] text-white border border-[#10b981]/30"
                          : "text-slate-300 hover:bg-slate-800/70"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-200" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Logged in as
                  </p>
                  <p className="text-xs text-slate-200 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/"
                    className="block text-xs text-center py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors"
                  >
                    Public Site ↗
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="block text-xs text-center py-2 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingOut ? "..." : "Logout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

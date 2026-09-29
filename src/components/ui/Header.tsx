"use client";

/**
 * Header / Navigation
 *
 * Desktop: Logo | primary nav links | search icon
 * Mobile:  Logo | hamburger → slide-in nav
 *
 * Design decisions:
 *   - White background with bottom border (editorial newspaper style)
 *   - Brand green accent on active/hover states
 *   - No glassmorphism, no heavy shadows
 *   - Sticky on scroll for easy navigation access
 *   - Accessible: keyboard-navigable, ARIA labels on mobile menu
 *
 * Nav links are defined here as constants.
 * When a CMS or route-based active detection is needed,
 * pass them as props or use usePathname().
 */

import { useState } from "react";
import Link from "next/link";
import { Container } from "./Layout";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Teams", href: "/teams" },
  { label: "Players", href: "/players" },
  { label: "Schedule", href: "/schedule" },
  { label: "Points Table", href: "/points-table" },
  { label: "Stats", href: "/stats" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-canvas)] border-b border-[var(--color-rule)]">
      {/* ── Top bar: site identity ── */}
      <div className="bg-[var(--color-brand)] text-white">
        <Container>
          <div className="flex items-center justify-between h-8">
            <span className="text-[0.6875rem] font-semibold tracking-wider uppercase opacity-80">
              Independent NPL Information Platform
            </span>
            <span className="text-[0.6875rem] font-semibold tracking-wider uppercase opacity-80 hidden sm:block">
              Not affiliated with NPL or CAN
            </span>
          </div>
        </Container>
      </div>

      {/* ── Main navigation bar ── */}
      <Container>
        <div className="flex items-center justify-between h-14 gap-6">
          {/* Logo / Site name */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] focus-visible:outline-offset-2 rounded-sm"
          >
            {/* Simple wordmark — replace with SVG logo when available */}
            <span className="flex items-center gap-1.5">
              <span
                className="flex w-6 h-6 rounded-sm bg-[var(--color-brand)] text-white text-[0.625rem] font-black items-center justify-center leading-none shrink-0"
                aria-hidden="true"
              >
                N
              </span>
              <span className="text-[1.0625rem] font-black tracking-tight text-[var(--color-ink)]">
                NPL<span className="text-[var(--color-brand)]">Hub</span>
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-0.5 flex-1"
            aria-label="Primary navigation"
          >
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              type="button"
              aria-label="Search"
              className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              <SearchIcon />
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </Container>

      {/* ── Mobile navigation dropdown ── */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-[var(--color-rule)] bg-[var(--color-canvas)]"
        >
          <Container>
            <nav
              className="py-3 flex flex-col"
              aria-label="Mobile navigation"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-1 text-[0.9375rem] font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-brand)] border-b border-[var(--color-rule)] last:border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}

/* ── Sub-components ── */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-[0.875rem] font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] rounded-[var(--radius-md)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
    >
      {children}
    </Link>
  );
}

/* ── Icons (inline SVG — no icon library dependency) ── */

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

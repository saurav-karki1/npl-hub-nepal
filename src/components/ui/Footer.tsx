import Link from "next/link";
import { Container } from "./Layout";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-rule)] bg-[var(--color-surface)] text-[var(--color-ink)]">
      {/* ── Main footer content ── */}
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-sm"
            >
              <span
                className="flex w-6 h-6 rounded-sm bg-[var(--color-brand)] text-white text-[0.625rem] font-black items-center justify-center leading-none shrink-0"
                aria-hidden="true"
              >
                N
              </span>
              <span className="text-[1.125rem] font-black tracking-tight text-[var(--color-ink)]">
                NPL<span className="text-[var(--color-brand)]">Hub</span> Nepal
              </span>
            </Link>

            <p className="text-sm text-[var(--color-ink-muted)] max-w-md leading-relaxed">
              Your comprehensive, independent digital guide to the Nepal Premier League. Providing cricket fans with verified match schedules, live updates, standings, team rosters, and tournament statistics.
            </p>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-canvas)] p-3 text-xs text-[var(--color-ink-muted)]">
              <span className="font-semibold text-[var(--color-ink)]">Disclaimer:</span> NPL Hub Nepal is an independent cricket information portal. It is not affiliated with, authorized, or endorsed by the Nepal Premier League (NPL) or the Cricket Association of Nepal (CAN).
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Tournament
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-ink-secondary)]">
              <li>
                <Link href="/schedule" className="hover:text-[var(--color-brand)] transition-colors">
                  Match Schedule
                </Link>
              </li>
              <li>
                <Link href="/points-table" className="hover:text-[var(--color-brand)] transition-colors">
                  Points Table
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-[var(--color-brand)] transition-colors">
                  Tournament Statistics
                </Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-[var(--color-brand)] transition-colors">
                  Franchise Teams
                </Link>
              </li>
              <li>
                <Link href="/players" className="hover:text-[var(--color-brand)] transition-colors">
                  Players Directory
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-[var(--color-brand)] transition-colors">
                  Latest News
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & About */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-ink-secondary)]">
              <li>
                <Link href="/about" className="hover:text-[var(--color-brand)] transition-colors">
                  About NPL Hub
                </Link>
              </li>
              <li>
                <Link href="/about#privacy" className="hover:text-[var(--color-brand)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/about#disclaimer" className="hover:text-[var(--color-brand)] transition-colors">
                  Editorial Policy
                </Link>
              </li>
              <li>
                <Link href="/about#contact" className="hover:text-[var(--color-brand)] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* ── Sub-footer / Copyright ── */}
      <div className="border-t border-[var(--color-rule)] bg-[var(--color-canvas)] py-6 text-xs text-[var(--color-ink-muted)]">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} NPL Hub Nepal. Independent cricket media platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-[var(--color-brand)] transition-colors">
              Home
            </Link>
            <Link href="/teams" className="hover:text-[var(--color-brand)] transition-colors">
              Teams
            </Link>
            <Link href="/schedule" className="hover:text-[var(--color-brand)] transition-colors">
              Schedule
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

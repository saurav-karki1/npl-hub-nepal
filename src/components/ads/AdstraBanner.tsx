"use client";

import { usePathname } from "next/navigation";

/**
 * AdstraBanner
 *
 * Temporary advertising banner for Adstra / Adsterra during NPL Season 3
 * while Google AdSense approval is pending.
 *
 * Excluded on /admin management routes.
 */
export function AdstraBanner() {
  const pathname = usePathname();

  // Do not show ads inside admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className="w-full flex justify-center items-center py-2 px-4 overflow-hidden"
    >
      <div
        id="container-3b5bf07b9b8bde0648233957a035a39b"
        className="w-full max-w-7xl flex justify-center items-center"
        suppressHydrationWarning
      />
    </aside>
  );
}

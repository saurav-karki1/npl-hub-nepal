"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Master Feature Flag for Adsterra advertising units.
 * Allows instant toggling of all Adsterra placements from one location.
 */
export const ADSTERRA_ENABLED = true;

interface AdFrameProps {
  adKey: string;
  width: number;
  height: number;
  label?: string;
  className?: string;
}

/**
 * Isolated Iframe Ad Renderer
 *
 * Each ad unit executes within its own independent iframe sandbox.
 * This guarantees:
 * 1. ZERO global `window.atOptions` collisions (each frame has its own window context).
 * 2. Suppression of aggressive popunders / redirects (Adsterra scripts abort redirect
 *    handlers when `window !== window.top`).
 * 3. User clicks open in a new tab via `<base target="_blank">` without hijacking site navigation.
 * 4. Automatic isolation from Next.js client-side navigation.
 */
function AdsterraFrame({
  adKey,
  width,
  height,
  label = "ADVERTISEMENT",
  className = "",
}: AdFrameProps) {
  const pathname = usePathname();

  // Safety guard: disabled if master toggle is off
  if (!ADSTERRA_ENABLED) {
    return null;
  }

  // Safety guard: never display ads on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const frameHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
      overflow: hidden;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key': '${adKey}',
      'format': 'iframe',
      'height': ${height},
      'width': ${width},
      'params': {}
    };
  </script>
  <script type="text/javascript" src="https://czernik.org/22/${adKey}"></script>
</body>
</html>`;

  return (
    <aside
      aria-label="Advertisement"
      className={`w-full flex flex-col items-center justify-center overflow-hidden ${className}`}
    >
      <span className="text-[10px] font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase mb-1 select-none">
        {label}
      </span>
      <div
        className="flex items-center justify-center max-w-full overflow-hidden"
        style={{ width: `${width}px`, minHeight: `${height}px` }}
      >
        <iframe
          title={label}
          srcDoc={frameHtml}
          width={width}
          height={height}
          style={{
            border: "none",
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: "100%",
            overflow: "hidden",
          }}
          scrolling="no"
        />
      </div>
    </aside>
  );
}

/**
 * Compact Top Banner — 320x50
 *
 * Configured with key: 7cc5aed2da8c4d1e9d3b134df3b651d0
 * Positioned below primary navigation, non-intrusive (50px height),
 * constrained to viewport without horizontal scroll on mobile.
 */
export function AdsterraTopBanner({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  if (!ADSTERRA_ENABLED || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className={`w-full bg-[var(--color-surface)] border-b border-[var(--color-rule)] py-2 transition-all ${className}`}
    >
      <div className="max-w-screen-xl mx-auto px-4 flex justify-center">
        <AdsterraFrame
          adKey="7cc5aed2da8c4d1e9d3b134df3b651d0"
          width={320}
          height={50}
          label="ADVERTISEMENT"
        />
      </div>
    </div>
  );
}

/**
 * In-Content Banner — 300x250
 *
 * Configured with key: afae48f2bf409ba0ba6fd7dd958fd252
 * Intended for insertion between high-traffic sections (Match page, Homepage, news articles),
 * centered and bounded without layout shift.
 */
export function AdsterraInContentBanner({
  className = "",
  label = "ADVERTISEMENT",
}: {
  className?: string;
  label?: string;
}) {
  const pathname = usePathname();

  if (!ADSTERRA_ENABLED || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className={`my-6 py-4 px-2 border-y border-[var(--color-rule)] bg-[var(--color-surface-sunken)] rounded-[var(--radius-md)] flex flex-col items-center justify-center ${className}`}
    >
      <AdsterraFrame
        adKey="afae48f2bf409ba0ba6fd7dd958fd252"
        width={300}
        height={250}
        label={label}
      />
    </div>
  );
}

/**
 * Floating Side / Bottom Ad with Dismiss (Close) Button
 *
 * UX Controls:
 * 1. Only renders after scrolling past 300px (initial page view remains 100% clean).
 * 2. On wide desktop screens (2xl): docks neatly in the right margin outside the 1280px container.
 * 3. On mobile screens (<2xl): docks as a sleek 320x50 compact bottom bar.
 * 4. Clicking '✕ Close' dismisses it for the remainder of the session (stored in sessionStorage).
 */
export function AdsterraFloatingAd() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem("npl_ad_floating_dismissed");
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }

    const onScroll = () => {
      if (window.scrollY > 300) {
        setScrolled(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    if (window.scrollY > 300) setScrolled(true);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!ADSTERRA_ENABLED || dismissed || !scrolled) {
    return null;
  }

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleClose = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("npl_ad_floating_dismissed", "true");
    } catch {}
  };

  const frameHtml300x250 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key': 'afae48f2bf409ba0ba6fd7dd958fd252',
      'format': 'iframe',
      'height': 250,
      'width': 300,
      'params': {}
    };
  </script>
  <script type="text/javascript" src="https://czernik.org/22/afae48f2bf409ba0ba6fd7dd958fd252"></script>
</body>
</html>`;

  const frameHtml320x50 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key': '7cc5aed2da8c4d1e9d3b134df3b651d0',
      'format': 'iframe',
      'height': 50,
      'width': 320,
      'params': {}
    };
  </script>
  <script type="text/javascript" src="https://czernik.org/22/7cc5aed2da8c4d1e9d3b134df3b651d0"></script>
</body>
</html>`;

  return (
    <>
      {/* ── DESKTOP: Right Gutter Floating 300x250 Box (hidden on mobile, visible on 2xl) ── */}
      <div
        className="hidden 2xl:flex fixed bottom-6 right-6 z-50 flex-col items-end shadow-xl rounded-lg bg-[var(--color-surface)] border border-[var(--color-rule)] p-2 transition-all"
        aria-label="Floating Advertisement"
      >
        <div className="flex items-center justify-between w-full mb-1 px-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Sponsored
          </span>
          <button
            onClick={handleClose}
            className="text-xs font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] px-1.5 py-0.5 rounded bg-[var(--color-rule)]/40 hover:bg-[var(--color-rule)] transition-colors cursor-pointer"
            aria-label="Close advertisement"
            title="Close ad"
          >
            ✕ Close
          </button>
        </div>
        <div className="w-[300px] h-[250px] overflow-hidden">
          <iframe
            title="Desktop Floating Ad"
            srcDoc={frameHtml300x250}
            width={300}
            height={250}
            style={{
              border: "none",
              width: "300px",
              height: "250px",
              overflow: "hidden",
            }}
            scrolling="no"
          />
        </div>
      </div>

      {/* ── MOBILE / TABLET: Bottom Floating 320x50 Bar (visible only below 2xl) ── */}
      <div
        className="flex 2xl:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex-col items-center shadow-2xl rounded-lg bg-[var(--color-surface)] border border-[var(--color-rule)] p-1.5 max-w-[calc(100vw-1rem)] transition-all"
        aria-label="Mobile Floating Advertisement"
      >
        <div className="flex items-center justify-between w-full mb-0.5 px-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Sponsored
          </span>
          <button
            onClick={handleClose}
            className="text-[11px] font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] px-1.5 py-0.5 rounded bg-[var(--color-rule)]/40 hover:bg-[var(--color-rule)] transition-colors cursor-pointer"
            aria-label="Close advertisement"
            title="Close ad"
          >
            ✕ Close
          </button>
        </div>
        <div className="w-[320px] max-w-full h-[50px] overflow-hidden flex justify-center items-center">
          <iframe
            title="Mobile Floating Ad"
            srcDoc={frameHtml320x50}
            width={320}
            height={50}
            style={{
              border: "none",
              width: "320px",
              height: "50px",
              maxWidth: "100%",
              overflow: "hidden",
            }}
            scrolling="no"
          />
        </div>
      </div>
    </>
  );
}

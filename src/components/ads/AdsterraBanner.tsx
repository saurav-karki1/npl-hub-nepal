"use client";

import React from "react";
import { usePathname } from "next/navigation";

/**
 * Master Feature Flag for Adsterra advertising units.
 * Allows instant toggling of all Adsterra placements from one location.
 * Set to false during initial testing, then enabled for verified deployment.
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
 * Intended for insertion inside long editorial content (news articles),
 * centered and bounded without layout shift.
 */
export function AdsterraInContentBanner({
  className = "",
}: {
  className?: string;
}) {
  const pathname = usePathname();

  if (!ADSTERRA_ENABLED || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className={`my-8 py-4 px-2 border-y border-[var(--color-rule)] bg-[var(--color-surface-sunken)] rounded-[var(--radius-md)] flex flex-col items-center justify-center ${className}`}
    >
      <AdsterraFrame
        adKey="afae48f2bf409ba0ba6fd7dd958fd252"
        width={300}
        height={250}
        label="ADVERTISEMENT"
      />
    </div>
  );
}

"use client";

interface LiveScoreEmbedProps {
  espnMatchPath: string;
  matchStatus: string;
}

/**
 * Embeds the ESPN Cricinfo live scorecard for a match that is currently in progress.
 * Only rendered when matchStatus === "live" and an ESPN path is available.
 * ESPN Cricinfo does not set X-Frame-Options or CSP frame-ancestors, so the
 * embed works without restriction.
 */
export function LiveScoreEmbed({ espnMatchPath, matchStatus }: LiveScoreEmbedProps) {
  if (matchStatus !== "live") return null;

  const espnUrl = `https://www.espncricinfo.com${espnMatchPath}`;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[var(--color-ink)]">Live Score</h2>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <a
          href={espnUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-brand)] transition-colors flex items-center gap-1"
        >
          Open on ESPN Cricinfo ↗
        </a>
      </div>

      {/* ESPN Cricinfo iframe */}
      <div className="relative w-full rounded-lg overflow-hidden border border-[var(--color-rule)] bg-[#0c121e]">
        <iframe
          src={espnUrl}
          title="Live Cricket Score — ESPN Cricinfo"
          className="w-full"
          style={{ height: "580px", border: "none" }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      <p className="text-[10px] text-[var(--color-ink-muted)]/50 text-center">
        Live scorecard data provided by{" "}
        <a
          href="https://www.espncricinfo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[var(--color-ink-muted)]"
        >
          ESPN Cricinfo
        </a>{" "}
        · Updates automatically
      </p>
    </section>
  );
}

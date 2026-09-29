export function ScheduleHeader() {
  return (
    <header className="space-y-3 border-b border-[var(--color-rule)] pb-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-light)] border border-[var(--color-brand)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
        <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" aria-hidden="true" />
        Season 3 Fixtures · 32 T20 Matches
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--color-ink)] leading-[1.15]">
        NPL Season 3 Schedule & Fixtures
      </h1>

      <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] max-w-3xl leading-relaxed">
        Explore all 32 fixtures and match dates for Nepal Premier League Season 3 (26 October – 21 November 2026). View Nepali Bikram Sambat (BS) dates, Nepal Time (NPT) timings, 8 franchise clashes, and TU International Cricket Stadium venue information.
      </p>
    </header>
  );
}

import { ConstellationBackground } from "@/components/ui/ConstellationBackground";
import { LinkButton } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <ConstellationBackground
        className="bg-[#052618] text-white border border-emerald-950/60 rounded-[var(--radius-lg)] shadow-sm px-6 py-12 sm:px-10 sm:py-16 md:py-20"
      >
        <div className="relative z-10 max-w-2xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-900/60 border border-emerald-700/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" aria-hidden="true" />
            Nepal T20 Cricket
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Nepal Premier League{" "}
            <span className="block text-zinc-300">Season 3</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-5 text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal max-w-xl">
            Experience the thrill of Nepal&apos;s biggest T20 cricket tournament. Follow live scores, team updates, and exclusive news from the NPL Hub.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton
              href="/schedule"
              variant="primary"
              size="lg"
              className="bg-[var(--color-accent)] hover:bg-[#b58f23] text-zinc-950 font-bold border-transparent"
            >
              View Schedule
            </LinkButton>
            <LinkButton
              href="/teams"
              variant="ghost"
              size="lg"
              className="text-white hover:text-white hover:bg-white/10 border border-white/25 font-semibold"
            >
              Explore Teams
            </LinkButton>
          </div>

          {/* Season Meta Pill */}
          <div className="mt-10 pt-6 border-t border-emerald-800/40 flex flex-wrap items-center gap-6 text-xs text-emerald-200/80">
            <div>
              <span className="text-emerald-400 font-semibold">8</span> Franchise Teams
            </div>
            <span className="text-emerald-700" aria-hidden="true">·</span>
            <div>
              <span className="text-emerald-400 font-semibold">32</span> T20 Matches
            </div>
            <span className="text-emerald-700" aria-hidden="true">·</span>
            <div>
              <span className="text-emerald-400 font-semibold">Venue:</span> TU Cricket Ground
            </div>
          </div>
        </div>
      </ConstellationBackground>
    </section>
  );
}

import { ConstellationBackground } from "@/components/ui/ConstellationBackground";
import { LinkButton } from "@/components/ui/Button";

export function AboutHero() {
  return (
    <header className="relative overflow-hidden rounded-[var(--radius-lg)] border border-emerald-950/60 shadow-sm">
      <ConstellationBackground className="bg-[#052618] text-white px-6 py-8 sm:px-10 sm:py-12">
        <div className="relative z-10 space-y-6 max-w-4xl">
          {/* Eyebrow / Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-[var(--radius-sm)] text-[var(--color-accent)]">
              Information Hub
            </span>
            <span className="text-xs font-semibold text-emerald-200/90">
              Season 3 · 2026 Edition
            </span>
            <span className="text-xs text-emerald-500" aria-hidden="true">
              ·
            </span>
            <span className="text-xs text-emerald-200/70">
              Twenty20 (20 Overs)
            </span>
          </div>

          {/* Main Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Nepal Premier League Season 3
            </h1>
            <p className="mt-3 text-sm sm:text-base text-emerald-100/80 leading-relaxed max-w-3xl">
              An independent, comprehensive guide to Nepal’s premier domestic
              Twenty20 cricket competition. Featuring 8 regional franchise
              teams, 32 high-stakes fixtures, and complete tournament coverage
              from Tribhuvan University International Cricket Stadium in
              Kirtipur.
            </p>
          </div>

          {/* Prominent Independence Notice */}
          <div className="rounded-[var(--radius-md)] border border-amber-400/40 bg-amber-950/40 p-4 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
            <span
              className="mt-0.5 w-2 h-2 rounded-full bg-amber-400 shrink-0"
              aria-hidden="true"
            />
            <div>
              <strong className="font-bold text-amber-300 block mb-0.5">
                Independent Platform Notice
              </strong>
              NPL Hub Nepal is an independent cricket information and fan platform.
              We are <strong>not</strong> the official website of the Nepal
              Premier League (NPL) and are <strong>not affiliated with</strong>,
              authorized, or endorsed by the Cricket Association of Nepal (CAN)
              or any participating franchise. All tournament marks, logos, and team
              identities belong to their respective rights holders.
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <LinkButton
              href="/schedule"
              variant="primary"
              size="md"
              className="bg-[var(--color-accent)] hover:bg-[#b58f22] text-[#052618] font-bold"
            >
              Browse Fixtures Schedule →
            </LinkButton>
            <LinkButton
              href="/teams"
              variant="secondary"
              size="md"
              className="border-white/40 text-white hover:bg-white/10"
            >
              View 8 Franchise Teams
            </LinkButton>
            <LinkButton
              href="/points-table"
              variant="secondary"
              size="md"
              className="border-white/40 text-white hover:bg-white/10"
            >
              Check Points Table
            </LinkButton>
          </div>
        </div>
      </ConstellationBackground>
    </header>
  );
}

import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy & Standards",
  description:
    "Editorial Policy for NPL Hub Nepal — our standards for source verification, data integrity, corrections, dual-calendar accuracy, and non-affiliation.",
  alternates: {
    canonical: "/editorial-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LAST_UPDATED = "16 October 2026";
const CONTACT_EMAIL = "nplhubnepal@gmail.com";

export default function EditorialPolicyPage() {
  const principles = [
    {
      title: "1. Zero Fabricated or Speculative Data",
      description:
        "We never invent player career figures, auction numbers, match scores, toss outcomes, or unverified squad signings. When official details have not been released by the Cricket Association of Nepal (CAN) or participating franchises, we state 'To be announced' or clearly label content as provisional.",
    },
    {
      title: "2. Rigorous Source Verification",
      description:
        "Every fixture date, venue detail, and official squad registration published on NPL Hub Nepal is cross-referenced against authoritative sources: CAN official announcements, accredited franchise press releases, and reputable national news organizations (such as The Kathmandu Post, Kantipur, and Ratopati).",
    },
    {
      title: "3. Dual-Calendar Respect (Bikram Sambat & Gregorian)",
      description:
        "We recognize the national importance of the Nepali calendar. All tournament match days, schedule announcements, and historical records display verified Bikram Sambat (BS 2083) dates alongside Gregorian dates, verified against official astronomical panchang calendars.",
    },
    {
      title: "4. Clear Separation of Fact & Editorial Analysis",
      description:
        "Our editorial articles distinguish factual reporting from opinion. Features such as squad power rankings, tactical previews, and pitch assessments are explicitly labeled with editorial disclaimers stating they reflect analytical opinion based on confirmed data.",
    },
    {
      title: "5. Transparent Corrections Protocol",
      description:
        "When an error occurs — whether a schedule change, player replacement, or typographical mistake — we correct it promptly across our centralized data layers. If an article's factual premise changes, an explicit correction note is appended indicating the update timestamp.",
    },
    {
      title: "6. Trademark & Brand Asset Usage",
      description:
        "All tournament titles, franchise names, team crests, and associated trademarks remain the exclusive intellectual property of CAN and their respective franchise owners. Their presentation here is strictly for descriptive, non-commercial fan reference and journalistic reporting under fair use principles.",
    },
  ];

  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[var(--color-ink-muted)]">
          <ol className="flex items-center gap-1.5" role="list">
            <li>
              <Link href="/" className="hover:text-[var(--color-brand)] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-[var(--color-ink)]">
              Editorial Policy
            </li>
          </ol>
        </nav>

        <article className="max-w-3xl mx-auto">
          {/* Page header */}
          <header className="mb-10 pb-6 border-b border-[var(--color-rule)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] mb-2">
              Journalistic Standards
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-ink)] leading-tight mb-3">
              Editorial Policy &amp; Data Accuracy
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          {/* Non-affiliation notice */}
          <div className="mb-8 rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="block font-bold mb-1">Independent Editorial Platform</strong>
            <p>
              NPL Hub Nepal is an <strong>independent cricket information portal</strong>. It is not affiliated with,
              authorized, maintained, sponsored, or endorsed by the Nepal Premier League (NPL), the Cricket Association
              of Nepal (CAN), or any participating cricket franchise.
            </p>
          </div>

          <div className="space-y-8 text-sm text-[var(--color-ink)] leading-relaxed">
            <section aria-labelledby="mission-heading">
              <h2 id="mission-heading" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                Our Editorial Mission
              </h2>
              <p>
                NPL Hub Nepal was created by Nepali cricket enthusiasts to provide domestic supporters, diaspora followers,
                and cricket analysts worldwide with a fast, structured, accurate, and ad-clutter-free guide to the Nepal Premier League.
              </p>
              <p className="mt-3">
                In a media ecosystem frequently crowded with clickbait rumors, speculative player auctions, and outdated schedules,
                our commitment is accuracy first. We operate under structured journalistic standards to ensure every fixture,
                points table standing, and squad profile is grounded in verified evidence.
              </p>
            </section>

            <section aria-labelledby="principles-heading">
              <h2 id="principles-heading" className="text-xl font-bold text-[var(--color-ink)] mb-4 pb-1 border-b border-[var(--color-rule)]">
                Core Editorial Principles
              </h2>
              <div className="space-y-4">
                {principles.map((principle, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] space-y-2"
                  >
                    <h3 className="text-base font-bold text-[var(--color-ink)]">
                      {principle.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="corrections-heading">
              <h2 id="corrections-heading" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                How to Request a Correction
              </h2>
              <p>
                We welcome and encourage corrections from readers, players, coaches, and sports journalists. If you observe
                any factual inaccuracy in our schedules, scores, player records, or articles:
              </p>
              <div className="mt-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-canvas)] text-xs sm:text-sm space-y-2">
                <p>
                  1. Email us at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] font-bold hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                  {" "}with the subject line: <strong>Data Correction: [Page or Match Title]</strong>.
                </p>
                <p>
                  2. Include the specific URL, the current text/data, and the proposed correction.
                </p>
                <p>
                  3. Provide a citation or link to an authoritative primary source (e.g., official CAN document, verified team press release, or video broadcast).
                </p>
                <p className="pt-2 text-xs text-[var(--color-ink-muted)]">
                  Our editorial desk reviews correction submissions promptly and updates the live database upon verification.
                </p>
              </div>
            </section>
          </div>

          {/* Footer nav */}
          <div className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
            <LinkButton href="/" variant="secondary" size="sm">
              &larr; Return to Home
            </LinkButton>
            <div className="flex items-center gap-2">
              <LinkButton href="/terms" variant="ghost" size="sm">
                Terms of Use &rarr;
              </LinkButton>
              <LinkButton href="/privacy-policy" variant="ghost" size="sm">
                Privacy Policy &rarr;
              </LinkButton>
              <LinkButton href="/contact" variant="ghost" size="sm">
                Contact Us &rarr;
              </LinkButton>
            </div>
          </div>
        </article>
      </Container>
    </div>
  );
}

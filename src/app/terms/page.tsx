import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for NPL Hub Nepal — acceptable use, informational accuracy limitations, intellectual property notices, and independent platform disclaimer.",
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LAST_UPDATED = "16 October 2026";
const SITE_NAME = "NPL Hub Nepal";
const SITE_URL = "https://nplhubnepal.vercel.app";
const CONTACT_EMAIL = "nplhubnepal@gmail.com";

export default function TermsOfUsePage() {
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
              Terms of Use
            </li>
          </ol>
        </nav>

        <article className="max-w-3xl mx-auto">
          {/* Page header */}
          <header className="mb-10 pb-6 border-b border-[var(--color-rule)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] mb-2">
              Legal Agreement
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-ink)] leading-tight mb-3">
              Terms of Use
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          {/* Non-affiliation notice */}
          <div className="mb-8 rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="block font-bold mb-1">Independent Fan Resource</strong>
            <p>
              {SITE_NAME} is an independent, unofficial digital publication. It is not affiliated with,
              authorized, maintained, sponsored, or endorsed by the Nepal Premier League (NPL), the Cricket
              Association of Nepal (CAN), or any participating franchise.
            </p>
          </div>

          <div className="space-y-8 text-sm text-[var(--color-ink)] leading-relaxed">
            {/* 1. Acceptance */}
            <section aria-labelledby="acceptance">
              <h2 id="acceptance" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using {SITE_NAME} ({SITE_URL}), you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Use and our{" "}
                <Link href="/privacy-policy" className="text-[var(--color-brand)] hover:underline font-semibold">
                  Privacy Policy
                </Link>
                . If you do not agree with any part of these terms, please discontinue using the website.
              </p>
            </section>

            {/* 2. Informational Purpose */}
            <section aria-labelledby="informational-purpose">
              <h2 id="informational-purpose" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                2. Informational &amp; Editorial Nature
              </h2>
              <p>
                All content published on {SITE_NAME} — including match schedules, tournament standings, team
                squads, player profiles, and news analysis — is provided strictly for informational, educational,
                and non-commercial fan reference.
              </p>
              <p className="mt-3">
                While we make diligent efforts to maintain complete and updated information, match schedules,
                broadcasting arrangements, ticket prices, and squad rosters are subject to change by CAN and
                franchise management without prior notice. Readers should consult official CAN channels (
                <a href="https://can.org.np" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand)] hover:underline">
                  can.org.np
                </a>
                ) for official regulatory matters.
              </p>
            </section>

            {/* 3. Acceptable Use */}
            <section aria-labelledby="acceptable-use">
              <h2 id="acceptable-use" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                3. Acceptable Use Policy
              </h2>
              <p>You agree to use {SITE_NAME} solely for lawful purposes. You agree not to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-[var(--color-ink-secondary)]">
                <li>Deploy automated bots, spiders, or scrapers to extract bulk content without prior written permission.</li>
                <li>Engage in any activity that disrupts, overburdens, or impairs the proper operation of our servers or networks.</li>
                <li>Attempt to bypass security features, access administrative endpoints, or probe system vulnerabilities.</li>
                <li>Misrepresent {SITE_NAME} as an official organ or affiliate of CAN or the NPL.</li>
              </ul>
            </section>

            {/* 4. Intellectual Property */}
            <section aria-labelledby="intellectual-property">
              <h2 id="intellectual-property" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                4. Intellectual Property
              </h2>
              <p>
                <strong>Original Content:</strong> All original editorial articles, tournament format explanations,
                custom code, and platform designs are the intellectual property of {SITE_NAME} and are protected under
                applicable copyright and intellectual property laws.
              </p>
              <p className="mt-3">
                <strong>Third-Party Trademarks:</strong> Franchise names, crests, player names, and tournament titles
                belong to their respective owners. Their display on {SITE_NAME} is strictly for identification and
                descriptive editorial reference under fair use principles.
              </p>
            </section>

            {/* 5. External Links */}
            <section aria-labelledby="external-links">
              <h2 id="external-links" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                5. Links to Third-Party Websites
              </h2>
              <p>
                {SITE_NAME} may contain links to external third-party websites for source attribution, news reporting,
                or official references. We have no control over the content or practices of these external sites and
                accept no responsibility for any loss or damage arising from your use of them.
              </p>
            </section>

            {/* 6. Limitation of Liability */}
            <section aria-labelledby="liability">
              <h2 id="liability" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                6. Limitation of Liability
              </h2>
              <p>
                {SITE_NAME} is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of
                any kind, express or implied. Under no circumstances shall {SITE_NAME}, its contributors, or operators
                be liable for any indirect, incidental, or consequential damages resulting from your use of or inability
                to use the platform.
              </p>
            </section>

            {/* 7. Changes to Terms */}
            <section aria-labelledby="modifications">
              <h2 id="modifications" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                7. Modifications to Terms
              </h2>
              <p>
                We reserve the right to revise these Terms of Use at any time. Any changes will become effective immediately
                upon publication with an updated &quot;Last updated&quot; timestamp. Continued use of the website following
                any revisions constitutes acceptance of the new terms.
              </p>
            </section>

            {/* 8. Contact */}
            <section aria-labelledby="contact">
              <h2 id="contact" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                8. Contact Information
              </h2>
              <p>
                If you have questions regarding these Terms of Use, please contact us at:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] hover:underline font-semibold">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </section>
          </div>

          {/* Footer nav */}
          <div className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
            <LinkButton href="/" variant="secondary" size="sm">
              &larr; Return to Home
            </LinkButton>
            <div className="flex items-center gap-2">
              <LinkButton href="/privacy-policy" variant="ghost" size="sm">
                Privacy Policy &rarr;
              </LinkButton>
              <LinkButton href="/editorial-policy" variant="ghost" size="sm">
                Editorial Policy &rarr;
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

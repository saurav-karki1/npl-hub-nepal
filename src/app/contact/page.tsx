import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact NPL Hub Nepal — get in touch with our independent Nepal Premier League editorial team for data corrections, feedback, or press inquiries.",
  alternates: {
    canonical: "/contact",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const CONTACT_EMAIL = "nplhubnepal@gmail.com";
const SITE_URL = "https://nplhubnepal.vercel.app";

export default function ContactPage() {
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
              Contact
            </li>
          </ol>
        </nav>

        <div className="max-w-2xl mx-auto">
          {/* Page header */}
          <header className="mb-8 pb-6 border-b border-[var(--color-rule)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] mb-2">
              Get In Touch
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-ink)] leading-tight mb-3">
              Contact NPL Hub Nepal
            </h1>
            <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
              NPL Hub Nepal is an independent digital cricket publication. We welcome factual corrections,
              schedule updates, editorial feedback, and general inquiries from cricket supporters, journalists,
              and research communities.
            </p>
          </header>

          {/* Non-affiliation notice */}
          <div className="mb-8 rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="block font-bold mb-1">Independent Platform Notice</strong>
            <p>
              NPL Hub Nepal is <strong>not affiliated with, authorized, or endorsed by</strong> the official Nepal
              Premier League (NPL) or the Cricket Association of Nepal (CAN). We cannot process ticket bookings,
              stadium accreditation, player registrations, or official CAN administrative inquiries. For official
              matters, please visit{" "}
              <a
                href="https://can.org.np"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                can.org.np
              </a>
              .
            </p>
          </div>

          {/* Contact details card */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-[var(--color-surface)] overflow-hidden mb-8 shadow-xs">
            <div className="border-b border-[var(--color-rule)] px-6 py-4 bg-[var(--color-canvas)]">
              <h2 className="text-base font-bold text-[var(--color-ink)]">Official Editorial Contact</h2>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm">
              <div className="flex items-start gap-4">
                <span className="shrink-0 mt-0.5 text-[var(--color-brand)] font-bold text-xs uppercase tracking-wider w-20">
                  Email
                </span>
                <div>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-[var(--color-brand)] hover:underline font-bold text-base break-all"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    For all editorial corrections, feedback, and general inquiries.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 pt-3 border-t border-[var(--color-rule)]">
                <span className="shrink-0 mt-0.5 text-[var(--color-brand)] font-bold text-xs uppercase tracking-wider w-20">
                  Website
                </span>
                <div>
                  <a
                    href={SITE_URL}
                    className="text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors font-medium"
                  >
                    {SITE_URL}
                  </a>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    Published and hosted independently for cricket enthusiasts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reasons to contact */}
          <section aria-labelledby="contact-reasons" className="mb-8">
            <h2 id="contact-reasons" className="text-xl font-bold text-[var(--color-ink)] mb-4">
              When to Contact Us
            </h2>
            <div className="space-y-3">
              {[
                {
                  title: "Factual & Schedule Corrections",
                  body: "If you spot an inaccurate match time, Bikram Sambat date mismatch, typographical error, or squad change, please email us with a reference link. We prioritize immediate verified corrections.",
                },
                {
                  title: "Editorial Feedback & Analysis",
                  body: "Have feedback on our match previews, team rankings, or points table calculators? We welcome constructive critiques from cricket enthusiasts and analysts.",
                },
                {
                  title: "Copyright & Intellectual Property",
                  body: "If you are a copyright owner and believe content on our platform infringes upon your intellectual property, please email us directly with specific details for prompt review and resolution.",
                },
                {
                  title: "Press & Media Inquiries",
                  body: "Journalists, bloggers, and researchers seeking commentary or collaboration regarding NPL data architecture and coverage may contact our editorial desk.",
                },
              ].map(({ title, body }) => (
                <div
                  key={title}
                  className="p-4 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-canvas)] space-y-1"
                >
                  <h3 className="text-sm font-bold text-[var(--color-ink)]">{title}</h3>
                  <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Response time notice */}
          <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface-sunken)] p-4 text-xs text-[var(--color-ink-muted)] mb-8">
            <strong className="text-[var(--color-ink)]">Turnaround Time:</strong> We are a dedicated,
            volunteer-supported sports platform. We review correspondence regularly and endeavor to respond
            within 3&ndash;5 business days. During active tournament match days (October&ndash;November), critical
            schedule and data corrections are prioritized.
          </div>

          {/* Footer nav */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[var(--color-rule)]">
            <LinkButton href="/" variant="secondary" size="sm">
              &larr; Return to Home
            </LinkButton>
            <div className="flex items-center gap-2">
              <LinkButton href="/about" variant="ghost" size="sm">
                About NPL Hub &rarr;
              </LinkButton>
              <LinkButton href="/editorial-policy" variant="ghost" size="sm">
                Editorial Policy &rarr;
              </LinkButton>
              <LinkButton href="/privacy-policy" variant="ghost" size="sm">
                Privacy Policy &rarr;
              </LinkButton>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

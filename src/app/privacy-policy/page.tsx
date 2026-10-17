import type { Metadata } from "next";
import { Container } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for NPL Hub Nepal — learn how we collect, use, and protect your data when you visit our independent Nepal Premier League information platform.",
  alternates: {
    canonical: "/privacy-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LAST_UPDATED = "17 October 2026";
const SITE_NAME = "NPL Hub Nepal";
const SITE_URL = "https://nplhubnepal.vercel.app";
const CONTACT_EMAIL = "nplhubnepal@gmail.com";
const CONTACT_PHONE_DISPLAY = "+977 9814996840";
const CONTACT_PHONE_TEL = "+9779814996840";

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </li>
          </ol>
        </nav>

        <article className="max-w-3xl mx-auto">
          {/* Page header */}
          <header className="mb-10 pb-6 border-b border-[var(--color-rule)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] mb-2">
              Legal &amp; Transparency
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-ink)] leading-tight mb-3">
              Privacy Policy
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Effective Date: {LAST_UPDATED} &middot; Last updated: {LAST_UPDATED}
            </p>
          </header>

          {/* Non-affiliation notice */}
          <div className="mb-8 rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="block font-bold mb-1">Independent Platform Notice</strong>
            <p>
              {SITE_NAME} is an independent, unofficial cricket information platform.
              It is not affiliated with, authorized, maintained, sponsored, or endorsed by
              the Nepal Premier League (NPL), the Cricket Association of Nepal (CAN), or any
              participating cricket franchise.
            </p>
          </div>

          <div className="space-y-8 text-sm text-[var(--color-ink)] leading-relaxed">
            {/* 1. Who We Are */}
            <section aria-labelledby="who-we-are">
              <h2 id="who-we-are" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                1. Who We Are &amp; Scope
              </h2>
              <p>
                {SITE_NAME} (accessible at{" "}
                <a href={SITE_URL} className="text-[var(--color-brand)] hover:underline font-semibold">
                  {SITE_URL}
                </a>
                ) provides verified schedules, dual-calendar fixtures (Bikram Sambat and Gregorian),
                standings, team rosters, player directories, and independent editorial coverage of Nepal
                Premier League cricket.
              </p>
              <p className="mt-3">
                This Privacy Policy explains how we collect, handle, and protect visitor information when
                you access or use our website. We are committed to transparency and honoring user privacy.
                For any privacy inquiries or data requests, you can contact us directly at:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] hover:underline font-semibold">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section aria-labelledby="information-collected">
              <h2 id="information-collected" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                2. Information We Collect
              </h2>
              <p>
                We believe in data minimization. You can browse all public sections of {SITE_NAME} without
                creating an account, registering, or providing personal credentials. We collect only the
                following categories of information:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-[var(--color-ink-secondary)]">
                <li>
                  <strong className="text-[var(--color-ink)]">Automated Usage Data:</strong> When you access
                  the website, analytics tools collect non-personally identifiable technical information, such
                  as browser type, operating system, device screen resolution, referring URLs, pages visited,
                  session duration, and approximate geographic region (country or city level).
                </li>
                <li>
                  <strong className="text-[var(--color-ink)]">Log Data:</strong> Like standard web platforms,
                  our hosting infrastructure (Vercel) records HTTP request logs including IP addresses, timestamps,
                  and requested URLs for security, DDoS protection, and operational diagnostics.
                </li>
                <li>
                  <strong className="text-[var(--color-ink)]">Contact Form Submissions &amp; Voluntary Correspondence:</strong> When
                  you submit an inquiry via our website contact form or send us an email directly, we collect your
                  name, email address, subject, and the contents of your message. This data is transmitted securely
                  to our editorial desk (using email delivery infrastructure, such as Formspree) and is utilized solely
                  to review, evaluate, and respond to your communication (such as investigating reported factual corrections,
                  addressing copyright inquiries, or incorporating user feedback). We do not sell, rent, monetize, or
                  disclose your contact details to third-party marketers.
                </li>
              </ul>
            </section>

            {/* 3. How We Use Your Information */}
            <section aria-labelledby="how-we-use">
              <h2 id="how-we-use" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                3. How We Use Your Information
              </h2>
              <p>We use collected data solely for legitimate, transparent purposes:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-[var(--color-ink-secondary)]">
                <li>To maintain, optimize, and improve the speed, accessibility, and content of {SITE_NAME}.</li>
                <li>To monitor reader interest across fixture guides, standings, and editorial articles.</li>
                <li>To investigate and rectify reported factual errors in schedules or squad lists.</li>
                <li>To detect, prevent, and mitigate security incidents, spam, or malicious traffic.</li>
                <li>To respond promptly to visitor feedback and editorial correspondence.</li>
              </ul>
              <p className="mt-3">
                We do not sell, rent, monetize, or trade visitor contact details with third parties for their
                independent marketing purposes.
              </p>
            </section>

            {/* 4. Cookies and Similar Technologies */}
            <section aria-labelledby="cookies">
              <h2 id="cookies" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                4. Cookies &amp; Similar Technologies
              </h2>
              <p>
                Cookies are small text files placed on your device to help web servers recognize returning
                browsers and retain preferences. The table below details the categories of cookies utilized
                on or applicable to {SITE_NAME}:
              </p>

              <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-rule)]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[var(--color-surface)] border-b border-[var(--color-rule)]">
                    <tr>
                      <th scope="col" className="py-3 px-4 font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">Cookie Category</th>
                      <th scope="col" className="py-3 px-4 font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">Purpose</th>
                      <th scope="col" className="py-3 px-4 font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">Active Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-rule)]">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">Analytics Cookies (_ga, _ga_*)</td>
                      <td className="py-3 px-4 text-[var(--color-ink-secondary)]">Measures aggregate visitor traffic, page popularities, and referral channels to guide site improvements.</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">Active (Google Analytics)</td>
                    </tr>
                    <tr className="bg-[var(--color-surface)]/60">
                      <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">Advertising Cookies (Google AdSense &amp; Partners)</td>
                      <td className="py-3 px-4 text-[var(--color-ink-secondary)]">Used by Google and certified advertising partners to deliver, measure, and personalize ads based on prior visits across the web.</td>
                      <td className="py-3 px-4 text-amber-700 font-semibold">Preparation / Review Phase</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">Technical &amp; Preference Cookies</td>
                      <td className="py-3 px-4 text-[var(--color-ink-secondary)]">Stores functional state such as table sorting, tab selections, or UI preferences.</td>
                      <td className="py-3 px-4 text-[var(--color-ink-muted)]">As Needed</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4">
                You can manage or disable cookies at any time via your browser settings. Disabling cookies will
                not prevent you from reading schedules, points tables, or match reports on this platform.
              </p>
            </section>

            {/* 5. Google Analytics */}
            <section aria-labelledby="google-analytics">
              <h2 id="google-analytics" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                5. Google Analytics Measurement
              </h2>
              <p>
                {SITE_NAME} uses Google Analytics (Measurement ID: <code>G-VBLLG090FH</code>), a web analytics
                service provided by Google LLC (&quot;Google&quot;). Google Analytics uses cookies to analyze
                aggregated visitor interactions with our website.
              </p>
              <p className="mt-3">
                Information generated by Google Analytics is transmitted to and stored by Google on servers in
                the United States and other global regions. We do not transmit personally identifiable information
                to Google Analytics.
              </p>
              <p className="mt-3">
                Visitors can prevent Google Analytics from tracking their browsing sessions across the web by
                installing the official{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-brand)] hover:underline font-semibold"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
                .
              </p>
            </section>

            {/* 6. Google AdSense & Advertising Disclosure */}
            <section aria-labelledby="google-adsense">
              <h2 id="google-adsense" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                6. Google AdSense &amp; Third-Party Advertising
              </h2>
              <p>
                In accordance with Google publisher requirements (including{" "}
                <a
                  href="https://support.google.com/adsense/answer/1348695"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-brand)] hover:underline"
                >
                  Google AdSense Privacy Guidance
                </a>
                ), we disclose the following operational policies:
              </p>

              <div className="mt-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] space-y-3">
                <p>
                  <strong>Third-Party Vendor Cookies:</strong> Third-party vendors, including Google, use cookies
                  or similar technologies to serve advertisements based on a user&apos;s prior visits to this website
                  or other websites on the Internet.
                </p>
                <p>
                  <strong>Personalized Advertising:</strong> Google&apos;s use of advertising cookies enables it and its
                  certified advertising partners to serve targeted ads to users based on their visits to {SITE_NAME} and
                  other sites across the web.
                </p>
                <p>
                  <strong>Managing &amp; Opting Out of Personalized Advertising:</strong> Users may opt out of personalized
                  advertising by visiting{" "}
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-brand)] hover:underline font-semibold"
                  >
                    Google Ads Settings
                  </a>
                  . Alternatively, users can opt out of a third-party vendor&apos;s use of cookies for personalized advertising
                  by visiting the Network Advertising Initiative or{" "}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-brand)] hover:underline font-semibold"
                  >
                    www.aboutads.info
                  </a>
                  .
                </p>
              </div>

              <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
                <em>Status Note:</em> This website is currently prepared for AdSense compliance review. Third-party
                ad units and advertising cookies will only activate once approved and deployed.
              </p>
            </section>

            {/* 7. Handling of Contact Messages */}
            <section aria-labelledby="contact-handling">
              <h2 id="contact-handling" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                7. Handling of Contact Messages &amp; Submissions
              </h2>
              <p>
                When you contact us via email, your message, sender address, and any supplied citations are
                retained solely to review your enquiry, process corrections, or address copyright inquiries.
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1.5 text-[var(--color-ink-secondary)]">
                <li>We do not subscribe submitted email addresses to newsletters without explicit opt-in consent.</li>
                <li>We do not provide submitted emails to external marketing agencies or sponsors.</li>
                <li>Messages are retained only as long as necessary to address the enquiry or verify archival corrections.</li>
              </ul>
            </section>

            {/* 8. External Links */}
            <section aria-labelledby="external-links">
              <h2 id="external-links" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                8. Third-Party Services &amp; External Links
              </h2>
              <p>
                Our articles, fixture cards, and match notes frequently cite or link to external resources, such as
                official Cricket Association of Nepal (CAN) publications, accredited national news outlets, or official
                franchise announcements.
              </p>
              <p className="mt-3">
                {SITE_NAME} has no control over and assumes no responsibility for the content, privacy policies, or
                practices of any third-party websites or services. We encourage readers to review the privacy policies
                of external destinations they visit.
              </p>
            </section>

            {/* 9. Data Retention & Security */}
            <section aria-labelledby="data-security">
              <h2 id="data-security" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                9. Data Retention &amp; Security Practices
              </h2>
              <p>
                We employ standard, industry-recognized security measures to protect visitor data. All connections
                to {SITE_NAME} are encrypted in transit using Transport Layer Security (HTTPS/TLS).
              </p>
              <p className="mt-3">
                Aggregated analytics data in Google Analytics is retained according to standard retention settings
                (26 months) before automated purging. While no Internet transmission is 100% immune from vulnerability,
                we implement reasonable technical safeguards to protect information against unauthorized access, loss,
                or alteration.
              </p>
            </section>

            {/* 10. User Rights */}
            <section aria-labelledby="user-rights">
              <h2 id="user-rights" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                10. Your Privacy Rights
              </h2>
              <p>
                Depending on your jurisdiction, you may hold rights under applicable privacy and data protection
                frameworks, including rights of access, correction, deletion, or restriction of personal data processing.
              </p>
              <p className="mt-3">
                Because {SITE_NAME} does not maintain visitor accounts or database profiles on readers, most telemetry
                preferences can be exercised directly through your browser cookie settings or Google&apos;s privacy tools.
                For specific requests concerning communications you have sent us, please email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] hover:underline font-semibold">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </section>

            {/* 11. Children's Privacy */}
            <section aria-labelledby="childrens-privacy">
              <h2 id="childrens-privacy" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                11. Children&apos;s Privacy
              </h2>
              <p>
                {SITE_NAME} is a general-audience sports information platform designed for cricket fans. We do not
                knowingly solicit or collect personal information from individuals under the age of 13 (or under 16
                where applicable). If you believe a minor has supplied personal details to us, please contact us and
                we will take prompt measures to remove such data.
              </p>
            </section>

            {/* 12. Updates */}
            <section aria-labelledby="policy-updates">
              <h2 id="policy-updates" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                12. Policy Revisions
              </h2>
              <p>
                We may periodically update this Privacy Policy to reflect technical enhancements, regulatory guidance,
                or advertising network deployments. The &quot;Last updated&quot; date at the top of this document will
                indicate when changes took effect. Continued usage of {SITE_NAME} after updates signifies acceptance
                of the revised policy.
              </p>
            </section>

            {/* 13. Contact */}
            <section aria-labelledby="contact-section">
              <h2 id="contact-section" className="text-xl font-bold text-[var(--color-ink)] mb-3 pb-1 border-b border-[var(--color-rule)]">
                13. Contacting the Site Operator
              </h2>
              <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-5 text-sm space-y-2">
                <p className="font-bold text-[var(--color-ink)]">{SITE_NAME} Editorial &amp; Operations</p>
                <p className="text-[var(--color-ink-secondary)]">
                  Primary Email:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] hover:underline font-semibold">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p className="text-[var(--color-ink-secondary)]">
                  Phone / Editorial Desk:{" "}
                  <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-[var(--color-brand)] hover:underline font-semibold">
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                </p>
                <p className="text-[var(--color-ink-secondary)]">
                  Website:{" "}
                  <a href={SITE_URL} className="text-[var(--color-brand)] hover:underline font-semibold">
                    {SITE_URL}
                  </a>
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] pt-2 border-t border-[var(--color-rule)]">
                  We endeavor to review all privacy and correction correspondence within 3&ndash;5 business days.
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

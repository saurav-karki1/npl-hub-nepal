import { SectionHeader } from "@/components/ui/Layout";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "When does Nepal Premier League (NPL) Season 3 start?",
    answer:
      "NPL Season 3 is scheduled to run from 26 October 2026 to 21 November 2026 (९ कार्तिक – ५ मंसिर २०८३ BS). The opening match features Lumbini Lions vs Sudurpaschim Royals at the TU International Cricket Stadium, Kirtipur.",
  },
  {
    question: "Are the NPL Season 3 fixtures and match dates on this page officially confirmed?",
    answer:
      "The fixtures currently listed on this page represent the latest available schedule structure. Official NPL match dates, broadcast channels, and timings are subject to formal announcement by the Cricket Association of Nepal (CAN) and will be updated here live as soon as they are ratified.",
  },
  {
    question: "Where will the official NPL Season 3 schedule be published?",
    answer:
      "All officially confirmed NPL Season 3 fixtures, match timings, and broadcast schedules will be published directly on this Schedule page on NPL Hub Nepal immediately following release by CAN.",
  },
  {
    question: "Where are Nepal Premier League matches played?",
    answer:
      "The primary venue for NPL matches is the Tribhuvan University (TU) International Cricket Stadium in Kirtipur, Kathmandu. All 32 matches including the playoffs are slated to be hosted at TU Ground.",
  },
  {
    question: "What time do NPL matches take place in Nepal?",
    answer:
      "NPL Season 3 league matches are scheduled in two standard daily slots: morning fixtures starting at 12:30 PM NPT and afternoon fixtures at 4:30 PM NPT. Playoff match timings will be published once CAN confirms the playoff broadcast arrangements.",
  },
  {
    question: "Where can I find NPL match results and the updated points table?",
    answer:
      "Live match updates, final scorecards, and the real-time points table with net run rates (NRR) are tracked continuously on NPL Hub Nepal's dedicated Points Table and Match Results sections.",
  },
];

export function ScheduleFAQSection() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <SectionHeader title="Frequently Asked Questions" />

      <div className="space-y-3">
        {FAQS.map((faq, index) => (
          <details
            key={index}
            className="group border border-[var(--color-rule)] rounded-[var(--radius-lg)] bg-[var(--color-canvas)] p-4 sm:p-5 transition-colors open:bg-[var(--color-surface)]/50 focus-within:border-[var(--color-brand)]"
          >
            <summary className="flex items-center justify-between cursor-pointer font-bold text-sm sm:text-base text-[var(--color-ink)] select-none list-none group-hover:text-[var(--color-brand)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] rounded-xs">
              <span>{faq.question}</span>
              <span
                className="ml-4 shrink-0 text-base font-bold text-[var(--color-brand)] group-open:rotate-180 transition-transform duration-200"
                aria-hidden="true"
              >
                ▾
              </span>
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed border-t border-[var(--color-rule)] pt-3">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

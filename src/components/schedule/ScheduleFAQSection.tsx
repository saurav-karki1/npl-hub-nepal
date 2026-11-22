import { SectionHeader } from "@/components/ui/Layout";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Who won Nepal Premier League (NPL) Season 3 (2026)?",
    answer:
      "Sudurpaschim Royals won NPL Season 3 (2026), defeating Lumbini Lions by 10 wickets in the Grand Final at TU International Cricket Stadium on 21 November 2026. George Munsey scored a historic 125 not out off 54 balls to seal the title.",
  },
  {
    question: "When did Nepal Premier League (NPL) Season 3 take place?",
    answer:
      "NPL Season 3 was played from 26 October 2026 to 21 November 2026 (९ कार्तिक – ५ मंसिर २०८३ BS). All 32 matches (28 league fixtures and 4 playoffs) were completed at the Tribhuvan University International Cricket Ground, Kirtipur.",
  },
  {
    question: "What were the results of the NPL Season 3 playoffs?",
    answer:
      "In Qualifier 1, Lumbini Lions beat Sudurpaschim Royals by 6 wickets to reach the Final. In the Eliminator, Chitwan Rhinos beat Kathmandu Gorkhas by 61 runs (Kamil Mishara 120*). In Qualifier 2, Sudurpaschim Royals edged Chitwan Rhinos by 3 wickets. In the Final, Sudurpaschim Royals chased down 156 without losing a wicket (158/0 in 13.3 ov) to become Champions.",
  },
  {
    question: "Where were Nepal Premier League Season 3 matches played?",
    answer:
      "All 32 matches of NPL Season 3 were hosted at the Tribhuvan University (TU) International Cricket Stadium in Kirtipur, Kathmandu, Nepal.",
  },
  {
    question: "Who won the Player of the Tournament and Player of the Final awards?",
    answer:
      "George Munsey of Sudurpaschim Royals was named Player of the Match in the Final for his record-breaking 125* off 54 balls. Dipendra Singh Airee, captain of Sudurpaschim Royals, was named Player of the Tournament for his all-round excellence throughout Season 3.",
  },
  {
    question: "Where can I find complete NPL Season 3 statistics and scorecards?",
    answer:
      "Complete match scorecards, batting and bowling leaderboards, team standings, and multi-season records are available on NPL Hub Nepal's dedicated Statistics (/stats) and Points Table (/points-table) hubs.",
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

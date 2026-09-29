"use client";

import type { NewsCategory } from "@/lib/data/news-data";

interface CategoryFilterProps {
  categories: NewsCategory[];
  selected: NewsCategory | "All";
  onChange: (cat: NewsCategory | "All") => void;
}

const ALL_LABEL = "All";

export function CategoryFilter({
  categories,
  selected,
  onChange,
}: CategoryFilterProps) {
  const options: (NewsCategory | "All")[] = [ALL_LABEL, ...categories];

  return (
    <nav aria-label="Filter news by category">
      <ul className="flex flex-wrap gap-2" role="list">
        {options.map((cat) => {
          const isActive = selected === cat;
          return (
            <li key={cat}>
              <button
                type="button"
                onClick={() => onChange(cat)}
                aria-pressed={isActive}
                className={[
                  "px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)]",
                  "border transition-colors duration-150",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]",
                  isActive
                    ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)]"
                    : "bg-[var(--color-canvas)] text-[var(--color-ink-secondary)] border-[var(--color-rule)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]",
                ].join(" ")}
              >
                {cat}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

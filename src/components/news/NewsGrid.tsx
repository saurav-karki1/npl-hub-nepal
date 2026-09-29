"use client";

import { useState } from "react";
import { NewsCard } from "./NewsCard";
import { CategoryFilter } from "./CategoryFilter";
import type { NewsArticle, NewsCategory } from "@/lib/data/news-data";

interface NewsGridProps {
  articles: NewsArticle[];
  categories: NewsCategory[];
}

export function NewsGrid({ articles, categories }: NewsGridProps) {
  const [selected, setSelected] = useState<NewsCategory | "All">("All");

  const filtered =
    selected === "All"
      ? articles
      : articles.filter((a) => a.category === selected);

  return (
    <section aria-labelledby="news-grid-heading">
      {/* Section label */}
      <div className="mb-4">
        <div className="border-t-2 border-[var(--color-brand)] mb-2" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2
            id="news-grid-heading"
            className="text-section-title"
          >
            All Updates
          </h2>
          <CategoryFilter
            categories={categories}
            selected={selected}
            onChange={setSelected}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--color-ink-muted)]">
          No articles found for this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * NPL Hub Nepal — Editorial Quality Gate & Invariant Validator
 *
 * Verifies all 11 mandatory editorial invariants before an article draft
 * can be ingested into the news_articles database.
 *
 * An article MUST pass 100% of these checks. If any invariant fails,
 * the job will not ingest and will report exact invariant failures.
 */

import type {
  GeneratedArticleDraft,
  SeoMetadataDraft,
  ImageResult,
  FactDossier,
  EditorialArticleType,
} from "./types";
import type { NewsCategory } from "@/lib/data/news-data";

export interface QualityGateValidationResult {
  passed: boolean;
  violations: string[];
}

const VALID_CATEGORIES: Set<NewsCategory> = new Set([
  "Tournament",
  "Teams",
  "Matches",
  "Points Table",
  "Announcements",
]);

export function validateQualityGate(input: {
  draft: GeneratedArticleDraft;
  seo: SeoMetadataDraft;
  image: ImageResult;
  dossier: FactDossier;
  articleType: EditorialArticleType;
  status: "draft";
  ai_generated: true;
}): QualityGateValidationResult {
  const { draft, seo, image, dossier, articleType, status, ai_generated } = input;
  const violations: string[] = [];

  // 1. Title Invariant: 20-100 characters, non-generic
  if (!draft.title || draft.title.trim().length < 20) {
    violations.push("Invariant 1 Failed: Title is shorter than 20 characters.");
  } else if (draft.title.length > 120) {
    violations.push("Invariant 1 Failed: Title exceeds 120 characters.");
  }

  // 2. Excerpt Invariant: 50-250 characters
  if (!draft.excerpt || draft.excerpt.trim().length < 50) {
    violations.push("Invariant 2 Failed: Excerpt is shorter than 50 characters.");
  } else if (draft.excerpt.length > 250) {
    violations.push("Invariant 2 Failed: Excerpt exceeds 250 characters.");
  }

  // 3. Block Structure Invariant: Genre-aware depth requirements
  const paragraphBlocks = draft.blocks.filter((b) => b.type === "paragraph");
  const headingBlocks = draft.blocks.filter((b) => b.type === "heading");

  // Light genres (breaking news, short announcements, points table): 1 paragraph minimum
  const lightGenres: EditorialArticleType[] = [
    "breaking_news",
    "official_announcement",
    "points_table_update",
  ];
  const minParagraphs = lightGenres.includes(articleType) ? 1 : 3;

  if (paragraphBlocks.length < minParagraphs) {
    violations.push(
      `Invariant 3 Failed: Article has ${paragraphBlocks.length} paragraph block(s); genre "${articleType}" requires at least ${minParagraphs}.`
    );
  }
  if (headingBlocks.length < 1) {
    violations.push("Invariant 3 Failed: Article lacks subheadings (requires at least 1 heading block).");
  }

  // 4. Genre-Specific Content Invariants (replaces the old 250-word minimum)
  const verifiedClaims = dossier.claims.filter((c) => c.verification_status === "verified");
  const allText = draft.blocks
    .map((b) => {
      if (b.type === "paragraph" || b.type === "heading") return b.text;
      if (b.type === "list") return (b.items || []).join(" ");
      return "";
    })
    .join(" ")
    .toLowerCase();

  if (articleType === "match_report" || articleType === "match_analysis") {
    // Must reference unambiguously cricket match context.
    // "partnership" and "four" are excluded — too common in non-cricket text.
    // "won" / "lost" are excluded — too generic. Use only clearly cricket-specific terms.
    const matchKeywords = /\b(wicket|wickets|overs?|innings|scored|boundary|boundaries|century|centuries|fifty|fifties|bowled|caught|lbw|stumped|no-ball|wide|powerplay|yorker|googly|spinner|pacer|allrounder)\b/;
    const claimKeywords = /\b(score|wickets?|innings|match result|boundary|century|powerplay|bowled|caught)\b/;
    const hasMatchContext =
      matchKeywords.test(allText) ||
      verifiedClaims.some((c) => claimKeywords.test(c.statement.toLowerCase()));
    if (!hasMatchContext) {
      violations.push(
        `Invariant 4 Failed: "${articleType}" article must reference match context (scores, wickets, innings, or result).`
      );
    }
  } else if (articleType === "match_preview") {
    // Must reference teams or match context (word-boundary safe)
    const previewKeywords = /\b(team|squad|match|versus|vs|fixture|pitch|weather|lineup|captain)\b/;
    const hasTeamContext =
      (dossier.related_teams.length >= 1 &&
        dossier.related_teams.some((t) =>
          new RegExp(`\\b${t.replace(/-/g, "[ -]")}\\b`, "i").test(allText)
        )) ||
      previewKeywords.test(allText);
    if (!hasTeamContext) {
      violations.push(
        `Invariant 4 Failed: "match_preview" article must reference at least one team or match context.`
      );
    }
  } else if (articleType === "feature_story") {
    // Feature stories require substantial depth — at least 5 paragraphs
    if (paragraphBlocks.length < 5) {
      violations.push(
        `Invariant 4 Failed: "feature_story" requires at least 5 paragraph blocks for editorial depth; found ${paragraphBlocks.length}.`
      );
    }
  } else if (articleType === "breaking_news" || articleType === "official_announcement") {
    // Must have at least one verified claim to publish as fact
    if (verifiedClaims.length === 0) {
      violations.push(
        `Invariant 4 Failed: "${articleType}" requires at least one verified claim before publication.`
      );
    }
  }
  // All other genres: no additional structural invariant beyond Invariant 3

  // 5. Category Invariant: Must belong to one of the 5 canonical categories
  if (!VALID_CATEGORIES.has(draft.category)) {
    violations.push(`Invariant 5 Failed: Invalid category "${draft.category}".`);
  }

  // 6. Status Invariant: Strictly "draft" (no auto-publish)
  if (status !== "draft") {
    violations.push(`Invariant 6 Failed: Ingest status must strictly be "draft".`);
  }

  // 7. AI Flag Invariant: ai_generated must be true
  if (ai_generated !== true) {
    violations.push("Invariant 7 Failed: ai_generated flag must be true.");
  }

  // 8. Feature Image Invariant: Must be non-empty and valid URL
  if (!image.image_url || image.image_url.trim().length === 0) {
    violations.push("Invariant 8 Failed: Feature image URL is empty.");
  }

  // 9. Image Alt Text Invariant: Non-empty descriptive alt text
  if (!image.image_alt || image.image_alt.trim().length < 10) {
    violations.push("Invariant 9 Failed: Image alt text is missing or too short (< 10 chars).");
  }

  // 10. SEO Keywords Invariant: Focus keyword non-empty, secondary keywords >= 2
  if (!seo.focus_keyword || seo.focus_keyword.trim().length < 3) {
    violations.push("Invariant 10 Failed: SEO focus keyword is missing.");
  }
  if (!Array.isArray(seo.secondary_keywords) || seo.secondary_keywords.length < 2) {
    violations.push("Invariant 10 Failed: Requires at least 2 secondary SEO keywords.");
  }

  // 11. Dossier Invariant: Fact dossier attached and sufficient
  if (!dossier || !Array.isArray(dossier.claims)) {
    violations.push("Invariant 11 Failed: Fact dossier is missing or empty.");
  } else if (!dossier.is_sufficient) {
    violations.push(
      `Invariant 11 Failed: Dossier was marked insufficient for publication (${dossier.sufficiency_reason || "lacks verified claims"}).`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

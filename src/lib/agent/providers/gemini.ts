/**
 * NPL Hub Nepal — Google Gemini Journalism & SEO Provider
 *
 * Provides long-form cricket journalism, narrative structuring, and SEO optimization.
 * Models:
 * - `gemini-3.5-flash-lite` (Primary high-speed / high-rate-limit)
 * - `gemini-3.8-flash` (Creative / reasoning fallback)
 *
 * Utilizes multi-key failover and rotation (GEMINI_API_KEY, GEMINI_API_KEY_2..N).
 * Strictly adheres to the $0.00 zero-cost policy and fact dossier grounding.
 */

import {
  executeWithKeyFailover,
  type GeminiKeySlot,
} from "../gemini-keys";
import {
  QuotaExceededError,
  type EditorialArticleType,
  type FactDossier,
  type GeneratedArticleDraft,
  type SeoMetadataDraft,
} from "../editorial/types";
import type { ArticleBlock } from "@/lib/types/article-blocks";
import type { NewsCategory } from "@/lib/data/news-data";

export const GEMINI_EDITORIAL_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
] as const;

const ARTICLE_TYPE_INSTRUCTIONS: Record<EditorialArticleType, string> = {
  breaking_news:
    "Write an urgent, fact-first breaking news report. Lead immediately with the confirmed development. Provide verified context, source attribution, and implications. Every claim must be sourced. No speculation.",
  tournament_news:
    "Write an informative tournament news story covering schedule releases, venue developments, standings implications, qualification scenarios, or competition format updates for the Nepal Premier League.",
  match_preview:
    "Write a strategic pre-match preview covering team form, head-to-head dynamics, pitch and weather outlook at TU Stadium, key player battles, and tactical matchups for the upcoming fixture.",
  match_report:
    "Write an authoritative post-match report detailing the toss, match progression, decisive partnerships, individual bowling/batting spells, pivotal turning points, and the final result.",
  match_analysis:
    "Write a deep analytical breakdown of match tactics, data trends, turning points, bowling strategies, powerplay execution, and individual performance metrics from a completed fixture.",
  team_news:
    "Write a focused team news article covering franchise updates, training developments, selection decisions, managerial changes, or pre-tournament preparation news.",
  player_news:
    "Write a player-focused news article covering individual developments: form, fitness updates, contract news, milestone achievements, or impact performances relevant to NPL.",
  squad_analysis:
    "Write a detailed squad analysis covering team composition, marquee player appointments, overseas signings, squad depth, tactical roles, and CAN or franchise verification details.",
  points_table_update:
    "Write a concise, data-driven points table update article summarizing the current standings, net run rates, recent results, and playoff qualification scenarios for each team.",
  official_announcement:
    "Write an accurate, professional report of an official CAN or NPL franchise announcement. Present the verified announcement clearly, with institutional context and implications for the competition.",
  feature_story:
    "Write an in-depth, editorial-quality feature story providing original insight, storytelling depth, and broader context on a significant NPL theme, person, or moment. Must be multi-section with rich narrative.",
};

const CATEGORY_MAP: Record<EditorialArticleType, NewsCategory> = {
  breaking_news: "Tournament",
  tournament_news: "Tournament",
  match_preview: "Matches",
  match_report: "Matches",
  match_analysis: "Matches",
  team_news: "Teams",
  player_news: "Teams",
  squad_analysis: "Teams",
  points_table_update: "Points Table",
  official_announcement: "Announcements",
  feature_story: "Tournament",
};

/**
 * Execute raw Gemini generateContent with fallback through configured models.
 */
async function callGeminiModels<T>(
  prompt: string,
  systemInstruction?: string
): Promise<{ data: T; tokensUsed: number; latencyMs: number; modelUsed: string }> {
  const startTime = Date.now();

  for (const modelId of GEMINI_EDITORIAL_MODELS) {
    const result = await executeWithKeyFailover<T>(
      async (slot: GeminiKeySlot) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${slot.key}`;

        const bodyPayload: Record<string, unknown> = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        };

        if (systemInstruction) {
          bodyPayload.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });

        const status = res.status;
        const resText = await res.text();

        if (status < 200 || status >= 300) {
          return { status, errorText: resText };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = JSON.parse(resText);
        const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
        const totalTokens = json.usageMetadata?.totalTokenCount ?? 0;

        if (!rawContent) {
          return { status: 500, errorText: "Gemini candidate part was empty." };
        }

        let cleaned = rawContent.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        }

        const parsed = JSON.parse(cleaned);
        return { status: 200, data: parsed, tokensUsed: totalTokens };
      },
      { backoffMs: 400 }
    );

    if (result.success && result.data) {
      return {
        data: result.data,
        tokensUsed: result.tokensUsed ?? 0,
        latencyMs: Date.now() - startTime,
        modelUsed: modelId,
      };
    }

    if (result.isQuotaExhausted) {
      throw new QuotaExceededError("gemini", result.error || "Gemini quota exhausted across all keys.");
    }

    // If 404 Model Not Found, continue to the next model in the chain
    if (result.isModelNotFound) {
      continue;
    }
  }

  throw new Error("All Gemini models failed to generate content.");
}

/**
 * Generates an original, high-density cricket news article based strictly on the Fact Dossier.
 */
export async function generateArticleWithGemini(
  topic: string,
  articleType: EditorialArticleType,
  dossier: FactDossier
): Promise<{ draft: GeneratedArticleDraft; tokensUsed: number; latencyMs: number; modelUsed: string }> {
  const verifiedClaims = dossier.claims.filter((c) => c.verification_status === "verified");
  const claimsSummary = verifiedClaims.map((c, i) => `${i + 1}. ${c.statement}`).join("\n");
  const quotesSummary = dossier.key_quotes
    .map((q) => `"${q.quote}" — ${q.speaker}`)
    .join("\n");
  const conflictsSummary = dossier.conflicts.length
    ? `IMPORTANT CONFLICTS TO DISCLOSE OR ADDRESS:\n${dossier.conflicts.join("\n")}`
    : "No major factual conflicts detected.";

  const systemPrompt = `You are a cricket news writer for NPL Hub Nepal.
Write a clear, accurate, and engaging sports news article that anyone can read and understand — including fans who are new to cricket.

CRITICAL RULES:
1. STRICT FACTS ONLY: Use ONLY the verified facts and quotes in the Fact Dossier. Never invent scores, player names, dates, or match results.
2. ARTICLE TYPE: ${articleType.toUpperCase()}.
${ARTICLE_TYPE_INSTRUCTIONS[articleType]}
3. LANGUAGE & READABILITY:
   - Write in simple, clear English. Avoid jargon, complex vocabulary, and cricket-expert-only terms.
   - When you must use a cricket term (e.g. "death overs", "powerplay"), explain it briefly in plain words.
   - Short sentences are better than long ones. Aim for a reading level that a 14-year-old can follow.
   - Do NOT use: "spearheaded", "immaculate", "probing", "clinical execution", "stifle", "labored", "testament to", "showcase", "pivotal", "exemplary", or similar formal/flowery words.
   - Use: "led", "clean", "testing", "great", "tight", "showed", "key", "important" — everyday words.
4. TONE: Exciting but simple. Like a sports report read on the radio, not an academic paper.
5. STRUCTURE: Provide an array of semantic blocks:
   - "paragraph": Plain, clear prose.
   - "heading": level 2 or 3 for subheadings.
   - "list": style "unordered" or "ordered" for key stats or bullet points.
   - "quote": text and author.
   - "table": (optional) for scorecards if data is available.
6. TITLE (IMPORTANT for SEO):
   - Write the title so it matches what fans would search for on Google.
   - Put the most important information first: team names, result, competition name.
   - Good example: "Janakpur Bolts Beat Pokhara Avengers by 9 Runs in NPL 2026"
   - Bad example: "Bolts Defend Total to Edge Avengers in Gripping Contest"
   - Keep the title between 50-80 characters.
   - Include "NPL" or "Nepal Premier League" in the title.
7. LENGTH: Enough detail to tell the full story. At least 3 good paragraphs. Do not pad with empty sentences.
8. RETURN JSON ONLY with structure:
{
  "title": string (SEO-friendly, clear, 50-80 characters),
  "excerpt": string (1-2 sentence summary, 80-155 characters, plain English),
  "blocks": [
    { "type": "paragraph", "text": string },
    { "type": "heading", "level": 2, "text": string },
    ...
  ],
  "suggested_tags": string[] (3-6 tags, e.g. ["NPL 2026", "Janakpur Bolts", "Match Report"]),
  "team_ids": string[] (canonical team slugs e.g. ["janakpur-bolts", "pokhara-avengers"])
}`;

  const userPrompt = `TOPIC: ${topic}
PRIMARY ENTITY: ${dossier.primary_entity}
RELATED TEAMS: ${dossier.related_teams.join(", ") || "None specified"}
RELATED PLAYERS: ${dossier.related_players.join(", ") || "None specified"}

VERIFIED CLAIMS:
${claimsSummary || "No claims listed."}

VERIFIED QUOTES:
${quotesSummary || "None available."}

${conflictsSummary}

Generate the complete article draft JSON now.`;

  interface GeminiDraftResponse {
    title: string;
    excerpt: string;
    blocks: ArticleBlock[];
    suggested_tags: string[];
    team_ids: string[];
  }

  const { data, tokensUsed, latencyMs, modelUsed } =
    await callGeminiModels<GeminiDraftResponse>(userPrompt, systemPrompt);

  // Compute word count and read time
  const fullText = (data.blocks || [])
    .map((b) => {
      if (b.type === "paragraph" || b.type === "heading") return b.text;
      if (b.type === "list") return (b.items || []).join(" ");
      return "";
    })
    .join(" ");

  const words = fullText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const draft: GeneratedArticleDraft = {
    title: data.title || topic,
    excerpt: data.excerpt || "",
    category: CATEGORY_MAP[articleType] || "Tournament",
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
    word_count: wordCount,
    read_time: `${readMinutes} min read`,
    suggested_tags: Array.isArray(data.suggested_tags) ? data.suggested_tags : ["NPL 2026"],
    team_ids: Array.isArray(data.team_ids) ? data.team_ids : dossier.related_teams,
  };

  return { draft, tokensUsed, latencyMs, modelUsed };
}

/**
 * Generates SEO metadata (meta title, description, focus keyword, secondary keywords) for the draft.
 */
export async function generateSeoMetadataWithGemini(
  draft: GeneratedArticleDraft,
  targetKeyword?: string | null
): Promise<{ seo: SeoMetadataDraft; tokensUsed: number; latencyMs: number; modelUsed: string }> {
  const systemPrompt = `You are a search engine optimization expert specializing in sports journalism.
Analyze the article title and excerpt and generate optimal SEO metadata.

RULES:
1. focus_keyword: Primary search query (2-4 words, e.g. "NPL Season 3 schedule" or "Janakpur Bolts squad"). If a target keyword is provided, prioritize it.
2. secondary_keywords: Array of 3-5 relevant secondary search phrases.
3. meta_title: 50-60 character SEO page title including focus keyword and " | NPL Hub Nepal".
4. meta_description: 140-155 character compelling meta description with a call to action.

Return STRICT JSON:
{
  "focus_keyword": string,
  "secondary_keywords": string[],
  "meta_title": string,
  "meta_description": string
}`;

  const userPrompt = `ARTICLE TITLE: ${draft.title}
EXCERPT: ${draft.excerpt}
TARGET KEYWORD HINT: ${targetKeyword || "None provided"}

Generate the SEO metadata JSON.`;

  const { data, tokensUsed, latencyMs, modelUsed } =
    await callGeminiModels<SeoMetadataDraft>(userPrompt, systemPrompt);

  return {
    seo: {
      focus_keyword: data.focus_keyword || targetKeyword || "Nepal Premier League 2026",
      secondary_keywords: Array.isArray(data.secondary_keywords)
        ? data.secondary_keywords
        : ["NPL cricket", "Nepal cricket news"],
      meta_title: data.meta_title || `${draft.title.slice(0, 50)} | NPL Hub`,
      meta_description: data.meta_description || draft.excerpt.slice(0, 150),
      internal_links_injected: 0,
    },
    tokensUsed,
    latencyMs,
    modelUsed,
  };
}

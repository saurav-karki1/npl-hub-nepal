/**
 * NPL Hub Nepal — AI News Agent: Gemini News Generator
 *
 * Calls Google Gemini to generate a complete, structured draft article
 * grounded strictly in a fetched source item (headline + snippet).
 *
 * CRITICAL ZERO-HALLUCINATION POLICY (same as gemini-structurer.ts):
 * - Never invent player names, scores, dates, team names, or statistics.
 * - Never add information not present in the source headline or snippet.
 * - If the source is vague, the article must reflect that vagueness.
 * - Output is always status='draft' — human review is mandatory.
 *
 * MULTI-KEY FAILOVER:
 * - Uses executeWithKeyFailover() across GEMINI_API_KEY, GEMINI_API_KEY_2, etc.
 * - Fails over automatically on 429 rate limits or transient 5xx errors.
 * - Bounded retries: stops gracefully if all keys are exhausted.
 *
 * Server-only: API keys are never exposed to the client.
 */

import type { ArticleBlock } from "@/lib/types/article-blocks";
import type { FetchedItem } from "./types";
import { executeWithKeyFailover, GeminiKeySlot } from "./gemini-keys";

const GENERATE_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an editorial journalist for NPL Hub Nepal, an independent news platform covering the Nepal Premier League (NPL) cricket tournament.

YOUR TASK:
Write a short, factual news article based ONLY on the headline and snippet provided. Do NOT invent any information.

STRICT ACCURACY RULES:
1. Use ONLY facts present in the provided headline and snippet. Do NOT add external knowledge, statistics, player records, or match scores.
2. If the snippet is vague, the article must reflect that vagueness — do NOT fill gaps with assumptions.
3. Do NOT invent quotes, attributions, player reactions, or official statements.
4. Do NOT fabricate specific dates, venues, statistics, or scores unless they appear verbatim in the source.
5. You MAY use general cricket/NPL context (e.g. "The NPL is Nepal's premier T20 franchise tournament") only if it adds clarity without inventing facts.
6. Write in a calm, editorial, third-person sports-media style.
7. The article must be 3–5 paragraphs. No shorter, no longer.
8. The first paragraph is a direct news lead summarising the headline.
9. Add a final paragraph noting that NPL Hub Nepal will provide further coverage as more information becomes available.

OUTPUT FORMAT — valid JSON only, no markdown code fences:
{
  "title": "Article title (can refine the headline for clarity)",
  "excerpt": "One sentence summary for the article card (max 160 chars)",
  "category": "Tournament" | "Teams" | "Matches" | "Points Table" | "Announcements",
  "blocks": [
    { "type": "paragraph", "text": "..." },
    { "type": "heading", "level": 2, "text": "..." },
    { "type": "paragraph", "text": "..." }
  ]
}

CATEGORY SELECTION GUIDE:
- "Matches": match results, scorecards, performances in a specific game
- "Teams": squad news, player signings, team announcements
- "Tournament": overall tournament news, schedule, format, CAN announcements
- "Announcements": official statements, broadcast, ticketing, venue
- "Points Table": standings, qualification scenarios`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeminiGenerationResult {
  title: string;
  excerpt: string;
  category: "Tournament" | "Teams" | "Matches" | "Points Table" | "Announcements";
  blocks: ArticleBlock[];
  tokensUsed: number;
  keySlotUsed?: string;
}

// ---------------------------------------------------------------------------
// Model fallback chain
// ---------------------------------------------------------------------------

const MODELS = [
  { id: "gemini-2.5-flash", api: "v1beta" },
  { id: "gemini-2.0-flash", api: "v1beta" },
  { id: "gemini-1.5-flash", api: "v1beta" },
] as const;

const VALID_CATEGORIES = [
  "Tournament",
  "Teams",
  "Matches",
  "Points Table",
  "Announcements",
] as const;

// ---------------------------------------------------------------------------
// Main generation function with multi-key failover
// ---------------------------------------------------------------------------

export async function generateNewsArticleFromItem(
  item: FetchedItem
): Promise<{ success: boolean; result?: GeminiGenerationResult; error?: string }> {
  const userPrompt = `SOURCE HEADLINE: ${item.title}
SOURCE SNIPPET: ${item.snippet}
SOURCE: ${item.sourceName} (${item.sourceUrl})
PUBLISHED: ${item.publishedAt || "Unknown date"}

Generate a factual NPL Hub Nepal news article based only on the above source.`;

  let lastError = "Gemini API unreachable.";

  for (const { id: model, api } of MODELS) {
    // Execute request with multi-key rotation and failover
    const execution = await executeWithKeyFailover<GeminiGenerationResult>(
      async (slot: GeminiKeySlot) => {
        const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${slot.key}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

        try {
          const res = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
                maxOutputTokens: 2048,
              },
            }),
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const errText = await res.text();
            return {
              status: res.status,
              errorText: errText.slice(0, 200),
            };
          }

          const json = await res.json();
          const rawText: string =
            json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

          const tokensUsed: number =
            json.usageMetadata?.totalTokenCount ?? 0;

          if (!rawText) {
            return {
              status: 500,
              errorText: "Gemini returned empty response text.",
            };
          }

          // Strip accidental markdown fences
          const cleanJson = rawText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

          let parsed: {
            title?: string;
            excerpt?: string;
            category?: string;
            blocks?: unknown[];
          };

          try {
            parsed = JSON.parse(cleanJson);
          } catch {
            return {
              status: 500,
              errorText: "Failed to parse Gemini output as JSON.",
            };
          }

          if (!parsed.title || !parsed.excerpt || !Array.isArray(parsed.blocks)) {
            return {
              status: 500,
              errorText: "Gemini response missing required title, excerpt, or blocks.",
            };
          }

          if (
            !parsed.category ||
            !VALID_CATEGORIES.includes(
              parsed.category as (typeof VALID_CATEGORIES)[number]
            )
          ) {
            parsed.category = "Tournament";
          }

          const validBlocks: ArticleBlock[] = [];
          for (const block of parsed.blocks) {
            const b = block as Record<string, unknown>;
            if (b.type === "paragraph" && typeof b.text === "string" && b.text.trim()) {
              validBlocks.push({ type: "paragraph", text: b.text.trim() });
            } else if (
              b.type === "heading" &&
              (b.level === 2 || b.level === 3) &&
              typeof b.text === "string" &&
              b.text.trim()
            ) {
              validBlocks.push({
                type: "heading",
                level: b.level as 2 | 3,
                text: b.text.trim(),
              });
            } else if (
              b.type === "list" &&
              (b.style === "unordered" || b.style === "ordered") &&
              Array.isArray(b.items) &&
              b.items.length > 0
            ) {
              validBlocks.push({
                type: "list",
                style: b.style as "unordered" | "ordered",
                items: (b.items as unknown[])
                  .filter((i) => typeof i === "string" && (i as string).trim())
                  .map((i) => (i as string).trim()),
              });
            }
          }

          if (validBlocks.length === 0) {
            return {
              status: 500,
              errorText: "No valid blocks after structure validation.",
            };
          }

          return {
            status: 200,
            tokensUsed,
            data: {
              title: parsed.title.trim(),
              excerpt: parsed.excerpt.slice(0, 160).trim(),
              category: parsed.category as GeminiGenerationResult["category"],
              blocks: validBlocks,
              tokensUsed,
              keySlotUsed: slot.slotName,
            },
          };
        } catch (fetchErr: unknown) {
          clearTimeout(timeoutId);
          const msg = fetchErr instanceof Error ? fetchErr.message : "Fetch error";
          return {
            status: 504,
            errorText: msg,
          };
        }
      }
    );

    if (execution.success && execution.data) {
      return {
        success: true,
        result: execution.data,
      };
    }

    lastError = execution.error ?? lastError;

    // If quota is exhausted across all keys, do not hammer subsequent models
    if (execution.isQuotaExhausted) {
      break;
    }
  }

  return { success: false, error: lastError };
}

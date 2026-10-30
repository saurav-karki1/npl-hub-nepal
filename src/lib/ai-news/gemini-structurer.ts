/**
 * NPL Hub Nepal — Gemini Article Content Structuring Engine
 *
 * Analyzes unstructured article text pasted by an admin and transforms it
 * into strict semantic JSON blocks (paragraphs, H2/H3 headings, lists, FAQs, quotes, links).
 *
 * CRITICAL ZERO-HALLUCINATION POLICY:
 * - NEVER invent facts, players, scores, dates, statistics, quotes, or claims.
 * - NEVER alter names, numbers, or specific statements.
 * - If an unclear sentence exists, preserve the original phrasing verbatim.
 * - Only extract FAQs, headings, and lists that are actually present in the source text.
 * - Server-side only: GEMINI_API_KEY is never exposed to the client.
 */

import { ArticleBlock, sanitizeBlock } from "@/lib/types/article-blocks";

const SYSTEM_PROMPT = `You are a professional editorial structure analyzer for news articles on NPL Hub Nepal (Nepal Premier League).

YOUR ONLY TASK:
Take the provided raw article text and segment it into clean, semantic structural blocks (paragraphs, headings, lists, quotes, FAQs, links, and structured rich tables) returned strictly as JSON.

STRICT ZERO-FABRICATION RULES (MANDATORY):
1. DO NOT invent ANY facts, dates, players, teams, scores, quotes, claims, sources, URLs, or statistics.
2. DO NOT rewrite sentences simply for style. Preserve the author's original words, numbers, and facts verbatim.
3. DO NOT fabricate FAQ questions or answers. Only format as FAQ if the source text contains explicit question-and-answer pairs.
4. DO NOT create an H1 tag. The article title is handled separately outside the content.
5. Major section titles in the article should be H2 (level: 2).
6. Subsections nested under a major section should be H3 (level: 3).
7. Do NOT convert ordinary sentences into headings just because they are short.
8. Numbered lists (1., 2., 3., etc.) become { "type": "list", "style": "ordered", "items": ["..."] }.
9. Bulleted lists (-, *, •) become { "type": "list", "style": "unordered", "items": ["..."] }.
10. Quotes, author statements, or official notes become { "type": "quote", "text": "...", "author": "..." }.
11. Question and Answer pairs become { "type": "faq", "question": "...", "answer": "..." }.
12. Standard prose paragraphs become { "type": "paragraph", "text": "..." }.
13. If explicit hyperlinks or URLs exist in the text, preserve them or extract { "type": "link", "text": "...", "url": "..." }.
14. TABULAR DATA IDENTIFICATION & STRUCTURED TABLE GENERATION:
    - Identify information that genuinely benefits from tabular presentation:
      * NPL points tables / standings
      * Player statistics, top run scorers, top wicket takers
      * Team comparisons or head-to-head records
      * Match schedules, fixtures, or match results score summaries
      * Player auction or squad lists
      * Tournament awards and records
    - Do NOT force a table into every article. Only generate a table when the raw text actually contains structured tabular information.
    - NEVER invent missing statistics, rankings, or player figures. If a data point is missing from the source text, use "—".
    - Choose an appropriate style:
      * "highlight": For standings and player leaderboards (emphasizes rankings and key stats)
      * "comparison": For team vs team or head-to-head comparisons
      * "compact": For match schedules or dense data
      * "standard": For general tabular data
    - Provide appropriate column alignments: "left", "center", or "right" (e.g. text/names left, numbers/ranks center or right).
    - If there is a clear leader or champion (e.g. Rank 1), set "highlightRows": [0].

OUTPUT FORMAT:
You MUST output ONLY a valid JSON object matching this exact schema:
{
  "blocks": [
    { "type": "paragraph", "text": "..." },
    { "type": "heading", "level": 2, "text": "..." },
    { "type": "heading", "level": 3, "text": "..." },
    { "type": "list", "style": "unordered", "items": ["..."] },
    { "type": "list", "style": "ordered", "items": ["..."] },
    { "type": "quote", "text": "...", "author": "..." },
    { "type": "faq", "question": "...", "answer": "..." },
    { "type": "link", "text": "...", "url": "..." },
    {
      "type": "table",
      "caption": "Optional title/caption",
      "style": "standard" | "highlight" | "comparison" | "compact",
      "headers": ["Col 1", "Col 2", "Col 3"],
      "alignments": ["left", "center", "right"],
      "highlightRows": [0],
      "rows": [
        ["Val 1", "Val 2", "Val 3"]
      ]
    }
  ]
}

No markdown code fences (\`\`\`json), no greetings, no explanations. Pure JSON only.`;

export async function structureArticleWithGemini(
  rawText: string
): Promise<{ success: boolean; blocks: ArticleBlock[]; error?: string }> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { success: false, blocks: [], error: "Article text cannot be empty." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      blocks: [],
      error:
        "GEMINI_API_KEY is not configured on the server. Please add your Gemini API key to your environment variables.",
    };
  }

  // Verified current Gemini model IDs (Oct 2026, confirmed from Google AI for Developers).
  const models = [
    { id: "gemini-2.5-flash", api: "v1beta" },      // Balanced price-performance
    { id: "gemini-3.5-flash-lite", api: "v1beta" },  // High-volume, low-latency
    { id: "gemini-3.8-flash", api: "v1beta" },       // Flagship workhorse fallback
  ];

  let lastError = "Could not connect to Gemini API.";

  for (const { id: model, api } of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nRAW ARTICLE TEXT TO STRUCTURE:\n${trimmed}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Near-zero temperature prevents hallucinations
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        lastError = `Gemini API returned status ${res.status}: ${errorText.slice(0, 150)}`;
        // If 404 model not found, continue to next model in fallback list
        if (res.status === 404) {
          continue;
        }
        return { success: false, blocks: [], error: lastError };
      }

      const json = await res.json();
      const rawOutputText =
        json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (!rawOutputText) {
        lastError = "Gemini returned an empty response.";
        continue;
      }

      // Parse JSON from output
      let parsed: { blocks?: unknown[] };
      try {
        // Strip any accidental markdown fences if Gemini added them despite responseMimeType
        const cleanJson = rawOutputText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        parsed = JSON.parse(cleanJson);
      } catch (parseErr) {
        lastError = `Failed to parse AI response as JSON: ${parseErr instanceof Error ? parseErr.message : "Invalid syntax"}`;
        continue;
      }

      if (!parsed || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
        lastError = "AI response did not contain a valid 'blocks' array.";
        continue;
      }

      // Validate & sanitize each block
      const validatedBlocks: ArticleBlock[] = [];
      for (const item of parsed.blocks) {
        const valid = sanitizeBlock(item);
        if (valid) {
          validatedBlocks.push(valid);
        }
      }

      if (validatedBlocks.length === 0) {
        lastError = "No valid content blocks could be extracted from AI response.";
        continue;
      }

      return {
        success: true,
        blocks: validatedBlocks,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : "Unexpected network error.";
    }
  }

  return {
    success: false,
    blocks: [],
    error: lastError,
  };
}

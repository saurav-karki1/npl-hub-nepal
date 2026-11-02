/**
 * NPL Hub Nepal — Groq AI Fact Extraction & Verification Provider
 *
 * Fast structured fact extraction and evidence verification using Groq's free API tier.
 * Models:
 * - `openai/gpt-oss-120b` (Primary: Deep fact synthesis, claim verification & authority evaluation)
 * - `openai/gpt-oss-20b` (Secondary / Fast fallback: Candidate claim extraction)
 *
 * Note: Llama 3.3/3.1 were deprecated on Groq in Aug 2026.
 * Free limits: 30 RPM, 1,000 RPD, 200,000 TPD. Strictly $0.00 zero-cost policy.
 */

import {
  QuotaExceededError,
  type FactDossier,
  type FactClaim,
  type SourceDocument,
  type EditorialArticleType,
} from "../editorial/types";

export const GROQ_MODELS = {
  SYNTHESIS_PRIMARY: "openai/gpt-oss-120b",
  FAST_EXTRACTION: "openai/gpt-oss-20b",
} as const;

interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqCompletionResult {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  modelUsed: string;
}

export async function callGroqChat(
  messages: GroqChatMessage[],
  model: string = GROQ_MODELS.SYNTHESIS_PRIMARY,
  options: { temperature?: number; responseFormatJson?: boolean } = {}
): Promise<GroqCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not configured.");
  }

  const startTime = Date.now();

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.1,
      ...(options.responseFormatJson
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (response.status === 429) {
    const text = await response.text();
    throw new QuotaExceededError("groq", `HTTP 429 Rate / Quota Limit: ${text}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (
      errorText.toLowerCase().includes("quota") ||
      errorText.toLowerCase().includes("rate_limit_exceeded") ||
      errorText.toLowerCase().includes("limit")
    ) {
      throw new QuotaExceededError("groq", errorText);
    }
    throw new Error(`Groq API request failed (${response.status}): ${errorText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content || "";
  const usage = data.usage || {};

  return {
    content,
    tokensInput: usage.prompt_tokens || 0,
    tokensOutput: usage.completion_tokens || 0,
    latencyMs,
    modelUsed: model,
  };
}

/**
 * Extracts and synthesizes a structured Fact Dossier from source documents.
 * Evaluates source credibility, counts corroborating sources, and detects conflicts.
 */
export async function buildFactDossierWithGroq(
  topic: string,
  documents: SourceDocument[],
  articleType: EditorialArticleType = "tournament_news"
): Promise<{ dossier: FactDossier; tokensUsed: number; latencyMs: number; modelUsed: string }> {
  // Format documents for context — keep top 4 sources and truncate to 1,500 chars to avoid exceeding Groq's 8,000 TPM limit
  const topDocs = documents.slice(0, 4);
  const sourcesText = topDocs
    .map((doc, idx) => {
      const body = doc.raw_content ? doc.raw_content.slice(0, 1500) : doc.snippet || "";
      return `--- SOURCE ${idx + 1} (${doc.authority_type.toUpperCase()}): ${doc.title} (${doc.url}) ---\n${body}\n`;
    })
    .join("\n");

  const systemPrompt = `You are a strict, skeptical senior sports investigative fact-checker for Nepal Premier League (NPL) cricket.
Your duty is to build a structured FACT DOSSIER from provided web sources.
ARTICLE TYPE CONTEXT: ${articleType.toUpperCase().replace(/_/g, " ")}

RULES:
1. NEVER invent or assume any facts. If not in the sources, do not include it.
2. Verify claims based on evidence authority:
   - Primary sources (CAN official announcement, official scorecard, ICC): 1 source is sufficient. Mark as "verified".
   - Secondary reporting (reputable sports media e.g. ESPNcricinfo, Cricbuzz, Kathmandu Post, Onlinekhabar): 2 independent corroborations required to be "verified". If only 1 secondary source, mark as "unverified".
   - Rumors or single uncorroborated reports: mark as "unverified" or "rumor".
3. Check for conflicting details (e.g. differing dates, scores, player names, venues). If found, record in conflicts array and set verification_status to "conflicting".
4. Determine if the evidence is sufficient to write a reliable cricket news article.
   Sufficiency rules vary by article type:
   - breaking_news / official_announcement: 1 verified primary source is sufficient.
   - points_table_update / team_news / player_news: 1 verified claim of any type is sufficient.
   - match_report / match_analysis / match_preview: Requires at least 2 verified claims OR 1 verified primary scorecard/result.
   - squad_analysis: Requires at least 2 verified claims about squad composition.
   - tournament_news / feature_story: Requires at least 3 verified claims.
   If insufficient, set is_sufficient: false with clear deficiency_reason.

Output STRICT JSON ONLY matching this format:
{
  "topic": string,
  "primary_entity": string,
  "related_teams": string[],
  "related_players": string[],
  "claims": [
    {
      "id": "claim_1",
      "statement": string,
      "source_urls": string[],
      "source_type": "primary" | "secondary" | "rumor",
      "verification_status": "verified" | "unverified" | "conflicting",
      "confidence": number (0.0 to 1.0),
      "conflict_details": string (optional)
    }
  ],
  "key_quotes": [
    { "speaker": string, "quote": string, "source_url": string }
  ],
  "verified_stats": {
    "key": "value"
  },
  "conflicts": string[],
  "is_sufficient": boolean,
  "sufficiency_reason": string
}`;

  const userPrompt = `TOPIC: ${topic}\n\nSOURCES PROVIDED:\n${sourcesText}\n\nGenerate the complete Fact Dossier JSON now.`;

  let result: GroqCompletionResult;
  try {
    result = await callGroqChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      GROQ_MODELS.SYNTHESIS_PRIMARY,
      { temperature: 0.1, responseFormatJson: true }
    );
  } catch (err: unknown) {
    // If primary 120b model encounters TPM rate-limit (429) or transient error, failover to fast 20b model
    console.warn(
      `[Groq Dossier] Primary model ${GROQ_MODELS.SYNTHESIS_PRIMARY} failed (${(err as Error).message}), attempting failover to ${GROQ_MODELS.FAST_EXTRACTION}...`
    );
    try {
      result = await callGroqChat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        GROQ_MODELS.FAST_EXTRACTION,
        { temperature: 0.1, responseFormatJson: true }
      );
    } catch (fallbackErr: unknown) {
      if (fallbackErr instanceof QuotaExceededError) {
        throw fallbackErr;
      }
      throw err;
    }
  }

  let cleaned = result.content.trim();
  // Strip markdown code fences if model returned them
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  let parsed: FactDossier;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Fact Dossier JSON from Groq output: ${cleaned.slice(0, 200)}`);
  }

  // Ensure claims have fallback values
  if (!Array.isArray(parsed.claims)) {
    parsed.claims = [];
  }
  if (!Array.isArray(parsed.conflicts)) {
    parsed.conflicts = [];
  }
  if (!Array.isArray(parsed.related_teams)) {
    parsed.related_teams = [];
  }
  if (!Array.isArray(parsed.related_players)) {
    parsed.related_players = [];
  }
  if (!Array.isArray(parsed.key_quotes)) {
    parsed.key_quotes = [];
  }

  // Post-process sufficiency check — genre-aware
  const verifiedClaims = parsed.claims.filter(
    (c: FactClaim) => c.verification_status === "verified"
  );
  const primaryClaims = parsed.claims.filter(
    (c: FactClaim) => c.source_type === "primary" && c.verification_status === "verified"
  );

  // Genres where 1 verified primary source is fully sufficient
  const singlePrimaryGenres: EditorialArticleType[] = [
    "breaking_news",
    "official_announcement",
  ];
  // Genres where even 1 verified claim of any type is sufficient
  const lightGenres: EditorialArticleType[] = [
    "points_table_update",
    "team_news",
    "player_news",
  ];
  // Genres requiring 2+ verified claims OR 1 verified primary
  const matchGenres: EditorialArticleType[] = [
    "match_report",
    "match_analysis",
    "match_preview",
    "squad_analysis",
  ];
  // Remaining genres require 3+ verified claims OR 1 primary
  // (tournament_news, feature_story, etc.)

  if (primaryClaims.length >= 1) {
    // Any genre: 1 verified primary source is always sufficient
    parsed.is_sufficient = true;
  } else if (singlePrimaryGenres.includes(articleType) && verifiedClaims.length >= 1) {
    parsed.is_sufficient = true;
  } else if (lightGenres.includes(articleType) && verifiedClaims.length >= 1) {
    parsed.is_sufficient = true;
  } else if (matchGenres.includes(articleType) && verifiedClaims.length >= 2) {
    parsed.is_sufficient = true;
  } else if (verifiedClaims.length >= 3) {
    parsed.is_sufficient = true;
  } else {
    parsed.is_sufficient = false;
    parsed.sufficiency_reason =
      parsed.sufficiency_reason ||
      `Insufficient evidence for "${articleType}": found ${verifiedClaims.length} verified claim(s).`;
  }

  return {
    dossier: parsed,
    tokensUsed: result.tokensInput + result.tokensOutput,
    latencyMs: result.latencyMs,
    modelUsed: result.modelUsed,
  };
}

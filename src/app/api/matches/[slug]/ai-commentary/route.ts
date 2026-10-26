/**
 * NPL Hub Nepal — AI Commentary Route
 * POST /api/matches/[slug]/ai-commentary
 *
 * Hybrid commentary engine: only called for high-impact moments
 * (wickets, sixes, fours). Normal balls use client-side templates.
 *
 * Request body:
 *   {
 *     eventType: "wicket" | "six" | "four" | "dot_pressure",
 *     over: number,          // e.g. 17.2
 *     runs: number,          // runs off this ball
 *     batterName: string,
 *     bowlerName: string,
 *     rawText: string,       // original ESPN commentary text
 *     matchContext: {
 *       battingTeam: string,
 *       bowlingTeam: string,
 *       score: string,       // e.g. "87/3 (16.2)"
 *       target?: number,     // set if 2nd innings
 *       runsNeeded?: number,
 *       ballsLeft?: number,
 *       matchStatus: "live" | "completed",
 *     }
 *   }
 *
 * Response: { commentary: string, cached: boolean }
 *
 * Design rules:
 * - Easy English only — written for Nepali cricket fans of all backgrounds.
 * - No fabricated facts. Commentary is based only on the ball data provided.
 * - 1–2 sentences max. Energetic but clear.
 * - Server-side only. GEMINI_API_KEY never exposed to client.
 * - Falls back gracefully (returns null commentary) if AI unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { executeWithKeyFailover } from "@/lib/agent/gemini-keys";

// In-memory cache keyed by "{slug}-{over}" so the same ball never
// triggers two AI calls (e.g. tab refocus while live).
const commentaryCache = new Map<string, string>();

const MODELS = [
  { id: "gemini-2.5-flash-lite", api: "v1beta" },
  { id: "gemini-2.0-flash", api: "v1beta" },
  { id: "gemini-1.5-flash", api: "v1beta" },
] as const;

const TIMEOUT_MS = 6000;

interface MatchContext {
  battingTeam: string;
  bowlingTeam: string;
  score: string;
  target?: number;
  runsNeeded?: number;
  ballsLeft?: number;
  matchStatus: "live" | "completed";
}

interface RequestBody {
  eventType: "wicket" | "six" | "four" | "dot_pressure";
  over: number;
  runs: number;
  batterName: string;
  bowlerName: string;
  rawText: string;
  matchContext: MatchContext;
}

function buildPrompt(body: RequestBody): string {
  const { eventType, over, runs, batterName, bowlerName, rawText, matchContext } = body;
  const { battingTeam, bowlingTeam, score, target, runsNeeded, ballsLeft } = matchContext;

  const situation = target
    ? `${battingTeam} need ${runsNeeded} runs off ${ballsLeft} balls to win (target: ${target})`
    : `${battingTeam} are batting at ${score}`;

  const eventDesc =
    eventType === "wicket"
      ? `WICKET — ${batterName} is dismissed by ${bowlerName}`
      : eventType === "six"
      ? `SIX — ${batterName} hits ${bowlerName} for 6`
      : eventType === "four"
      ? `FOUR — ${batterName} hits ${bowlerName} for 4`
      : `Dot ball — ${bowlerName} keeps ${batterName} quiet`;

  return `You are a live cricket commentator for NPL Hub Nepal, covering Nepal Premier League Season 3.

BALL DETAILS:
- Over: ${over}
- Event: ${eventDesc}
- Match situation: ${situation}
- ESPN raw text: "${rawText}"

TASK: Write exactly 1–2 short sentences of live ball commentary in plain, easy English for cricket fans in Nepal. 

RULES:
- Use simple, exciting words. Avoid jargon.
- Mention the players' names naturally.
- For wickets: show the drama — who took the wicket, how it changes the game.
- For sixes/fours: show the excitement and crowd energy.
- Include the match situation if it adds drama (e.g. "SPR need 45 off 18 balls").
- Never invent scores or facts not given above.
- Output ONLY the commentary sentence(s). No labels, no JSON, no explanation.`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { eventType, over } = body;

  // Only serve AI commentary for high-impact events
  const validEvents = ["wicket", "six", "four", "dot_pressure"];
  if (!validEvents.includes(eventType)) {
    return NextResponse.json({ commentary: null, cached: false });
  }

  // Cache check — avoid duplicate calls for the same ball
  const cacheKey = `${slug}-${over}-${eventType}`;
  if (commentaryCache.has(cacheKey)) {
    return NextResponse.json({
      commentary: commentaryCache.get(cacheKey),
      cached: true,
    });
  }

  const prompt = buildPrompt(body);

  // Call Gemini with key failover
  let aiText: string | null = null;

  for (const { id: model, api } of MODELS) {
    const result = await executeWithKeyFailover<string>(async (slot) => {
      const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${slot.key}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,  // slightly creative for varied commentary
              maxOutputTokens: 120,
              stopSequences: ["\n\n"],
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text();
          return { status: res.status, errorText: errText.slice(0, 200) };
        }

        const json = await res.json();
        const text: string =
          json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

        if (!text || text.length < 10) {
          return { status: 500, errorText: "Empty response" };
        }

        // Clean up: remove any stray newlines or markdown
        const cleaned = text
          .replace(/\n+/g, " ")
          .replace(/\*\*/g, "")
          .trim();

        return { status: 200, data: cleaned };
      } catch (err) {
        clearTimeout(timeoutId);
        const msg = err instanceof Error ? err.message : "fetch error";
        return { status: 504, errorText: msg };
      }
    });

    if (result.success && result.data) {
      aiText = result.data;
      break;
    }

    if (result.isQuotaExhausted) break;
  }

  if (aiText) {
    // Cache for this server instance lifetime (clears on redeploy)
    commentaryCache.set(cacheKey, aiText);
    // Prevent unbounded growth
    if (commentaryCache.size > 500) {
      const firstKey = commentaryCache.keys().next().value;
      if (firstKey) commentaryCache.delete(firstKey);
    }
  }

  return NextResponse.json({
    commentary: aiText,
    cached: false,
  });
}

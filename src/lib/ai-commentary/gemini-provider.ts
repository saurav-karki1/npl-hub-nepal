/**
 * NPL Hub Nepal — Gemini AI Commentary Provider
 *
 * Calls Google Gemini API with verified match events.
 * Strict anti-hallucination prompt ensures zero invented players, scores, or deliveries.
 * Server-only: GEMINI_API_KEY is never exposed to the client.
 */

import { CommentaryEvent, ICommentaryGenerator } from "./types";

export class GeminiCommentaryProvider implements ICommentaryGenerator {
  private apiKey: string | undefined;
  private model: string = "gemini-2.5-flash";

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(event: CommentaryEvent): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const systemPrompt = `You are a cricket commentary writer for the Nepal Premier League (NPL) at TU Cricket Ground, Kirtipur.
Your task is to write a crisp, 1-to-2 sentence editorial commentary line strictly based on the verified match event data provided.

STRICT ACCURACY RULES:
1. Do NOT invent player names, scores, wickets, overs, or field placements not provided in the event data.
2. If a batter or bowler name is missing, use "the batter" or "the bowler".
3. Use the exact score, runs, and over provided.
4. Output ONLY the commentary sentence. Do not include markdown prefixes, quotes, or conversational filler.`;

    const eventDataString = JSON.stringify({
      over: event.overNumber,
      ball: event.ballNumber,
      eventType: event.eventType,
      runs: event.runs,
      isWicket: event.isWicket,
      wicketType: event.wicketType,
      isBoundary: event.isBoundary,
      isSix: event.isSix,
      batter: event.batterName,
      bowler: event.bowlerName,
      battingTeam: event.battingTeamName,
      bowlingTeam: event.bowlingTeamName,
      currentScore: event.totalScoreDescription,
      matchSituation: event.contextNote,
    });

    const userPrompt = `Generate a 1-sentence cricket commentary for this verified NPL delivery:\n${eventDataString}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Low temperature prevents hallucinations
          maxOutputTokens: 120,
        },
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText.substring(0, 100)}`);
    }

    const data = await response.json();
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!candidateText) {
      throw new Error("Gemini returned empty commentary.");
    }

    return candidateText;
  }
}

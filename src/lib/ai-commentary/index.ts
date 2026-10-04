/**
 * NPL Hub Nepal — AI Commentary Coordinator
 *
 * Coordinates commentary generation, deduplication, caching, and persistence.
 * Prefers Gemini when GEMINI_API_KEY is present; seamlessly falls back to rule-based.
 */

import { CommentaryEvent, CommentaryOutput } from "./types";
import { GeminiCommentaryProvider } from "./gemini-provider";
import { RuleBasedCommentaryProvider } from "./rule-provider";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export * from "./types";
export { GeminiCommentaryProvider } from "./gemini-provider";
export { RuleBasedCommentaryProvider } from "./rule-provider";

// In-memory cache for fast deduplication and local runtime
const commentaryStore = new Map<string, CommentaryOutput[]>();

/**
 * Generates commentary for a verified cricket match event with deduplication.
 */
export async function generateCommentaryForEvent(
  event: CommentaryEvent
): Promise<CommentaryOutput> {
  const existingList = commentaryStore.get(event.matchId) || [];
  const duplicate = existingList.find((c) => c.eventId === event.eventId);
  if (duplicate) {
    return duplicate;
  }

  const gemini = new GeminiCommentaryProvider();
  let text = "";
  let providerName: "gemini" | "rule-based" | "fallback" = "rule-based";

  if (gemini.isConfigured()) {
    try {
      text = await gemini.generate(event);
      providerName = "gemini";
    } catch {
      // Graceful fallback to rule-based on network or quota errors
      const fallback = new RuleBasedCommentaryProvider();
      text = await fallback.generate(event);
      providerName = "fallback";
    }
  } else {
    const rule = new RuleBasedCommentaryProvider();
    text = await rule.generate(event);
    providerName = "rule-based";
  }

  const output: CommentaryOutput = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    matchId: event.matchId,
    eventId: event.eventId,
    overNumber: event.overNumber,
    ballNumber: event.ballNumber,
    eventType: event.eventType,
    text,
    runs: event.runs,
    isWicket: event.isWicket,
    isBoundary: event.isBoundary,
    isSix: event.isSix,
    batterName: event.batterName,
    bowlerName: event.bowlerName,
    provider: providerName,
    createdAt: new Date().toISOString(),
  };

  // 1. Save in memory cache
  commentaryStore.set(event.matchId, [output, ...existingList]);

  // 2. Persist to Supabase if match_commentary table exists
  try {
    const admin = getSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("match_commentary").insert({
      match_id: output.matchId,
      external_event_id: output.eventId,
      over_number: output.overNumber,
      ball_number: output.ballNumber,
      event_type: output.eventType,
      commentary_text: output.text,
      runs: output.runs,
      is_wicket: output.isWicket,
      is_boundary: output.isBoundary,
      is_six: output.isSix,
      batter_name: output.batterName,
      bowler_name: output.bowlerName,
      provider: output.provider,
    });
  } catch {
    // Ignore Supabase write errors if table not yet migrated
  }

  return output;
}

/**
 * Retrieves all commentary items for a specific match, sorted by over descending.
 */
export async function getMatchCommentary(matchId: string): Promise<CommentaryOutput[]> {
  // 1. Try fetching from Supabase
  try {
    const admin = getSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("match_commentary")
      .select("*")
      .eq("match_id", matchId)
      .order("over_number", { ascending: false })
      .order("ball_number", { ascending: false });

    if (!error && data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((row: any) => ({
        id: row.id,
        matchId: row.match_id,
        eventId: row.external_event_id,
        overNumber: Number(row.over_number),
        ballNumber: row.ball_number,
        eventType: row.event_type,
        text: row.commentary_text,
        runs: row.runs,
        isWicket: row.is_wicket,
        isBoundary: row.is_boundary,
        isSix: row.is_six,
        batterName: row.batter_name,
        bowlerName: row.bowler_name,
        provider: row.provider,
        createdAt: row.created_at,
      }));
    }
  } catch {
    // Fall back to memory cache
  }

  // 2. Return from in-memory cache
  return commentaryStore.get(matchId) || [];
}

/**
 * Returns mock/sample verified events for sandbox testing
 */
export function getSampleCommentaryEvents(matchId: string): CommentaryEvent[] {
  return [
    {
      matchId,
      eventId: `${matchId}_17_2`,
      eventType: "boundary",
      overNumber: 17.2,
      ballNumber: 2,
      batterName: "Anil Sah",
      bowlerName: "Karan KC",
      battingTeamName: "Biratnagar Kings",
      bowlingTeamName: "Janakpur Bolts",
      runs: 4,
      isWicket: false,
      isBoundary: true,
      isSix: false,
      totalScoreDescription: "142/4 (17.2 ov)",
      contextNote: "Biratnagar Kings need 27 runs in 16 balls",
    },
    {
      matchId,
      eventId: `${matchId}_17_1`,
      eventType: "ball",
      overNumber: 17.1,
      ballNumber: 1,
      batterName: "Anil Sah",
      bowlerName: "Karan KC",
      battingTeamName: "Biratnagar Kings",
      bowlingTeamName: "Janakpur Bolts",
      runs: 1,
      isWicket: false,
      isBoundary: false,
      isSix: false,
      totalScoreDescription: "138/4 (17.1 ov)",
      contextNote: "Biratnagar Kings need 31 runs in 17 balls",
    },
    {
      matchId,
      eventId: `${matchId}_16_6`,
      eventType: "over_summary",
      overNumber: 16.6,
      ballNumber: 6,
      batterName: "Lokesh Bam",
      bowlerName: "Lalit Rajbanshi",
      battingTeamName: "Biratnagar Kings",
      bowlingTeamName: "Janakpur Bolts",
      runs: 1,
      isWicket: false,
      isBoundary: false,
      isSix: false,
      totalScoreDescription: "137/4 (17.0 ov)",
      contextNote: "End of over 17",
    },
    {
      matchId,
      eventId: `${matchId}_16_4`,
      eventType: "wicket",
      overNumber: 16.4,
      ballNumber: 4,
      batterName: "Martin Guptill",
      bowlerName: "Lalit Rajbanshi",
      battingTeamName: "Biratnagar Kings",
      bowlingTeamName: "Janakpur Bolts",
      runs: 0,
      isWicket: true,
      wicketType: "c Aasif Sheikh b Lalit Rajbanshi",
      isBoundary: false,
      isSix: false,
      totalScoreDescription: "134/4 (16.4 ov)",
      contextNote: "Crucial wicket in the death overs",
    },
  ];
}

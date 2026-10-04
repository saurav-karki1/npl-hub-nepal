/**
 * NPL Hub Nepal — Rule-Based Editorial Commentary Provider
 *
 * Deterministic fallback provider that generates crisp cricket commentary
 * strictly from verified event data without hallucination.
 * Used when GEMINI_API_KEY is not configured or as offline fallback.
 */

import { CommentaryEvent, ICommentaryGenerator } from "./types";

export class RuleBasedCommentaryProvider implements ICommentaryGenerator {
  async generate(event: CommentaryEvent): Promise<string> {
    const batter = event.batterName || "The batter";
    const bowler = event.bowlerName ? ` from ${event.bowlerName}` : "";

    // 1. Wicket event
    if (event.isWicket) {
      const dismissal = event.wicketType ? ` (${event.wicketType})` : "";
      return `WICKET! ${batter} is out${dismissal}${bowler}! Huge breakthrough for ${
        event.bowlingTeamName || "the fielding side"
      }. ${event.totalScoreDescription}.`;
    }

    // 2. Six
    if (event.isSix) {
      return `SIX! ${batter} launches this one high and handsome over the ropes${bowler}! Maximum runs into the TU Stadium crowd. ${event.totalScoreDescription}.`;
    }

    // 3. Four / Boundary
    if (event.isBoundary) {
      return `FOUR! Cracking shot from ${batter}, finding the gap cleanly to the boundary. ${event.totalScoreDescription}.`;
    }

    // 4. Over Summary
    if (event.eventType === "over_summary") {
      return `End of over ${Math.floor(event.overNumber)}. ${
        event.battingTeamName || "Batting team"
      } reach ${event.totalScoreDescription}.${
        event.contextNote ? ` ${event.contextNote}.` : ""
      }`;
    }

    // 5. Normal ball / Dot / Singles
    if (event.runs === 0) {
      return `Dot ball. Good tight delivery${bowler}, defended solidly by ${batter}.`;
    } else if (event.runs === 1) {
      return `Single taken. ${batter} works it into the gap for a quick run.`;
    } else if (event.runs === 2) {
      return `Pushed into the deep, and good running between the wickets earns two runs for ${batter}.`;
    } else {
      return `${event.runs} runs scored by ${batter}${bowler}. ${event.totalScoreDescription}.`;
    }
  }
}

/**
 * NPL Hub Nepal — AI Commentary Types
 *
 * Strict interfaces for verified event data and generated commentary.
 * Designed to prevent factual hallucinations (zero invented players, scores, or wickets).
 */

export type CommentaryEventType =
  | "ball"
  | "boundary"
  | "wicket"
  | "over_summary"
  | "milestone"
  | "match_start"
  | "match_end";

export interface CommentaryEvent {
  matchId: string;
  eventId: string; // e.g. "m01_o18_b2"
  eventType: CommentaryEventType;
  overNumber: number; // e.g. 18.2
  ballNumber: number; // 2
  batterName?: string;
  bowlerName?: string;
  battingTeamName?: string;
  bowlingTeamName?: string;
  runs: number;
  isWicket: boolean;
  wicketType?: string; // e.g. "caught at deep midwicket", "bowled", "lbw"
  isBoundary: boolean;
  isSix: boolean;
  totalScoreDescription: string; // e.g. "148/4 (18.2 ov)"
  contextNote?: string; // e.g. "Biratnagar Kings need 21 runs from 10 balls"
}

export interface CommentaryOutput {
  id: string;
  matchId: string;
  eventId: string;
  overNumber: number;
  ballNumber: number;
  eventType: CommentaryEventType;
  headline?: string;
  text: string;
  runs: number;
  isWicket: boolean;
  isBoundary: boolean;
  isSix: boolean;
  batterName?: string;
  bowlerName?: string;
  provider: "gemini" | "rule-based" | "manual" | "fallback";
  createdAt: string;
}

export interface ICommentaryGenerator {
  generate(event: CommentaryEvent): Promise<string>;
}

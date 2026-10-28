import { NextRequest, NextResponse } from "next/server";
import { getMatchBySlug } from "@/lib/repository/matches";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { syncMatchCore } from "@/lib/sync/live-sync-core";

export const dynamic = "force-dynamic";

export interface LiveBatter {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  isStriker: boolean;
}

export interface LiveBowler {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: string;
}

export interface LiveBallEvent {
  over: string;
  event: string;
  dismissal: string;
  text: string;
}

export interface LiveScorePayload {
  live: boolean;
  isCompleted?: boolean;
  matchId?: string;
  slug?: string;
  scores?: {
    team1?: { runs: number; wickets: number; overs: string };
    team2?: { runs: number; wickets: number; overs: string };
  };
  summary?: string;
  resultStatement?: string;
  toss?: string;
  batters?: LiveBatter[];
  bowlers?: LiveBowler[];
  recentBalls?: LiveBallEvent[];
  updatedAt?: string;
  error?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const match = await getMatchBySlug(slug);

    if (!match) {
      return NextResponse.json({ live: false, message: "Match not found" });
    }

    const updatedAt = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // 1. If match is currently live or kickoff time has arrived, trigger sync via HTML parser
    if (match.status === "live" || match.status === "upcoming") {
      try {
        await syncMatchCore(match.matchNumber);
      } catch (err) {
        console.warn(`[LIVE SCORE API] syncMatchCore error for M#${match.matchNumber}:`, err);
      }
    }

    // 2. Fetch latest state from Supabase database
    try {
      const sb = getSupabaseAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbMatch } = await (sb.from("matches") as any)
        .select("id,slug,status,scores,result,result_statement")
        .eq("slug", slug)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbComms } = await (sb.from("match_commentary") as any)
        .select("over_number,ball_number,headline,commentary_text,is_wicket,is_boundary,is_six,runs,batter_name,bowler_name")
        .eq("match_id", match.id)
        .order("over_number", { ascending: false })
        .limit(20);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recentBalls: LiveBallEvent[] = (dbComms || []).map((c: any) => ({
        over: c.over_number ? String(c.over_number) : "",
        event: c.headline || (c.is_wicket ? "WICKET" : c.is_six ? "SIX" : c.is_boundary ? "FOUR" : `${c.runs || 0}`),
        dismissal: c.is_wicket ? c.commentary_text : "",
        text: c.commentary_text || "",
      }));

      if (dbMatch) {
        const isCompleted = dbMatch.status === "completed";
        return NextResponse.json({
          live: dbMatch.status === "live",
          isCompleted,
          matchId: dbMatch.id,
          slug: dbMatch.slug,
          scores: dbMatch.scores || match.scores,
          summary: dbMatch.result_statement || "",
          resultStatement: dbMatch.result_statement || dbMatch.result || "",
          toss: dbMatch.result_statement || "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          batters: (dbMatch.scores as any)?.batters || [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bowlers: (dbMatch.scores as any)?.bowlers || [],
          recentBalls,
          updatedAt,
        });
      }
    } catch {
      // Fall through to repository static fallback
    }

    // Default response using static/repository match object
    return NextResponse.json({
      live: match.status === "live",
      isCompleted: match.status === "completed",
      matchId: match.id,
      slug: match.slug,
      scores: match.scores,
      summary: match.resultDetails?.statement || "",
      resultStatement: match.resultDetails?.statement || match.result || "",
      toss: "",
      batters: [],
      bowlers: [],
      recentBalls: [],
      updatedAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching live score";
    return NextResponse.json({ live: false, error: msg }, { status: 500 });
  }
}

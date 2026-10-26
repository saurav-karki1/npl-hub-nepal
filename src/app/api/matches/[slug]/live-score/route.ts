import { NextRequest, NextResponse } from "next/server";
import { getMatchBySlug } from "@/lib/repository/matches";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

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
  matchId?: string;
  slug?: string;
  scores?: {
    team1?: { runs: number; wickets: number; overs: string };
    team2?: { runs: number; wickets: number; overs: string };
  };
  summary?: string;
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

    if (!match || !match.espnMatchPath) {
      return NextResponse.json({ live: false, message: "No live feed configured" });
    }

    // Extract numeric match ID from espnMatchPath (e.g. 1st-match-1558582/live-cricket-score -> 1558582)
    const idMatch = match.espnMatchPath.match(/-([0-9]{6,8})\//);
    const espnMatchId = idMatch ? idMatch[1] : null;

    if (!espnMatchId) {
      return NextResponse.json({ live: false, message: "Could not parse ESPN match ID" });
    }

    const apiUrl = `https://www.espncricinfo.com/ci/engine/match/${espnMatchId}.json`;

    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { live: false, error: `ESPN returned status ${res.status}` },
        { status: 502 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = await res.json();

    // Map player IDs to known names
    const players: Record<string, string> = {};
    for (const t of d.team || []) {
      for (const p of t.player || []) {
        if (p.player_id && p.known_as) {
          players[String(p.player_id)] = p.known_as;
        }
      }
    }

    const liveInnings = d.live?.innings;
    const battingTeamId = liveInnings ? String(liveInnings.team_id) : null;

    // Team 1 = Lumbini Lions (7239), Team 2 = Sudurpaschim Royals (7237)
    // Dynamic fallback based on match.team1Id / team2Id
    const isTeam2Batting = battingTeamId === "7237" || (d.team?.[1]?.team_id && battingTeamId === String(d.team[1].team_id));

    const scores = {
      team1: !isTeam2Batting && liveInnings
        ? {
            runs: Number(liveInnings.runs) || 0,
            wickets: Number(liveInnings.wickets) || 0,
            overs: String(liveInnings.overs || "0.0"),
          }
        : undefined,
      team2: isTeam2Batting && liveInnings
        ? {
            runs: Number(liveInnings.runs) || 0,
            wickets: Number(liveInnings.wickets) || 0,
            overs: String(liveInnings.overs || "0.0"),
          }
        : undefined,
    };

    // Parse active batters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batters: LiveBatter[] = (d.live?.batting || []).map((b: any) => ({
      name: players[String(b.player_id)] || b.player_id || "Batter",
      runs: Number(b.runs) || 0,
      balls: Number(b.balls_faced) || 0,
      fours: Number(b.fours) || 0,
      sixes: Number(b.sixes) || 0,
      strikeRate: b.strike_rate ? String(b.strike_rate) : "0.00",
      isStriker: b.live_current_name === "striker",
    }));

    // Parse active bowlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bowlers: LiveBowler[] = (d.live?.bowling || []).map((b: any) => ({
      name: players[String(b.player_id)] || b.player_id || "Bowler",
      overs: String(b.overs || "0.0"),
      maidens: Number(b.maidens) || 0,
      runs: Number(b.conceded) || 0,
      wickets: Number(b.wickets) || 0,
      economy: b.economy_rate ? String(b.economy_rate) : "0.00",
    }));

    // Parse recent ball commentary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commsList: any[] = d.comms?.[0]?.ball || [];
    const recentBalls: LiveBallEvent[] = commsList.slice(0, 10).map((ball) => ({
      over: ball.overs_actual ? String(ball.overs_actual) : "",
      event: ball.event ? String(ball.event) : "",
      dismissal: ball.dismissal ? String(ball.dismissal) : "",
      text: ball.text || ball.dismissal || ball.event || "",
    }));

    const updatedAt = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const payload: LiveScorePayload = {
      live: true,
      matchId: match.id,
      slug: match.slug,
      scores,
      summary: d.match?.current_summary || "",
      toss: d.live?.status || "",
      batters,
      bowlers,
      recentBalls,
      updatedAt,
    };

    // Update Supabase in background if scores are present
    if (scores.team1 || scores.team2) {
      try {
        const sb = getSupabaseAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (sb.from("matches") as any)
          .update({
            status: "live",
            scores: {
              ...(scores.team1 ? { team1: scores.team1 } : {}),
              ...(scores.team2 ? { team2: scores.team2 } : {}),
            },
          })
          .eq("slug", slug);
      } catch {
        // Silently continue if Supabase update fails
      }
    }

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching live score";
    return NextResponse.json({ live: false, error: msg }, { status: 500 });
  }
}

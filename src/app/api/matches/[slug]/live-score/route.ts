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

    if (!match) {
      return NextResponse.json({ live: false, message: "Match not found" });
    }

    const updatedAt = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Strategy 1: Try direct ESPN JSON API if configured
    if (match.espnMatchPath) {
      const idMatch = match.espnMatchPath.match(/-([0-9]{6,8})\//);
      const espnMatchId = idMatch ? idMatch[1] : null;

      if (espnMatchId) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const res = await fetch(
            `https://www.espncricinfo.com/ci/engine/match/${espnMatchId}.json`,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                Accept: "application/json, text/plain, */*",
              },
              signal: controller.signal,
              next: { revalidate: 10 },
            }
          );

          clearTimeout(timeoutId);

          if (res.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d: any = await res.json();

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
            const isTeam2Batting = battingTeamId === "7237";

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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bowlers: LiveBowler[] = (d.live?.bowling || []).map((b: any) => ({
              name: players[String(b.player_id)] || b.player_id || "Bowler",
              overs: String(b.overs || "0.0"),
              maidens: Number(b.maidens) || 0,
              runs: Number(b.conceded) || 0,
              wickets: Number(b.wickets) || 0,
              economy: b.economy_rate ? String(b.economy_rate) : "0.00",
            }));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const commsList: any[] = d.comms?.[0]?.ball || [];
            const recentBalls: LiveBallEvent[] = commsList.slice(0, 10).map((ball) => ({
              over: ball.overs_actual ? String(ball.overs_actual) : "",
              event: ball.event ? String(ball.event) : "",
              dismissal: ball.dismissal ? String(ball.dismissal) : "",
              text: ball.text || ball.dismissal || ball.event || "",
            }));

            return NextResponse.json({
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
            });
          }
        } catch {
          // Fall through to Strategy 2 (Supabase Live Store)
        }
      }
    }

    // Strategy 2: Supabase Database fallback (works everywhere, never blocked by cloud IPs)
    try {
      const sb = getSupabaseAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbMatch } = await (sb.from("matches") as any)
        .select("id,slug,status,scores,result_statement")
        .eq("slug", slug)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: dbComms } = await (sb.from("match_commentary") as any)
        .select("over_number,ball_number,headline,commentary_text,is_wicket")
        .eq("match_id", match.id)
        .order("over_number", { ascending: false })
        .limit(10);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recentBalls: LiveBallEvent[] = (dbComms || []).map((c: any) => ({
        over: c.over_number ? String(c.over_number) : "",
        event: c.headline || (c.is_wicket ? "WICKET" : "•"),
        dismissal: c.is_wicket ? c.commentary_text : "",
        text: c.commentary_text || "",
      }));

      if (dbMatch) {
        return NextResponse.json({
          live: dbMatch.status === "live",
          matchId: dbMatch.id,
          slug: dbMatch.slug,
          scores: dbMatch.scores || match.scores,
          summary: dbMatch.result_statement || "",
          toss: dbMatch.result_statement || "",
          batters: [],
          bowlers: [],
          recentBalls,
          updatedAt,
        });
      }
    } catch {
      // Fall through
    }

    // Default response using static/repository match object
    return NextResponse.json({
      live: match.status === "live",
      matchId: match.id,
      slug: match.slug,
      scores: match.scores,
      summary: match.resultDetails?.statement || "",
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

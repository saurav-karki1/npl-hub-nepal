import { NextRequest, NextResponse } from "next/server";
import { getMatchBySlug } from "@/lib/repository/matches";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { recalculateAndPersistStandings } from "@/lib/standings/calculator";

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

    // Derive numeric ESPN match ID (Matches 1 to 32 map sequentially: 1558582 + matchNumber - 1)
    let espnMatchId = String(1558581 + match.matchNumber);
    if (match.espnMatchPath) {
      const idMatch = match.espnMatchPath.match(/-([0-9]{6,8})\//);
      if (idMatch) espnMatchId = idMatch[1];
    }

    // Strategy 1: Try direct ESPN JSON API
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

        const teams = d.team || [];
        const team1Id = teams[0] ? String(teams[0].team_id) : undefined;
        const team2Id = teams[1] ? String(teams[1].team_id) : undefined;

        let team1Score: { runs: number; wickets: number; overs: string } | undefined = undefined;
        let team2Score: { runs: number; wickets: number; overs: string } | undefined = undefined;

        // Parse ALL innings so completed 1st innings is never lost
        for (const inn of d.innings || []) {
          const battingId = String(inn.batting_team_id);
          const parsed = {
            runs: Number(inn.runs) || 0,
            wickets: Number(inn.wickets) || 0,
            overs: String(inn.overs || "0.0"),
          };
          if (team1Id && battingId === team1Id) {
            team1Score = parsed;
          } else if (team2Id && battingId === team2Id) {
            team2Score = parsed;
          }
        }

        // Live innings updates the active batting team with real-time ball/over figures
        if (d.live?.innings) {
          const activeBattingId = String(d.live.innings.team_id);
          const liveParsed = {
            runs: Number(d.live.innings.runs) || 0,
            wickets: Number(d.live.innings.wickets) || 0,
            overs: String(d.live.innings.overs || "0.0"),
          };
          if (activeBattingId === team1Id) {
            team1Score = liveParsed;
          } else if (activeBattingId === team2Id) {
            team2Score = liveParsed;
          }
        }

        // Match status & result detection
        const liveStatusStr = String(d.live?.status || "").trim();
        const liveStatusLower = liveStatusStr.toLowerCase();

        const hasWonString =
          liveStatusLower.includes("won by") ||
          liveStatusLower.includes("won the match") ||
          liveStatusLower.includes("beat") ||
          liveStatusLower.includes("defeat");

        const isTiedOrAbandoned =
          liveStatusLower.includes("match tied") ||
          liveStatusLower.includes("tied") ||
          liveStatusLower.includes("no result") ||
          liveStatusLower.includes("abandoned") ||
          liveStatusLower.includes("match over");

        const inn1 = d.innings?.[0];
        const inn2 = d.innings?.[1];
        const inn2Completed = Boolean(
          inn2 &&
          (Number(inn2.wickets) >= 10 ||
            parseFloat(inn2.overs) >= 20 ||
            (inn2.target && Number(inn2.runs) >= Number(inn2.target)))
        );

        const isCompleted =
          (d.match?.result !== "0" && Boolean(d.match?.result)) ||
          hasWonString ||
          isTiedOrAbandoned ||
          inn2Completed;

        // Auto-detect live match: start time passed, or toss conducted, or innings in progress
        const hasTossOrLiveStatus =
          liveStatusLower.includes("toss") ||
          liveStatusLower.includes("opted to") ||
          liveStatusLower.includes("elected to") ||
          liveStatusLower.includes("chose to") ||
          liveStatusLower.includes("in progress") ||
          liveStatusLower.includes("delayed");

        const hasInningsData = Boolean(
          (d.innings && d.innings.length > 0) ||
          (d.live?.innings && d.live.innings.runs !== undefined)
        );

        // Parse scheduled start time in Nepal time
        let startMs: number | null = null;
        if (match.date && match.time && match.time !== "Time TBA") {
          const m = match.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (m) {
            let h = parseInt(m[1], 10);
            const mins = parseInt(m[2], 10);
            if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
            if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
            const iso = `${match.date}T${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00+05:45`;
            const parsed = new Date(iso).getTime();
            if (!isNaN(parsed)) startMs = parsed;
          }
        }
        const nowMs = Date.now();

        const isLiveMatch =
          !isCompleted &&
          (hasInningsData || hasTossOrLiveStatus || (startMs !== null && nowMs >= startMs));

        const team1Name = teams[0]?.team_name?.replace(/\s*\(NPL\)/gi, "").trim() || "Team 1";
        const team2Name = teams[1]?.team_name?.replace(/\s*\(NPL\)/gi, "").trim() || "Team 2";

        const winnerEspnId = String(d.match?.winner_team_id);
        let winMargin =
          d.match?.amount && d.match?.amount_name ? `${d.match.amount} ${d.match.amount_name}` : undefined;
        let winType: "runs" | "wickets" | "super_over" | "no_result" | "abandoned" | undefined =
          d.match?.amount_name?.includes("run") ? "runs" : "wickets";

        let winnerName: string | undefined = undefined;
        let winnerTeamSlug: string | undefined = undefined;
        let resultStatement = "";

        if (isCompleted) {
          if (hasWonString) {
            resultStatement = liveStatusStr.replace(/\s*\(NPL\)/gi, "").trim();
            const wonMatch = resultStatement.match(/^(.*?)\s+won by\s+(.*)$/i);
            if (wonMatch) {
              winnerName = wonMatch[1].trim();
              winMargin = wonMatch[2].trim();
              winType = winMargin.toLowerCase().includes("run") ? "runs" : "wickets";
            }
          } else if (isTiedOrAbandoned) {
            resultStatement = liveStatusStr.replace(/\s*\(NPL\)/gi, "").trim();
          } else if (inn1 && inn2) {
            const inn1Runs = Number(inn1.runs) || 0;
            const inn2Runs = Number(inn2.runs) || 0;
            const inn2Wickets = Number(inn2.wickets) || 0;
            const inn1TeamId = String(inn1.batting_team_id);
            const inn1TeamName = inn1TeamId === team1Id ? team1Name : team2Name;
            const inn2TeamName = inn1TeamId === team1Id ? team2Name : team1Name;

            if (inn2Runs > inn1Runs) {
              const wktMargin = 10 - inn2Wickets;
              winnerName = inn2TeamName;
              winMargin = `${wktMargin} wicket${wktMargin === 1 ? "" : "s"}`;
              winType = "wickets";
              resultStatement = `${winnerName} won by ${winMargin}`;
            } else if (inn1Runs > inn2Runs) {
              const runMargin = inn1Runs - inn2Runs;
              winnerName = inn1TeamName;
              winMargin = `${runMargin} run${runMargin === 1 ? "" : "s"}`;
              winType = "runs";
              resultStatement = `${winnerName} won by ${winMargin}`;
            } else {
              resultStatement = "Match tied";
            }
          } else {
            resultStatement = "Match Completed";
          }

          if (winnerName) {
            if (team1Name && winnerName.toLowerCase().includes(team1Name.toLowerCase())) {
              winnerTeamSlug = match.team1Id ?? undefined;
            } else if (team2Name && winnerName.toLowerCase().includes(team2Name.toLowerCase())) {
              winnerTeamSlug = match.team2Id ?? undefined;
            }
          } else if (winnerEspnId && winnerEspnId !== "0") {
            winnerTeamSlug = winnerEspnId === team1Id ? (match.team1Id ?? undefined) : winnerEspnId === team2Id ? (match.team2Id ?? undefined) : undefined;
            winnerName = winnerEspnId === team1Id ? team1Name : team2Name;
          }
        } else {
          resultStatement = d.match?.current_summary || liveStatusStr || "";
        }

        const summary = d.match?.current_summary || "";

        const scores = {
          team1: team1Score,
          team2: team2Score,
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
        const allBalls: any[] = [];
        for (const page of d.comms || []) {
          for (const b of page.ball || []) {
            allBalls.push(b);
          }
        }
        const recentBalls: LiveBallEvent[] = allBalls.slice(0, 20).map((ball) => ({
          over: ball.overs_actual ? String(ball.overs_actual) : "",
          event: ball.event ? String(ball.event) : "",
          dismissal: ball.dismissal ? String(ball.dismissal) : "",
          text: ball.text || ball.dismissal || ball.event || "",
        }));

        // Asynchronously sync to Supabase when active or completed
        if (isCompleted || isLiveMatch) {
          try {
            const sb = getSupabaseAdminClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (sb.from("matches") as any)
              .update({
                status: isCompleted ? "completed" : "live",
                scores,
                result: isCompleted ? resultStatement : undefined,
                result_statement: resultStatement,
                winner_team_id: isCompleted ? winnerTeamSlug : undefined,
                winner_name: isCompleted ? winnerName : undefined,
                win_margin: isCompleted ? winMargin : undefined,
                win_type: isCompleted ? winType : undefined,
              })
              .eq("slug", slug);

            if (isCompleted) {
              recalculateAndPersistStandings("season-3").catch(() => {});
            }
          } catch {
            // Continue if background write fails
          }
        }

        return NextResponse.json({
          live: isLiveMatch,
          isCompleted,
          matchId: match.id,
          slug: match.slug,
          scores,
          summary,
          resultStatement,
          toss: d.live?.status || "",
          batters,
          bowlers,
          recentBalls,
          updatedAt,
        });
      }
    } catch {
      // Fall through to Strategy 2 (Supabase)
    }

    // Strategy 2: Supabase Database fallback (reliable, never blocked by cloud IPs)
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
          batters: (dbMatch.scores as any)?.batters || [],
          bowlers: (dbMatch.scores as any)?.bowlers || [],
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

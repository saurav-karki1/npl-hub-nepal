/**
 * NPL Hub Nepal — Cloud Live Sync Core Engine
 *
 * Runs seamlessly on Vercel Serverless (via /api/cron/live-sync)
 * without requiring any local laptop process.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { recalculateAndPersistStandings } from "@/lib/standings/calculator";

function parseMatchStartMs(dateStr?: string, timeStr?: string): number | null {
  if (!dateStr || !timeStr || timeStr === "Time TBA") return null;
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (m[3].toUpperCase() === "AM" && hours === 12) hours = 0;
  const isoNepal = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:45`;
  const d = new Date(isoNepal);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export interface SyncMatchResult {
  matchNumber: number;
  status: "live" | "completed" | "upcoming" | "error";
  message: string;
  scoreSummary?: string;
  winner?: string;
}

export async function syncMatchCore(matchNumber: number): Promise<SyncMatchResult> {
  const sb = getSupabaseAdminClient();
  const espnMatchId = String(1558581 + matchNumber);
  const matchIdStr = `match-${String(matchNumber).padStart(2, "0")}`;

  try {
    // 1. Fetch match metadata from Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbMatch, error: dbErr } = await (sb as any)
      .from("matches")
      .select("id, slug, match_date, match_time, status, team1_id, team2_id")
      .eq("id", matchIdStr)
      .single();

    if (dbErr || !dbMatch) {
      return { matchNumber, status: "error", message: `Match not found: ${dbErr?.message}` };
    }

    const matchDate = dbMatch?.match_date;
    const matchTime = dbMatch?.match_time;
    const startMs = parseMatchStartMs(matchDate, matchTime);
    const nowMs = Date.now();

    // Optimization: If upcoming fixture is scheduled in the future (more than 30 mins before toss),
    // skip polling ESPN to avoid unnecessary calls and rate-limiting.
    if (
      dbMatch?.status === "upcoming" &&
      startMs !== null &&
      nowMs < startMs - 30 * 60 * 1000
    ) {
      return {
        matchNumber,
        status: "upcoming",
        message: `Match #${matchNumber} is scheduled for ${matchDate} at ${matchTime}.`,
      };
    }

    // 2. Fetch ESPN Cricinfo JSON with full browser headers
    const res = await fetch(`https://www.espncricinfo.com/ci/engine/match/${espnMatchId}.json`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.espncricinfo.com/",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 404) {
        return {
          matchNumber,
          status: "upcoming",
          message: `Match #${matchNumber} is upcoming (${matchDate} at ${matchTime}). Live feed will activate once match starts.`,
        };
      }
      return { matchNumber, status: "error", message: `ESPN returned HTTP ${res.status}` };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = await res.json();
    const teams = d.team || [];
    const team1Id = teams[0] ? String(teams[0].team_id) : undefined;
    const team2Id = teams[1] ? String(teams[1].team_id) : undefined;
    const team1Name = teams[0]?.team_name?.replace(/\s*\(NPL\)/gi, "").trim() || "Team 1";
    const team2Name = teams[1]?.team_name?.replace(/\s*\(NPL\)/gi, "").trim() || "Team 2";

    const players: Record<string, string> = {};
    for (const t of teams) {
      for (const p of t.player || []) {
        if (p.player_id && p.known_as) {
          players[String(p.player_id)] = p.known_as;
        }
      }
    }

    let team1Score: { runs: number; wickets: number; overs: string } | undefined = undefined;
    let team2Score: { runs: number; wickets: number; overs: string } | undefined = undefined;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batters = (d.live?.batting || []).map((b: any) => ({
      name: players[String(b.player_id)] || b.player_id || "Batter",
      runs: Number(b.runs) || 0,
      balls: Number(b.balls_faced) || 0,
      fours: Number(b.fours) || 0,
      sixes: Number(b.sixes) || 0,
      strikeRate: b.strike_rate ? String(b.strike_rate) : "0.00",
      isStriker: b.live_current_name === "striker",
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bowlers = (d.live?.bowling || []).map((bw: any) => ({
      name: players[String(bw.player_id)] || bw.player_id || "Bowler",
      overs: String(bw.overs || "0.0"),
      maidens: Number(bw.maidens) || 0,
      runs: Number(bw.conceded) || 0,
      wickets: Number(bw.wickets) || 0,
      economy: bw.economy_rate ? String(bw.economy_rate) : "0.00",
    }));

    // Detect match completion
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
      liveStatusLower.includes("abandoned");

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
      liveStatusLower.includes("match over") ||
      inn2Completed;

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

    const isLiveMatch =
      !isCompleted &&
      (hasInningsData || hasTossOrLiveStatus || (startMs !== null && nowMs >= startMs));

    if (!isCompleted && !isLiveMatch) {
      return {
        matchNumber,
        status: "upcoming",
        message: `Fixture is upcoming (${d.live?.status || "Scheduled"}).`,
      };
    }

    // Determine result statement & winner
    let winnerName: string | undefined = undefined;
    let winMargin: string | undefined =
      d.match?.amount && d.match?.amount_name ? `${d.match.amount} ${d.match.amount_name}` : undefined;
    let winType: "runs" | "wickets" | "super_over" | "no_result" | "abandoned" =
      d.match?.amount_name?.includes("run") ? "runs" : "wickets";
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
          winnerTeamSlug = dbMatch?.team1_id;
        } else if (team2Name && winnerName.toLowerCase().includes(team2Name.toLowerCase())) {
          winnerTeamSlug = dbMatch?.team2_id;
        }
      }
    } else {
      resultStatement = d.match?.current_summary || liveStatusStr || "";
    }

    const targetStatus = isCompleted ? "completed" : "live";
    const scores = {
      team1: team1Score ?? { runs: 0, wickets: 0, overs: "0.0" },
      team2: team2Score ?? { runs: 0, wickets: 0, overs: "0.0" },
      batters: batters.length > 0 ? batters : undefined,
      bowlers: bowlers.length > 0 ? bowlers : undefined,
    };

    // Update matches table in Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb as any)
      .from("matches")
      .update({
        status: targetStatus,
        scores,
        result: isCompleted ? resultStatement : undefined,
        result_statement: resultStatement,
        winner_name: isCompleted ? winnerName : undefined,
        winner_team_id: isCompleted ? winnerTeamSlug : undefined,
        win_margin: isCompleted ? winMargin : undefined,
        win_type: isCompleted ? winType : undefined,
      })
      .eq("id", matchIdStr);

    // Sync commentary events
    const inningsBattingMap: Record<number, string> = {};
    for (let i = 0; i < (d.innings || []).length; i++) {
      inningsBattingMap[i + 1] = String(d.innings[i].batting_team_id);
    }
    const activeBattingTeamId = d.live?.innings?.team_id ? String(d.live.innings.team_id) : null;
    let currentInningsNum = d.innings?.length || 1;
    if (activeBattingTeamId) {
      for (const [num, tId] of Object.entries(inningsBattingMap)) {
        if (tId === activeBattingTeamId) {
          currentInningsNum = Number(num);
          break;
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allBalls: any[] = [];
    for (let pi = 0; pi < (d.comms || []).length; pi++) {
      const page = d.comms[pi];
      const pageInnings = page.innings_number ? Number(page.innings_number) : pi + 1;
      for (const b of page.ball || []) {
        allBalls.push({ ...b, _inningsNum: pageInnings });
      }
    }

    const currentInningsBalls = allBalls.filter((b) => b._inningsNum === currentInningsNum);
    const ballsToSync = currentInningsBalls.length > 0 ? currentInningsBalls : allBalls;

    const activeStriker = batters.find((b: { isStriker: boolean }) => b.isStriker)?.name || batters[0]?.name;
    const activeBowler = bowlers[0]?.name;

    for (const ball of ballsToSync.slice(0, 50)) {
      if (!ball.overs_actual) continue;
      const overNum = parseFloat(ball.overs_actual) || 0;
      const overInt = Math.floor(overNum);
      const ballInt = Math.round((overNum - overInt) * 10);
      const inningsTag = ball._inningsNum || currentInningsNum;
      const eventId = `espn_${espnMatchId}_inn${inningsTag}_${ball.overs_actual}`;

      const evStr = String(ball.event || "");
      const evLower = evStr.toLowerCase();
      const txtLower = String(ball.text || "").toLowerCase();

      const isWicket = Boolean(
        ball.dismissal ||
        evLower.includes("out") ||
        evLower.includes("wicket") ||
        txtLower.includes("out")
      );
      const isSix = evLower.includes("six") || evLower.includes("6") || txtLower.includes("six");
      const isFour = !isSix && (evLower.includes("four") || evLower.includes("4") || txtLower.includes("four"));

      let runs = 0;
      if (isSix) runs = 6;
      else if (isFour) runs = 4;
      else {
        const runMatch = evLower.match(/(\d+)\s*run/);
        runs = runMatch ? parseInt(runMatch[1], 10) || 0 : parseInt(evStr, 10) || 0;
      }

      const rawBatter = ball.players ? ball.players.split(" to ")[1]?.trim() : activeStriker;
      const rawBowler = ball.players ? ball.players.split(" to ")[0]?.trim() : activeBowler;

      let commentaryText = ball.dismissal || ball.text;
      if (!commentaryText || commentaryText.trim() === "" || commentaryText === ball.event) {
        if (isWicket) commentaryText = `OUT! ${rawBatter || "The batter"} is dismissed by ${rawBowler || "the bowler"}.`;
        else if (isSix) commentaryText = `SIX! ${rawBatter || "The batter"} hits a massive maximum off ${rawBowler || "the bowler"}!`;
        else if (isFour) commentaryText = `FOUR! ${rawBatter || "The batter"} drives it to the boundary off ${rawBowler || "the bowler"}.`;
        else if (runs === 1) commentaryText = `1 run. ${rawBatter || "The batter"} rotates the strike with a single off ${rawBowler || "the bowler"}.`;
        else if (runs > 1) commentaryText = `${runs} runs scored off ${rawBowler || "the bowler"}.`;
        else commentaryText = `Dot ball. Good delivery by ${rawBowler || "the bowler"}.`;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb as any)
        .from("match_commentary")
        .upsert(
          {
            match_id: matchIdStr,
            external_event_id: eventId,
            over_number: overNum,
            ball_number: ballInt,
            event_type: isWicket ? "wicket" : isFour || isSix ? "boundary" : "ball",
            commentary_text: commentaryText,
            headline: isWicket ? "WICKET!" : isSix ? "SIX!" : isFour ? "FOUR!" : undefined,
            runs,
            is_wicket: isWicket,
            is_boundary: Boolean(isFour || isSix),
            is_six: Boolean(isSix),
            batter_name: rawBatter,
            bowler_name: rawBowler,
            innings_number: inningsTag,
            provider: "manual",
          },
          { onConflict: "match_id,external_event_id" }
        );
    }

    // Standings recalculation on completion
    if (isCompleted) {
      try {
        await recalculateAndPersistStandings("season-3");
      } catch (err: unknown) {
        console.error(`[CRON SYNC M${matchNumber}] Recalculate standings error:`, err);
      }
    }

    return {
      matchNumber,
      status: targetStatus,
      message: resultStatement || `Match status is ${targetStatus}`,
      scoreSummary: `${team1Name} ${team1Score?.runs || 0}/${team1Score?.wickets || 0} vs ${team2Name} ${team2Score?.runs || 0}/${team2Score?.wickets || 0}`,
      winner: winnerName,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { matchNumber, status: "error", message: errorMsg };
  }
}

export async function runCloudLiveSync(): Promise<SyncMatchResult[]> {
  const sb = getSupabaseAdminClient();

  // 1. Find matches with status 'live'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: liveMatches } = await (sb as any)
    .from("matches")
    .select("id, match_number, status")
    .eq("status", "live");

  const results: SyncMatchResult[] = [];

  // If matches are currently live, sync them immediately
  if (liveMatches && liveMatches.length > 0) {
    for (const m of liveMatches) {
      const r = await syncMatchCore(m.match_number);
      results.push(r);
    }
    return results;
  }

  // 2. If no matches are live, inspect the next upcoming match
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upcomingMatches } = await (sb as any)
    .from("matches")
    .select("id, match_number, match_date, match_time, status")
    .eq("status", "upcoming")
    .order("match_number", { ascending: true })
    .limit(1);

  if (!upcomingMatches || upcomingMatches.length === 0) {
    return [{ matchNumber: 0, status: "upcoming", message: "Tournament complete or no upcoming matches." }];
  }

  const next = upcomingMatches[0];
  const startMs = parseMatchStartMs(next.match_date, next.match_time);
  const nowMs = Date.now();

  // If kickoff is more than 30 minutes away, return clean upcoming message without calling ESPN
  if (!startMs || nowMs < startMs - 30 * 60 * 1000) {
    return [
      {
        matchNumber: next.match_number,
        status: "upcoming",
        message: `Match #${next.match_number} is scheduled for ${next.match_date || "upcoming"} at ${next.match_time || "TBA"}. Polling will activate 30 mins before kickoff.`,
      },
    ];
  }

  // Kickoff is near or passed: sync match to detect toss/start
  const r = await syncMatchCore(next.match_number);
  return [r];
}

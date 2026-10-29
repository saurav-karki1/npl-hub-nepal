/**
 * NPL Hub Nepal — Cloud Live Sync Core Engine
 *
 * Runs seamlessly on Vercel Serverless (via /api/cron/live-sync)
 * without requiring any local laptop process.
 *
 * Primary Data Source: ESPN Cricinfo HTML (__NEXT_DATA__).
 * This endpoint returns HTTP 200 reliably from Vercel datacenter IPs,
 * avoiding the HTTP 403 Forbidden error of the old JSON API.
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

export function mapTeamSlug(name = ""): string {
  const n = String(name).toLowerCase().replace(/\(npl\)/gi, "").trim();
  if (n.includes("lumbini") || n.includes("lion")) return "lumbini-lions";
  if (
    n.includes("sudurpaschim") ||
    n.includes("sudur paschim") ||
    n.includes("paschim") ||
    n.includes("royal")
  )
    return "sudurpaschim-royals";
  if (n.includes("chitwan") || n.includes("rhino")) return "chitwan-rhinos";
  if (n.includes("biratnagar") || n.includes("king")) return "biratnagar-kings";
  if (n.includes("janakpur") || n.includes("bolt")) return "janakpur-bolts";
  if (n.includes("karnali") || n.includes("yak")) return "karnali-yaks";
  if (n.includes("kathmandu") || n.includes("gorkha")) return "kathmandu-gorkhas";
  if (n.includes("pokhara") || n.includes("avenger")) return "pokhara-avengers";
  return n.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export interface SyncMatchResult {
  matchNumber: number;
  status: "live" | "completed" | "upcoming" | "error";
  message: string;
  scoreSummary?: string;
  winner?: string;
}

// ─── ESPN HTML Parser ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchEspnMatchData(espnMatchId: string): Promise<any> {
  const endpoints = [
    `https://www.espncricinfo.com/series/a-1558581/b-${espnMatchId}/ball-by-ball-commentary`,
    `https://www.espncricinfo.com/series/a-1558581/b-${espnMatchId}/full-scorecard`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.espncricinfo.com/",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) continue;

      const html = await res.text();
      const scriptMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
      );
      if (!scriptMatch || !scriptMatch[1]) continue;

      const json = JSON.parse(scriptMatch[1]);
      const d = json.props?.appPageProps?.data;
      if (!d) continue;

      const match = d.match || d.data?.match || {};
      const content = d.content || d.data?.content || {};

      return { match, content };
    } catch {
      // try next endpoint
    }
  }

  return null;
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

    // Skip polling if kickoff is > 45 minutes in future
    if (
      dbMatch?.status === "upcoming" &&
      startMs !== null &&
      nowMs < startMs - 45 * 60 * 1000
    ) {
      return {
        matchNumber,
        status: "upcoming",
        message: `Match #${matchNumber} is scheduled for ${matchDate} at ${matchTime}.`,
      };
    }

    // 2. Fetch ESPN data via HTML __NEXT_DATA__
    const espnData = await fetchEspnMatchData(espnMatchId);

    if (!espnData) {
      return {
        matchNumber,
        status: dbMatch.status,
        message: `Unable to fetch ESPN data for Match #${matchNumber}.`,
      };
    }

    const { match, content } = espnData;
    const matchState = String(match.state || "").toUpperCase();
    const statusText = String(match.statusText || match.status || "");
    const statusTextLower = statusText.toLowerCase();

    const isCompleted =
      matchState === "POST" ||
      match.resultStatus === "COMPLETE" ||
      statusTextLower.includes("won by") ||
      statusTextLower.includes("won the match") ||
      statusTextLower.includes("beat") ||
      statusTextLower.includes("no result") ||
      statusTextLower.includes("abandoned") ||
      statusTextLower.includes("match tied") ||
      statusTextLower.includes("tied");

    // 3. Parse Innings & Scores
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawInnings: any[] = content.innings || [];
    const team1DbSlug = dbMatch.team1_id;
    const team2DbSlug = dbMatch.team2_id;

    let team1Score = { runs: 0, wickets: 0, overs: "0.0" };
    let team2Score = { runs: 0, wickets: 0, overs: "0.0" };
    let hasScoreData = false;

    for (const inn of rawInnings) {
      const innTeamSlug = mapTeamSlug(inn.team?.name || inn.battingTeam?.name || "");
      const score = {
        runs: Number(inn.runs || 0),
        wickets: Number(inn.wickets || 0),
        overs: String(inn.overs || inn.oversActual || "0.0"),
      };

      if (score.runs > 0 || score.wickets > 0 || parseFloat(score.overs) > 0) {
        hasScoreData = true;
      }

      if (innTeamSlug === team1DbSlug) {
        team1Score = score;
      } else if (innTeamSlug === team2DbSlug) {
        team2Score = score;
      } else if (team1Score.runs === 0 && team1Score.overs === "0.0") {
        team1Score = score;
      } else {
        team2Score = score;
      }
    }

    const isLiveMatch =
      matchState === "LIVE" ||
      (!isCompleted && (hasScoreData || (startMs !== null && nowMs >= startMs)));

    if (!isCompleted && !isLiveMatch) {
      return {
        matchNumber,
        status: "upcoming",
        message: `Fixture is scheduled (${match.statusText || "Upcoming"}).`,
      };
    }

    // 4. Parse Batters & Bowlers from Current Innings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentInning = rawInnings.find((i: any) => i.isCurrent);
    if (!currentInning && rawInnings.length > 0) {
      currentInning = rawInnings[rawInnings.length - 1];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batters: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bowlers: any[] = [];

    if (currentInning) {
      // Batters currently at the crease (not out)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeBatsmen = (currentInning.inningBatsmen || []).filter((b: any) => {
        return (
          b.battedType === "yes" &&
          (!b.dismissalText || b.dismissalText?.short === "not out" || b.dismissalText?.short === "batting")
        );
      });

      for (const b of activeBatsmen.length > 0 ? activeBatsmen : (currentInning.inningBatsmen || []).slice(0, 2)) {
        batters.push({
          name: b.player?.longName || b.player?.name || "Batter",
          runs: Number(b.runs || 0),
          balls: Number(b.balls || 0),
          fours: Number(b.fours || 0),
          sixes: Number(b.sixes || 0),
          strikeRate: b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : "0.00",
          isStriker: Boolean(b.isStriker),
        });
      }

      // Bowlers in current innings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentBowlers = (currentInning.inningBowlers || []).slice(-2);
      for (const bw of currentBowlers) {
        bowlers.push({
          name: bw.player?.longName || bw.player?.name || "Bowler",
          overs: String(bw.overs || "0.0"),
          maidens: Number(bw.maidens || 0),
          runs: Number(bw.conceded) || 0,
          wickets: Number(bw.wickets || 0),
          economy: bw.overs
            ? (bw.conceded / Math.max(0.1, parseFloat(bw.overs))).toFixed(2)
            : "0.00",
        });
      }
    }

    // 5. Result Statement & Winner Logic (Innings Break, Chases, Results)
    let winnerName: string | undefined = undefined;
    let winMargin: string | undefined = undefined;
    let winType: "runs" | "wickets" | "super_over" | "no_result" | "abandoned" = "wickets";
    let winnerTeamSlug: string | undefined = undefined;
    let resultStatement = "";

    const inn1 = rawInnings[0];
    const inn2 = rawInnings[1];
    const isInn1Finished = Boolean(
      inn1 && (Number(inn1.wickets) >= 10 || parseFloat(inn1.overs) >= 20)
    );
    const isInn2Started = Boolean(
      inn2 && (Number(inn2.runs) > 0 || parseFloat(inn2.overs) > 0 || (inn2.inningBatsmen && inn2.inningBatsmen.length > 0))
    );
    const isInningsBreak = isLiveMatch && isInn1Finished && !isInn2Started;

    if (isCompleted) {
      resultStatement = match.statusText || match.status || "Match Completed";
      const wonMatch = resultStatement.match(/^(.*?)\s+won by\s+(.*)$/i);
      if (wonMatch) {
        winnerName = wonMatch[1].trim();
        winMargin = wonMatch[2].trim();
        winType = winMargin.toLowerCase().includes("run") ? "runs" : "wickets";
        winnerTeamSlug = mapTeamSlug(winnerName);
      } else if (match.winnerTeamId && Array.isArray(match.teams)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wTeam = match.teams.find((t: any) => t.team?.id === match.winnerTeamId || t.id === match.winnerTeamId);
        if (wTeam) {
          winnerName = wTeam.team?.name || wTeam.name;
          winnerTeamSlug = mapTeamSlug(winnerName);
        }
      }
    } else if (isInningsBreak) {
      const inn1TeamName = inn1?.team?.name || "Kathmandu Gorkhas";
      const targetRuns = Number(inn1.runs) + 1;
      const chasingName = inn1TeamName.toLowerCase().includes("kathmandu") ? "Janakpur Bolts" : "Kathmandu Gorkhas";
      resultStatement = `Innings Break: ${inn1TeamName} ${inn1.runs}/${inn1.wickets} (${inn1.overs} ov) · ${chasingName} need ${targetRuns} runs to win`;
    } else if (isInn2Started) {
      const inn2TeamName = inn2?.team?.name || "Janakpur Bolts";
      const targetRuns = Number(inn1.runs) + 1;
      const needed = Math.max(0, targetRuns - Number(inn2.runs));
      const oversVal = parseFloat(inn2.overs) || 0;
      const ballsBowled = Math.floor(oversVal) * 6 + Math.round((oversVal % 1) * 10);
      const ballsRemaining = Math.max(0, 120 - ballsBowled);
      resultStatement = `${inn2TeamName} need ${needed} runs in ${ballsRemaining} balls to win (${inn2.runs}/${inn2.wickets} in ${inn2.overs} ov)`;
    } else {
      // Live 1st innings state
      const activeScore = team2Score.runs > 0 || parseFloat(team2Score.overs) > 0 ? team2Score : team1Score;
      resultStatement = statusText
        ? `${statusText} (${activeScore.runs}/${activeScore.wickets} in ${activeScore.overs} ov)`
        : `${activeScore.runs}/${activeScore.wickets} (${activeScore.overs} ov)`;
    }

    const targetStatus = isCompleted ? "completed" : "live";
    const scores = {
      team1: team1Score,
      team2: team2Score,
      batters: batters.length > 0 ? batters : undefined,
      bowlers: bowlers.length > 0 ? bowlers : undefined,
    };

    // 6. Update matches table in Supabase
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

    // 7. Sync ball-by-ball commentary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comments: any[] = content.comments || [];
    if (comments.length > 0) {
      for (const c of comments) {
        if (c.oversActual == null) continue;
        const overNum = parseFloat(c.oversActual) || 0;
        const overInt = Math.floor(overNum);
        const ballInt = Math.round((overNum - overInt) * 10);
        const innNum = c.inningNumber || 1;
        const eventId = `espn_${espnMatchId}_inn${innNum}_${String(c.oversActual)}`;

        let bowlerName = "";
        let batterName = "";
        if (c.title && c.title.includes(" to ")) {
          const parts = c.title.split(" to ");
          bowlerName = parts[0]?.trim() || "";
          batterName = parts[1]?.trim() || "";
        }

        const isWicket = Boolean(c.isWicket);
        const isSix = Boolean(c.isSix);
        const isFour = Boolean(c.isFour);
        const runs = Number(c.totalRuns) || 0;

        let commentaryText = c.dismissalText?.commentary || c.dismissalText?.long || "";
        if (!commentaryText) {
          if (isWicket) commentaryText = `OUT! ${batterName || "The batter"} is dismissed${bowlerName ? ` by ${bowlerName}` : ""}.`;
          else if (isSix) commentaryText = `SIX! ${batterName || "The batter"} smashes a maximum${bowlerName ? ` off ${bowlerName}` : ""}!`;
          else if (isFour) commentaryText = `FOUR! ${batterName || "The batter"} hits a boundary${bowlerName ? ` off ${bowlerName}` : ""}.`;
          else if (runs === 1) commentaryText = `1 run. ${batterName || "The batter"} rotates the strike${bowlerName ? ` off ${bowlerName}` : ""}.`;
          else if (runs > 1) commentaryText = `${runs} runs scored${bowlerName ? ` off ${bowlerName}` : ""}.`;
          else commentaryText = `Dot ball.${bowlerName ? ` Good delivery by ${bowlerName}.` : ""}`;
        }

        const headline = isWicket ? "WICKET!" : isSix ? "SIX!" : isFour ? "FOUR!" : undefined;

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
              headline,
              runs,
              is_wicket: isWicket,
              is_boundary: Boolean(isFour || isSix),
              is_six: isSix,
              batter_name: batterName || undefined,
              bowler_name: bowlerName || undefined,
              provider: "manual",
            },
            { onConflict: "match_id,external_event_id" }
          );
      }
    } else if (currentInning && Array.isArray(currentInning.inningOvers)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const overGroup of currentInning.inningOvers as any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const ball of (overGroup.balls || []) as any[]) {
          if (ball.oversActual == null) continue;
          const overNum = parseFloat(ball.oversActual) || 0;
          const overInt = Math.floor(overNum);
          const ballInt = Math.round((overNum - overInt) * 10);
          const innNum = currentInning.inningNumber || 1;
          const eventId = `espn_${espnMatchId}_inn${innNum}_${String(ball.oversActual)}`;

          const batterName =
            ball.batsmanStatText?.long?.replace(/\s*\d+.*$/, "").trim() ||
            ball.batsmanStatText?.short?.replace(/\s*\d+.*$/, "").trim() ||
            batters[0]?.name ||
            "Batter";
          const bowlerName =
            ball.bowlerStatText?.long?.replace(/\s*\d+.*$/, "").trim() ||
            ball.bowlerStatText?.short?.replace(/\s*\d+.*$/, "").trim() ||
            bowlers[0]?.name ||
            "Bowler";

          const runs = Number(ball.totalRuns || 0);
          const isWicket = Boolean(ball.isWicket);
          const isFour = Boolean(ball.isFour);
          const isSix = Boolean(ball.isSix);

          let commentaryText = ball.dismissalText?.long || ball.dismissalText?.short || "";
          if (!commentaryText) {
            if (isWicket) commentaryText = `OUT! ${batterName} is dismissed off ${bowlerName}.`;
            else if (isSix) commentaryText = `SIX! ${batterName} smashes a maximum off ${bowlerName}!`;
            else if (isFour) commentaryText = `FOUR! ${batterName} strikes a boundary off ${bowlerName}.`;
            else if (runs === 1) commentaryText = `1 run. ${batterName} rotates the strike off ${bowlerName}.`;
            else if (runs > 1) commentaryText = `${runs} runs scored off ${bowlerName}.`;
            else commentaryText = `Dot ball. Good delivery by ${bowlerName}.`;
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
                is_six: isSix,
                batter_name: batterName,
                bowler_name: bowlerName,
                provider: "manual",
              },
              { onConflict: "match_id,external_event_id" }
            );
        }
      }
    }

    // 8. Standings recalculation when completed
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
      scoreSummary: `${team1Score.runs}/${team1Score.wickets} (${team1Score.overs} ov) vs ${team2Score.runs}/${team2Score.wickets} (${team2Score.overs} ov)`,
      winner: winnerName,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[CRON SYNC M${matchNumber}] Error:`, errorMsg);
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

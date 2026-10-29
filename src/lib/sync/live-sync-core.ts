/**
 * NPL Hub Nepal — Cloud Live Sync Core Engine
 *
 * Runs seamlessly on Vercel Serverless (via /api/cron/live-sync)
 * without requiring any local laptop process.
 *
 * Primary Data Source: ESPN Official Public REST API:
 * - https://site.api.espn.com/apis/site/v2/sports/cricket/1558581/scoreboard
 * - https://site.api.espn.com/apis/site/v2/sports/cricket/1558581/playbyplay?event={id}&limit=200
 *
 * This open API is 100% accessible from all cloud datacenters (Vercel, Render)
 * with zero Cloudflare bot challenges or 403 Forbidden blocks.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { recalculateAndPersistStandings } from "@/lib/standings/calculator";

const ESPN_SERIES_ID = "1558581";

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

    // 2. Fetch Scoreboard from ESPN Public REST API
    const sbUrl = `https://site.api.espn.com/apis/site/v2/sports/cricket/${ESPN_SERIES_ID}/scoreboard`;
    const sbRes = await fetch(sbUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });

    if (!sbRes.ok) {
      return {
        matchNumber,
        status: dbMatch.status,
        message: `ESPN Scoreboard API returned ${sbRes.status}`,
      };
    }

    const sbData = await sbRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = (sbData.events || []).find((e: any) => e.id === espnMatchId);
    if (!event) {
      return {
        matchNumber,
        status: dbMatch.status,
        message: `Match #${matchNumber} (event ${espnMatchId}) not active in ESPN feed.`,
      };
    }

    const comp = event.competitions?.[0];
    const state = event.status?.type?.state; // "in", "post", "pre"
    const isCompleted = state === "post";
    const isLive = state === "in";
    const statusSummary = comp?.status?.summary || event.status?.type?.description || "";

    if (!isCompleted && !isLive) {
      return {
        matchNumber,
        status: "upcoming",
        message: `Fixture is scheduled (${statusSummary || "Upcoming"}).`,
      };
    }

    // 3. Parse Competitors / Linescores
    let team1Score = { runs: 0, wickets: 0, overs: "0.0" };
    let team2Score = { runs: 0, wickets: 0, overs: "0.0" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const c of (comp?.competitors || []) as any[]) {
      const slug = mapTeamSlug(c.team?.name);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ls = (c.linescores || []) as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeInn = ls.find((l: any) => l.isBatting) || ls[ls.length - 1];

      let parsed = { runs: 0, wickets: 0, overs: "0.0" };
      if (activeInn) {
        parsed = {
          runs: Number(activeInn.runs) || 0,
          wickets: Number(activeInn.wickets) || 0,
          overs: String(activeInn.overs || "0.0"),
        };
      } else if (c.score) {
        const parts = String(c.score).split("/");
        const runs = parseInt(parts[0], 10) || 0;
        const wickets = parts[1] ? parseInt(parts[1], 10) : (String(c.score).includes("all out") ? 10 : 0);
        const ovMatch = String(c.score).match(/\(([0-9.]+)\//);
        const overs = ovMatch ? ovMatch[1] : "0.0";
        parsed = { runs, wickets, overs };
      }

      if (slug === dbMatch.team1_id) {
        team1Score = parsed;
      } else if (slug === dbMatch.team2_id) {
        team2Score = parsed;
      } else if (team1Score.runs === 0 && team1Score.overs === "0.0") {
        team1Score = parsed;
      } else {
        team2Score = parsed;
      }
    }

    // 4. Fetch Playbyplay for active batters, bowlers, and ball-by-ball commentary
    const pbpUrl = `https://site.api.espn.com/apis/site/v2/sports/cricket/${ESPN_SERIES_ID}/playbyplay?event=${espnMatchId}&limit=200`;
    const pbpRes = await fetch(pbpUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batters: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bowlers: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentaryRows: any[] = [];

    if (pbpRes.ok) {
      const pbpData = await pbpRes.json();
      const items = pbpData.commentary?.items || pbpData.commentary || [];

      if (items.length > 0) {
        const latest = items[items.length - 1];

        // Active Striker
        if (latest.batsman?.athlete?.displayName) {
          batters.push({
            name: latest.batsman.athlete.displayName,
            runs: Number(latest.batsman.runs) || 0,
            balls: Number(latest.batsman.faced) || 0,
            fours: Number(latest.batsman.fours) || 0,
            sixes: Number(latest.batsman.sixes) || 0,
            strikeRate: latest.batsman.faced
              ? ((latest.batsman.runs / latest.batsman.faced) * 100).toFixed(1)
              : "0.0",
            isStriker: true,
          });
        }
        // Non-striker
        if (latest.otherBatsman?.athlete?.displayName) {
          batters.push({
            name: latest.otherBatsman.athlete.displayName,
            runs: Number(latest.otherBatsman.runs) || 0,
            balls: Number(latest.otherBatsman.faced) || 0,
            fours: Number(latest.otherBatsman.fours) || 0,
            sixes: Number(latest.otherBatsman.sixes) || 0,
            strikeRate: latest.otherBatsman.faced
              ? ((latest.otherBatsman.runs / latest.otherBatsman.faced) * 100).toFixed(1)
              : "0.0",
            isStriker: false,
          });
        }

        // Active bowler
        if (latest.bowler?.athlete?.displayName) {
          bowlers.push({
            name: latest.bowler.athlete.displayName,
            overs: String(latest.bowler.overs || "0.0"),
            maidens: Number(latest.bowler.maidens) || 0,
            runs: Number(latest.bowler.conceded) || 0,
            wickets: Number(latest.bowler.wickets) || 0,
            economy: latest.bowler.overs
              ? (latest.bowler.conceded / Math.max(0.1, parseFloat(latest.bowler.overs))).toFixed(2)
              : "0.00",
          });
        }
        // Other bowler
        if (latest.otherBowler?.athlete?.displayName) {
          bowlers.push({
            name: latest.otherBowler.athlete.displayName,
            overs: String(latest.otherBowler.overs || "0.0"),
            maidens: Number(latest.otherBowler.maidens) || 0,
            runs: Number(latest.otherBowler.conceded) || 0,
            wickets: Number(latest.otherBowler.wickets) || 0,
            economy: latest.otherBowler.overs
              ? (latest.otherBowler.conceded / Math.max(0.1, parseFloat(latest.otherBowler.overs))).toFixed(2)
              : "0.00",
          });
        }

        // Parse commentary balls
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const it of items as any[]) {
          if (!it.over?.actual && it.over?.actual !== 0) continue;
          const overNum = parseFloat(it.over.actual);
          const overInt = Math.floor(overNum);
          const ballInt = Math.round((overNum - overInt) * 10);
          const innNum = it.period || 1;
          const eventId = `espn_api_${espnMatchId}_inn${innNum}_${it.over.actual}`;

          const runs = Number(it.scoreValue) || 0;
          const isWicket = Boolean(it.dismissal?.dismissal || it.playType?.description === "wicket");
          const isSix = runs === 6;
          const isFour = runs === 4;

          const batterName = it.batsman?.athlete?.displayName || "";
          const bowlerName = it.bowler?.athlete?.displayName || "";

          let commentaryText = it.dismissal?.text || it.shortText || "";
          if (!commentaryText) {
            if (isWicket) commentaryText = `OUT! ${batterName} is dismissed by ${bowlerName}.`;
            else if (isSix) commentaryText = `SIX! ${batterName} smashes a maximum off ${bowlerName}!`;
            else if (isFour) commentaryText = `FOUR! ${batterName} finds the boundary off ${bowlerName}.`;
            else if (runs === 1) commentaryText = `1 run. ${batterName} rotates the strike.`;
            else if (runs > 1) commentaryText = `${runs} runs scored off ${bowlerName}.`;
            else commentaryText = `Dot ball. Good delivery by ${bowlerName}.`;
          }

          const headline = isWicket ? "WICKET!" : isSix ? "SIX!" : isFour ? "FOUR!" : undefined;

          commentaryRows.push({
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
          });
        }
      }
    }

    // 5. Result Statement & Winner Logic
    let winnerName: string | undefined = undefined;
    let winMargin: string | undefined = undefined;
    let winType: "runs" | "wickets" | "super_over" | "no_result" | "abandoned" = "wickets";
    let winnerTeamSlug: string | undefined = undefined;
    let resultStatement = statusSummary;

    if (isCompleted) {
      resultStatement = statusSummary || "Match Completed";
      const wonMatch = resultStatement.match(/^(.*?)\s+won by\s+(.*)$/i);
      if (wonMatch) {
        winnerName = wonMatch[1].replace(/\(NPL\)/gi, "").trim();
        winMargin = wonMatch[2]?.trim() || "";
        winType = (winMargin ?? "").toLowerCase().includes("run") ? "runs" : "wickets";
        winnerTeamSlug = mapTeamSlug(winnerName);
      }
    } else {
      const activeScore =
        team1Score.runs > 0 || parseFloat(team1Score.overs) > 0 ? team1Score : team2Score;
      resultStatement = statusSummary || `${activeScore.runs}/${activeScore.wickets} (${activeScore.overs} ov)`;
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

    // 7. Upsert recent commentary
    if (commentaryRows.length > 0) {
      const recent = commentaryRows.slice(-50);
      for (const row of recent) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (sb as any)
          .from("match_commentary")
          .upsert(row, { onConflict: "match_id,external_event_id" });
      }
    }

    // 8. Standings recalculation when completed
    if (isCompleted && dbMatch.status !== "completed") {
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
  const r = await syncMatchCore(next.match_number);
  return [r];
}

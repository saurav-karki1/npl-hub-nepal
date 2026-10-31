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
    // 1. Fetch Scoreboard from ESPN Public REST API first (free open REST API, zero DB egress)
    const sbUrl = `https://site.api.espn.com/apis/site/v2/sports/cricket/${ESPN_SERIES_ID}/scoreboard`;
    const sbRes = await fetch(sbUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });

    if (!sbRes.ok) {
      return {
        matchNumber,
        status: "upcoming",
        message: `ESPN Scoreboard API returned ${sbRes.status}`,
      };
    }

    const sbData = await sbRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = (sbData.events || []).find((e: any) => e.id === espnMatchId);
    if (!event) {
      return {
        matchNumber,
        status: "upcoming",
        message: `Match #${matchNumber} (event ${espnMatchId}) not active in ESPN feed.`,
      };
    }

    const comp = event.competitions?.[0];
    const state = event.status?.type?.state; // "in", "post", "pre"
    let isCompleted = state === "post";
    const isLive = state === "in";
    const statusSummary = comp?.status?.summary || event.status?.type?.description || "";

    if (!isCompleted && !isLive) {
      return {
        matchNumber,
        status: "upcoming",
        message: `Fixture is scheduled (${statusSummary || "Upcoming"}).`,
      };
    }

    // 2. Fetch match metadata from Supabase ONLY when match is active or completed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbMatch, error: dbErr } = await (sb as any)
      .from("matches")
      .select("id, slug, match_date, match_time, status, team1_id, team2_id")
      .eq("id", matchIdStr)
      .single();

    if (dbErr || !dbMatch) {
      return { matchNumber, status: "error", message: `Match not found: ${dbErr?.message}` };
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
    const pbpUrl = `https://site.api.espn.com/apis/site/v2/sports/cricket/${ESPN_SERIES_ID}/playbyplay?event=${espnMatchId}&limit=500`;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let latestInn: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let latestItem: any = null;

    if (pbpRes.ok) {
      const pbpData = await pbpRes.json();
      const items = pbpData.commentary?.items || pbpData.commentary || [];

      if (items.length > 0) {
        latestItem = items[items.length - 1];
        latestInn = latestItem.innings;

        // Active Striker
        if (latestItem.batsman?.athlete?.displayName) {
          batters.push({
            name: latestItem.batsman.athlete.displayName,
            runs: Number(latestItem.batsman.runs) || 0,
            balls: Number(latestItem.batsman.faced) || 0,
            fours: Number(latestItem.batsman.fours) || 0,
            sixes: Number(latestItem.batsman.sixes) || 0,
            strikeRate: latestItem.batsman.faced
              ? ((latestItem.batsman.runs / latestItem.batsman.faced) * 100).toFixed(1)
              : "0.0",
            isStriker: true,
          });
        }
        // Non-striker
        if (latestItem.otherBatsman?.athlete?.displayName) {
          batters.push({
            name: latestItem.otherBatsman.athlete.displayName,
            runs: Number(latestItem.otherBatsman.runs) || 0,
            balls: Number(latestItem.otherBatsman.faced) || 0,
            fours: Number(latestItem.otherBatsman.fours) || 0,
            sixes: Number(latestItem.otherBatsman.sixes) || 0,
            strikeRate: latestItem.otherBatsman.faced
              ? ((latestItem.otherBatsman.runs / latestItem.otherBatsman.faced) * 100).toFixed(1)
              : "0.0",
            isStriker: false,
          });
        }

        // Active bowler
        if (latestItem.bowler?.athlete?.displayName) {
          bowlers.push({
            name: latestItem.bowler.athlete.displayName,
            overs: String(latestItem.bowler.overs || "0.0"),
            maidens: Number(latestItem.bowler.maidens) || 0,
            runs: Number(latestItem.bowler.conceded) || 0,
            wickets: Number(latestItem.bowler.wickets) || 0,
            economy: latestItem.bowler.overs
              ? (latestItem.bowler.conceded / Math.max(0.1, parseFloat(latestItem.bowler.overs))).toFixed(2)
              : "0.00",
          });
        }
        // Other bowler
        if (latestItem.otherBowler?.athlete?.displayName) {
          bowlers.push({
            name: latestItem.otherBowler.athlete.displayName,
            overs: String(latestItem.otherBowler.overs || "0.0"),
            maidens: Number(latestItem.otherBowler.maidens) || 0,
            runs: Number(latestItem.otherBowler.conceded) || 0,
            wickets: Number(latestItem.otherBowler.wickets) || 0,
            economy: latestItem.otherBowler.overs
              ? (latestItem.otherBowler.conceded / Math.max(0.1, parseFloat(latestItem.otherBowler.overs))).toFixed(2)
              : "0.00",
          });
        }

        // Parse commentary balls
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const it of items as any[]) {
          if (!it.over?.actual && it.over?.actual !== 0) continue;
          const overNum = parseFloat(it.over.actual);
          const overInt = Math.floor(overNum);
          const ballInt = it.over?.ball ? Number(it.over.ball) : Math.round((overNum - overInt) * 10);
          const innNum = it.period || 1;
          const sequence = it.sequence || it.id || `${innNum}_${it.over.actual}_${ballInt}`;
          const eventId = `espn_${espnMatchId}_seq_${sequence}`;

          const runs = Number(it.scoreValue) || 0;
          const isWicket = Boolean(it.dismissal?.dismissal || it.playType?.description === "wicket");
          const isSix = runs === 6;
          const isFour = runs === 4;

          const batterName = it.batsman?.athlete?.displayName || "";
          const bowlerName = it.bowler?.athlete?.displayName || "";

          let commentaryText = "";
          if (isWicket && it.dismissal?.text) {
            commentaryText = `${it.shortText || "OUT"}. ${it.dismissal.text}`;
          } else if (it.shortText) {
            commentaryText = it.shortText;
          } else if (isWicket) {
            commentaryText = `OUT! ${batterName} is dismissed by ${bowlerName}.`;
          } else if (isSix) {
            commentaryText = `SIX! ${batterName} hits a six off ${bowlerName}.`;
          } else if (isFour) {
            commentaryText = `FOUR! ${batterName} finds the boundary off ${bowlerName}.`;
          } else if (runs > 0) {
            commentaryText = `${runs} run${runs > 1 ? "s" : ""} scored off ${bowlerName}.`;
          } else {
            commentaryText = `Dot ball. Good delivery by ${bowlerName}.`;
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

    // 5. Completion & Winner Determination
    isCompleted = state === "post";
    const summaryLower = (statusSummary || "").toLowerCase();

    if (
      summaryLower.includes("won by") ||
      summaryLower.includes("beat") ||
      summaryLower.includes("tied") ||
      summaryLower.includes("no result") ||
      summaryLower.includes("match drawn")
    ) {
      isCompleted = true;
    }

    // Check cricket completion rules in 2nd innings
    if (!isCompleted && latestInn && latestInn.number === 2 && latestInn.target > 0) {
      if (latestInn.runs >= latestInn.target) {
        isCompleted = true;
      } else if (latestInn.wickets >= 10 || (latestInn.balls >= 120)) {
        isCompleted = true;
      }
    }

    // Check competitor score string target (e.g. "116/2 (17.2/20 ov, target 116)")
    if (!isCompleted) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const c of (comp?.competitors || []) as any[]) {
        const sc = String(c.score || "");
        const targetMatch = sc.match(/target\s+(\d+)/i);
        if (targetMatch) {
          const target = parseInt(targetMatch[1], 10);
          const runs = parseInt(sc.split("/")[0], 10);
          if (runs >= target && target > 0) {
            isCompleted = true;
            break;
          }
        }
      }
    }

    let winnerName: string | undefined = undefined;
    let winMargin: string | undefined = undefined;
    let winType: "runs" | "wickets" | "super_over" | "no_result" | "abandoned" = "wickets";
    let winnerTeamSlug: string | undefined = undefined;
    let resultStatement = statusSummary;

    if (isCompleted) {
      if (statusSummary && (summaryLower.includes("won by") || summaryLower.includes("beat"))) {
        resultStatement = statusSummary;
        const wonMatch = statusSummary.match(/^(.+?)\s+(?:won by|beat)\s+(.+)$/i);
        if (wonMatch) {
          winnerName = wonMatch[1].replace(/\(NPL\)/gi, "").trim();
          winnerTeamSlug = mapTeamSlug(winnerName);
          const marginMatch = wonMatch[2].match(/(\d+)\s+(wicket|run)/i);
          if (marginMatch) {
            winMargin = marginMatch[1];
            winType = marginMatch[2].toLowerCase() === "wicket" ? "wickets" : "runs";
          }
        }
      } else if (latestInn && latestInn.number === 2 && latestInn.target > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chasingTeamName = latestItem?.team?.name?.replace(/\(NPL\)/gi, "").trim() ||
          (comp?.competitors || []).find((c: any) => c.linescores?.some((l: any) => l.period === 2))?.team?.name?.replace(/\(NPL\)/gi, "").trim();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defendingTeamName = (comp?.competitors || []).find((c: any) => c.team?.name?.replace(/\(NPL\)/gi, "").trim() !== chasingTeamName)?.team?.name?.replace(/\(NPL\)/gi, "").trim();

        if (latestInn.runs >= latestInn.target) {
          const wicketsLeft = 10 - (latestInn.wickets || 0);
          const ballsRem = latestInn.remainingBalls || Math.max(0, 120 - (latestInn.balls || 0));
          winnerName = chasingTeamName;
          winnerTeamSlug = mapTeamSlug(winnerName);
          winMargin = String(wicketsLeft);
          winType = "wickets";
          resultStatement = `${winnerName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}${ballsRem > 0 ? ` (with ${ballsRem} balls remaining)` : ""}`;
        } else if (latestInn.wickets >= 10 || (latestInn.balls >= 120)) {
          const runDiff = (latestInn.target - 1) - latestInn.runs;
          if (runDiff > 0) {
            winnerName = defendingTeamName;
            winnerTeamSlug = mapTeamSlug(winnerName);
            winMargin = String(runDiff);
            winType = "runs";
            resultStatement = `${winnerName} won by ${runDiff} run${runDiff !== 1 ? "s" : ""}`;
          } else if (runDiff === 0) {
            resultStatement = "Match Tied";
          }
        }
      } else {
        resultStatement = statusSummary || "Match Completed";
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

    // 7. Upsert recent commentary in fast batch
    if (commentaryRows.length > 0) {
      const recent = commentaryRows.slice(-100);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb as any)
        .from("match_commentary")
        .upsert(recent, { onConflict: "match_id,external_event_id" });
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

  const recordHeartbeat = async (resList: SyncMatchResult[]) => {
    try {
      const now = new Date().toISOString();
      const hasError = resList.some((r) => r.status === "error");
      const errMsgs = resList.filter((r) => r.status === "error").map((r) => r.message).join("; ");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb as any).from("agent_config").upsert({
        id: "live-sync-worker",
        enabled: true,
        interval_hours: 1,
        sources: {
          worker: "cloud-live-sync",
          status: hasError ? "error" : "running",
          lastPollAt: now,
          lastSyncAt: now,
          syncCount: resList.length,
          lastError: hasError ? errMsgs : null,
          syncedMatches: resList.map((r) => r.matchNumber),
        },
        last_run_at: now,
        updated_at: now,
      });
    } catch {
      // Non-blocking telemetry
    }
  };

  // If matches are currently live, sync them immediately
  if (liveMatches && liveMatches.length > 0) {
    for (const m of liveMatches) {
      const r = await syncMatchCore(m.match_number);
      results.push(r);
    }
    await recordHeartbeat(results);
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
    const endRes: SyncMatchResult[] = [
      { matchNumber: 0, status: "upcoming", message: "Tournament complete or no upcoming matches." },
    ];
    await recordHeartbeat(endRes);
    return endRes;
  }

  const next = upcomingMatches[0];
  const r = await syncMatchCore(next.match_number);
  const out = [r];
  await recordHeartbeat(out);
  return out;
}

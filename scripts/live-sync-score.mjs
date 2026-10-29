import { createClient } from "@supabase/supabase-js";
import { recalculateStandings } from "./recalculate-standings.mjs";
import { syncCompletedMatchStats } from "./sync-season3-stats.mjs";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ESPN_SERIES_ID = "1558581";

/**
 * Map any team name variation to our standard database team slug.
 */
export function mapTeamSlug(name = "") {
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

/**
 * Sync a single match by match number (1 to 32) using ESPN's official REST API.
 * Uses playbyplay for real-time ball-by-ball precision and scoreboard for match status.
 */
export async function syncMatch(matchNumber = 1) {
  const espnMatchId = String(1558581 + matchNumber);
  const matchIdStr = `match-${String(matchNumber).padStart(2, "0")}`;

  try {
    // 1. Fetch match record from Supabase
    const { data: dbMatch, error: dbErr } = await sb
      .from("matches")
      .select("id, slug, match_date, match_time, status, team1_id, team2_id, scores")
      .eq("id", matchIdStr)
      .single();

    if (dbErr || !dbMatch) {
      console.error(`[SYNC M${matchNumber}] Match not found in DB:`, dbErr?.message);
      return false;
    }

    // 2. Fetch Scoreboard from ESPN REST API
    const sbUrl = `https://site.api.espn.com/apis/site/v2/sports/cricket/${ESPN_SERIES_ID}/scoreboard`;
    const sbRes = await fetch(sbUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!sbRes.ok) {
      console.error(`[SYNC M${matchNumber}] Scoreboard API returned ${sbRes.status}`);
      return false;
    }

    const sbData = await sbRes.json();
    const event = sbData.events?.find((e) => e.id === espnMatchId);
    if (!event) {
      console.log(`[SYNC M${matchNumber}] Event ${espnMatchId} not in scoreboard feed.`);
      return false;
    }

    const comp = event.competitions?.[0];
    const state = event.status?.type?.state; // "in", "post", "pre"
    const isCompleted = state === "post";
    const isLive = state === "in";
    const statusSummary = comp?.status?.summary || event.status?.type?.description || "";

    if (!isCompleted && !isLive) {
      console.log(`[SYNC M${matchNumber}] Scheduled/Upcoming (state=${state}, summary="${statusSummary}"). Skipping.`);
      return true;
    }

    // 3. Initial Baseline Scores from Scoreboard
    let team1Score = { runs: 0, wickets: 0, overs: "0.0" };
    let team2Score = { runs: 0, wickets: 0, overs: "0.0" };

    const competitors = comp?.competitors || [];
    for (const c of competitors) {
      const slug = mapTeamSlug(c.team?.name);
      const ls = c.linescores || [];
      const activeInn = ls.find((l) => l.isBatting) || ls[ls.length - 1];

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
      }
    }

    // 4. Fetch Real-Time Play-by-Play (updates with EVERY ball)
    const pbpUrl = `https://site.api.espn.com/apis/site/v2/sports/cricket/${ESPN_SERIES_ID}/playbyplay?event=${espnMatchId}&limit=200`;
    const pbpRes = await fetch(pbpUrl, { headers: { "User-Agent": "Mozilla/5.0" } });

    let activeBatters = [];
    let activeBowlers = [];
    let commentaryRows = [];
    let liveChaseStatement = statusSummary;

    if (pbpRes.ok) {
      const pbpData = await pbpRes.json();
      const items = pbpData.commentary?.items || pbpData.commentary || [];

      if (items.length > 0) {
        const latest = items[items.length - 1];
        const latestInn = latest.innings;

        // Override live score with playbyplay's ball-by-ball precision
        if (latestInn && latest.team) {
          const battingTeamSlug = mapTeamSlug(latest.team.name || latest.team.displayName);
          const liveScore = {
            runs: Number(latestInn.runs || 0),
            wickets: Number(latestInn.wickets || 0),
            overs: String(latest.over?.actual || "0.0"),
          };

          if (battingTeamSlug === dbMatch.team1_id) {
            team1Score = liveScore;
          } else if (battingTeamSlug === dbMatch.team2_id) {
            team2Score = liveScore;
          }

          // Build dynamic chase summary if Innings 2 is underway
          if (latestInn.number === 2 && latestInn.remainingRuns != null) {
            const chasingTeam = battingTeamSlug === dbMatch.team1_id ? "Janakpur Bolts" : "Kathmandu Gorkhas";
            liveChaseStatement = `${chasingTeam} need ${latestInn.remainingRuns} runs in ${latestInn.remainingBalls || 0} balls to win (Req. RR: ${latestInn.requiredRunRate || "—"})`;
          }
        }

        // Active Striker
        if (latest.batsman?.athlete?.displayName) {
          activeBatters.push({
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
          activeBatters.push({
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
          activeBowlers.push({
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
          activeBowlers.push({
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
        for (const it of items) {
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
    let winnerName = undefined;
    let winMargin = undefined;
    let winType = undefined;
    let winnerTeamSlug = undefined;
    let resultStatement = liveChaseStatement;

    if (isCompleted) {
      resultStatement = statusSummary || "Match Completed";
      const wonMatch = resultStatement.match(/^(.*?)\s+won by\s+(.*)$/i);
      if (wonMatch) {
        winnerName = wonMatch[1].replace(/\(NPL\)/gi, "").trim();
        winMargin = wonMatch[2]?.trim() || "";
        winType = (winMargin || "").toLowerCase().includes("run") ? "runs" : "wickets";
        winnerTeamSlug = mapTeamSlug(winnerName);
      }
    }

    // 6. Update matches table in Supabase
    const targetStatus = isCompleted ? "completed" : "live";
    const scoresPayload = {
      team1: team1Score,
      team2: team2Score,
      batters: activeBatters.length > 0 ? activeBatters : undefined,
      bowlers: activeBowlers.length > 0 ? activeBowlers : undefined,
    };

    const updatePayload = {
      status: targetStatus,
      scores: scoresPayload,
      result_statement: resultStatement,
    };

    if (isCompleted) {
      updatePayload.result = resultStatement;
      updatePayload.winner_name = winnerName;
      updatePayload.winner_team_id = winnerTeamSlug;
      updatePayload.win_margin = winMargin;
      updatePayload.win_type = winType;
    }

    const { error: updateErr } = await sb
      .from("matches")
      .update(updatePayload)
      .eq("id", matchIdStr);

    if (updateErr) {
      console.error(`[SYNC M${matchNumber}] DB update error:`, updateErr.message);
    } else {
      const t1Str = `${team1Score.runs}/${team1Score.wickets} (${team1Score.overs} ov)`;
      const t2Str = `${team2Score.runs}/${team2Score.wickets} (${team2Score.overs} ov)`;
      console.log(
        `[SYNC ${new Date().toLocaleTimeString()}] M${matchNumber} [${targetStatus.toUpperCase()}] T1: ${t1Str} | T2: ${t2Str} | ${resultStatement}`
      );
    }

    // 7. Upsert commentary balls
    if (commentaryRows.length > 0) {
      const recentToSave = commentaryRows.slice(-50);
      let commCount = 0;
      for (const row of recentToSave) {
        const { error: cErr } = await sb
          .from("match_commentary")
          .upsert(row, { onConflict: "match_id,external_event_id" });
        if (!cErr) commCount++;
      }
      if (commCount > 0) {
        console.log(`[SYNC M${matchNumber}] Commentary: ${commCount} balls upserted.`);
      }
    }

    // 8. Recalculate standings and stats when match completes
    if (isCompleted && dbMatch.status !== "completed") {
      try {
        await recalculateStandings("season-3");
        await syncCompletedMatchStats();
        console.log(`[SYNC M${matchNumber}] Tournament standings & stats recalculated.`);
      } catch (stErr) {
        console.error(`[SYNC M${matchNumber}] Standings error:`, stErr.message);
      }
    }

    return true;
  } catch (err) {
    console.error(`[SYNC M${matchNumber}] Unexpected error:`, err.message);
    return false;
  }
}

// Continuous loop for background worker
async function runLoop() {
  console.log("[LIVE SYNC] Daemon initialized with ESPN REST API. Polling active matches every 15s...");
  while (true) {
    try {
      const { data: liveMatches } = await sb
        .from("matches")
        .select("id, match_number, status")
        .eq("status", "live");

      let matchesToSync =
        liveMatches && liveMatches.length > 0
          ? liveMatches.map((m) => m.match_number)
          : [];

      // Also check next upcoming match to auto-detect start
      const { data: upcomingMatches } = await sb
        .from("matches")
        .select("id, match_number, status")
        .eq("status", "upcoming")
        .order("match_number", { ascending: true })
        .limit(1);

      if (upcomingMatches && upcomingMatches.length > 0) {
        const nextNum = upcomingMatches[0].match_number;
        if (!matchesToSync.includes(nextNum)) {
          matchesToSync.push(nextNum);
        }
      }

      for (const mNum of matchesToSync) {
        await syncMatch(mNum);
      }
    } catch (loopErr) {
      console.error("[LIVE SYNC LOOP] Error:", loopErr.message);
    }

    await new Promise((r) => setTimeout(r, 15000));
  }
}

// Run daemon if directly executed
const isDirectRun = process.argv[1]?.endsWith("live-sync-score.mjs");
if (isDirectRun) {
  runLoop();
}

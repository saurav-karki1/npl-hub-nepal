import { createClient } from "@supabase/supabase-js";
import { recalculateStandings } from "./recalculate-standings.mjs";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

/**
 * Sync a single match by match number (1 to 32).
 * Automatically resolves ESPN Cricinfo match ID (1558582 for Match 1, etc.)
 */
export async function syncMatch(matchNumber = 1) {
  const espnMatchId = String(1558581 + matchNumber);
  const matchIdStr = `match-${String(matchNumber).padStart(2, "0")}`;

  try {
    const res = await fetch(`https://www.espncricinfo.com/ci/engine/match/${espnMatchId}.json`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });

    if (!res.ok) {
      console.error(`[SYNC M${matchNumber}] ESPN returned HTTP ${res.status}`);
      return;
    }

    const d = await res.json();
    const teams = d.team || [];
    const team1Id = teams[0] ? String(teams[0].team_id) : undefined;
    const team2Id = teams[1] ? String(teams[1].team_id) : undefined;

    let team1Score = undefined;
    let team2Score = undefined;

    // Parse ALL completed or current innings
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

    // Active live innings overrides with real-time ball/over figures
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

    const isCompleted = d.match?.result !== "0" && Boolean(d.match?.result);
    const hasInningsData = Boolean(
      (d.innings && d.innings.length > 0) ||
      (d.live?.innings && d.live.innings.runs !== undefined)
    );
    const isLiveMatch = !isCompleted && hasInningsData;

    // If match is upcoming and hasn't started yet, do not falsely flip status
    if (!isCompleted && !isLiveMatch) {
      console.log(`[SYNC M${matchNumber}] Match is upcoming / not yet started (${d.live?.status || "Scheduled"}).`);
      return;
    }

    const summary = d.match?.current_summary || "";
    const toss = d.live?.status || "";

    const winMargin =
      d.match?.amount && d.match?.amount_name ? `${d.match.amount} ${d.match.amount_name}` : undefined;
    const winType = d.match?.amount_name?.includes("run") ? "runs" : "wickets";

    const winnerEspnId = String(d.match?.winner_team_id);
    const winnerName =
      winnerEspnId === team1Id ? teams[0]?.team_name?.replace(" (NPL)", "") : teams[1]?.team_name?.replace(" (NPL)", "");
    const resultStatement = isCompleted
      ? `${winnerName || "Match Winner"} won${winMargin ? ` by ${winMargin}` : ""}`
      : summary || toss;

    // 1. Update Supabase matches table
    const { error: matchErr } = await sb
      .from("matches")
      .update({
        status: isCompleted ? "completed" : "live",
        scores: {
          ...(team1Score ? { team1: team1Score } : {}),
          ...(team2Score ? { team2: team2Score } : {}),
        },
        result: isCompleted ? resultStatement : undefined,
        result_statement: resultStatement,
        winner_name: isCompleted ? winnerName : undefined,
        win_margin: isCompleted ? winMargin : undefined,
        win_type: isCompleted ? winType : undefined,
      })
      .eq("id", matchIdStr);

    if (matchErr) {
      console.error(`[SYNC M${matchNumber}] Error updating match:`, matchErr.message);
    } else {
      console.log(
        `[SYNC ${new Date().toLocaleTimeString()}] Match #${matchNumber} ${isCompleted ? "[COMPLETED]" : "[LIVE]"}: ${resultStatement}`
      );
    }

    // 2. Parse and sync commentary events to match_commentary
    const commsList = d.comms?.[0]?.ball || [];
    let inserted = 0;
    for (const ball of commsList.slice(0, 30)) {
      if (!ball.overs_actual) continue;
      const overNum = parseFloat(ball.overs_actual) || 0;
      const overInt = Math.floor(overNum);
      const ballInt = Math.round((overNum - overInt) * 10);
      const eventId = `espn_${espnMatchId}_${ball.overs_actual}`;

      const isWicket = Boolean(ball.dismissal || ball.event === "OUT");
      const isSix = ball.event?.includes("6") || ball.text?.toLowerCase().includes("six");
      const isFour = ball.event?.includes("4") || ball.text?.toLowerCase().includes("four");
      const runs = parseInt(ball.event, 10) || 0;

      const commentaryRow = {
        match_id: matchIdStr,
        external_event_id: eventId,
        over_number: overNum,
        ball_number: ballInt,
        event_type: isWicket ? "wicket" : (isFour || isSix) ? "boundary" : "ball",
        commentary_text: ball.dismissal || ball.text || ball.event || "No run",
        headline: isWicket ? "WICKET!" : isSix ? "SIX!" : isFour ? "FOUR!" : undefined,
        runs,
        is_wicket: isWicket,
        is_boundary: Boolean(isFour || isSix),
        is_six: Boolean(isSix),
        batter_name: ball.players ? ball.players.split(" to ")[1] : undefined,
        bowler_name: ball.players ? ball.players.split(" to ")[0] : undefined,
        provider: "manual",
      };

      const { error: commErr } = await sb
        .from("match_commentary")
        .upsert(commentaryRow, { onConflict: "match_id,external_event_id" });

      if (!commErr) inserted++;
    }

    // 3. When a match is completed, immediately trigger points table recalculation
    if (isCompleted) {
      try {
        await recalculateStandings("season-3");
      } catch (err) {
        console.error(`[SYNC M${matchNumber}] Standings recalculation error:`, err.message);
      }
    }
  } catch (err) {
    console.error(`[SYNC M${matchNumber}] Error:`, err.message);
  }
}

// Run loop checking currently active/live matches or the next upcoming fixture
async function runLoop() {
  console.log("[SYNC SERVICE] Started live sync for NPL Season 3 matches...");
  while (true) {
    try {
      // Find matches with status 'live'
      const { data: liveMatches } = await sb
        .from("matches")
        .select("id,match_number,status")
        .eq("status", "live");

      let matchesToSync = (liveMatches && liveMatches.length > 0)
        ? liveMatches.map((m) => m.match_number)
        : [];

      // If no match is marked live, inspect the next upcoming match to auto-detect start
      if (matchesToSync.length === 0) {
        const { data: upcomingMatches } = await sb
          .from("matches")
          .select("id,match_number,status")
          .eq("status", "upcoming")
          .order("match_number", { ascending: true })
          .limit(1);

        if (upcomingMatches && upcomingMatches.length > 0) {
          matchesToSync = [upcomingMatches[0].match_number];
        }
      }

      for (const mNum of matchesToSync) {
        await syncMatch(mNum);
      }
    } catch (err) {
      console.error("[SYNC LOOP] Loop error:", err.message);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
}

runLoop();

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MATCH_SLUG = "match-1-lumbini-lions-vs-sudurpaschim-royals";
const ESPN_MATCH_ID = "1558582";

export async function syncOnce() {
  try {
    const res = await fetch(`https://www.espncricinfo.com/ci/engine/match/${ESPN_MATCH_ID}.json`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });

    if (!res.ok) {
      console.error(`[SYNC] ESPN returned ${res.status}`);
      return;
    }

    const d = await res.json();
    const liveInnings = d.live?.innings;
    if (!liveInnings) {
      console.log("[SYNC] No live innings data");
      return;
    }

    const battingTeamId = String(liveInnings.team_id);
    const isTeam2Batting = battingTeamId === "7237"; // Sudurpaschim Royals

    const scores = {
      team1: !isTeam2Batting
        ? {
            runs: Number(liveInnings.runs) || 0,
            wickets: Number(liveInnings.wickets) || 0,
            overs: String(liveInnings.overs || "0.0"),
          }
        : undefined,
      team2: isTeam2Batting
        ? {
            runs: Number(liveInnings.runs) || 0,
            wickets: Number(liveInnings.wickets) || 0,
            overs: String(liveInnings.overs || "0.0"),
          }
        : undefined,
    };

    const summary = d.match?.current_summary || "";
    const toss = d.live?.status || "";
    const isCompleted = d.match?.result !== "0" && Boolean(d.match?.result);

    // 1. Update matches table in Supabase
    const { error: matchErr } = await sb
      .from("matches")
      .update({
        status: isCompleted ? "completed" : "live",
        scores,
        result_statement: summary || toss || null,
      })
      .eq("slug", MATCH_SLUG);

    if (matchErr) {
      console.error("[SYNC] Error updating match:", matchErr.message);
    } else {
      console.log(`[SYNC ${new Date().toLocaleTimeString()}] Score: ${summary || `${liveInnings.runs}/${liveInnings.wickets} (${liveInnings.overs})`}`);
    }

    // 2. Parse and sync commentary events to match_commentary
    const commsList = d.comms?.[0]?.ball || [];
    for (const ball of commsList.slice(0, 20)) {
      if (!ball.overs_actual) continue;
      const overNum = parseFloat(ball.overs_actual) || 0;
      const overInt = Math.floor(overNum);
      const ballInt = Math.round((overNum - overInt) * 10);
      const eventId = `espn_${ESPN_MATCH_ID}_${ball.overs_actual}`;

      const isWicket = Boolean(ball.dismissal || ball.event === "OUT");
      const isSix = ball.event?.includes("6") || ball.text?.toLowerCase().includes("six");
      const isFour = ball.event?.includes("4") || ball.text?.toLowerCase().includes("four");
      const runs = parseInt(ball.event, 10) || 0;

      const commentaryRow = {
        match_id: "match-01",
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

      await sb
        .from("match_commentary")
        .upsert(commentaryRow, { onConflict: "match_id,external_event_id" });
    }
  } catch (err) {
    console.error("[SYNC] Error:", err.message);
  }
}

// Continuous polling loop
async function runLoop() {
  console.log("[SYNC SERVICE] Started live sync for Match #1...");
  while (true) {
    await syncOnce();
    await new Promise((r) => setTimeout(r, 15000));
  }
}

runLoop();

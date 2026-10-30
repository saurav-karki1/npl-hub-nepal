/**
 * One-shot script to seed Match 4 as live in Supabase.
 * Run: node scripts/seed-match04-live.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fetchLiveData() {
  const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558585.json", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      Referer: "https://www.espncricinfo.com/",
    },
  });
  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  return res.json();
}

async function main() {
  console.log("[SEED-M4] Fetching live data from ESPN...");
  const d = await fetchLiveData();

  const teams = d.team || [];
  const team1Id = teams[0] ? String(teams[0].team_id) : undefined;
  const team2Id = teams[1] ? String(teams[1].team_id) : undefined;
  const team1Name = teams[0]?.team_name?.replace(/\s*\(NPL\)/gi, "").trim() || "Team 1";
  const team2Name = teams[1]?.team_name?.replace(/\s*\(NPL\)/gi, "").trim() || "Team 2";

  const players = {};
  for (const t of teams) {
    for (const p of t.player || []) {
      if (p.player_id && p.known_as) {
        players[String(p.player_id)] = p.known_as;
      }
    }
  }

  let team1Score = { runs: 0, wickets: 0, overs: "0.0" };
  let team2Score = { runs: 0, wickets: 0, overs: "0.0" };

  for (const inn of d.innings || []) {
    const battingId = String(inn.batting_team_id);
    const parsed = {
      runs: Number(inn.runs) || 0,
      wickets: Number(inn.wickets) || 0,
      overs: String(inn.overs || "0.0"),
    };
    if (team1Id && battingId === team1Id) team1Score = parsed;
    else if (team2Id && battingId === team2Id) team2Score = parsed;
  }

  if (d.live?.innings) {
    const activeBattingId = String(d.live.innings.team_id);
    const liveParsed = {
      runs: Number(d.live.innings.runs) || 0,
      wickets: Number(d.live.innings.wickets) || 0,
      overs: String(d.live.innings.overs || "0.0"),
    };
    if (activeBattingId === team1Id) team1Score = liveParsed;
    else if (activeBattingId === team2Id) team2Score = liveParsed;
  }

  const batters = (d.live?.batting || []).map((b) => ({
    name: players[String(b.player_id)] || `Player ${b.player_id}`,
    runs: Number(b.runs) || 0,
    balls: Number(b.balls_faced) || 0,
    fours: Number(b.fours) || 0,
    sixes: Number(b.sixes) || 0,
    strikeRate: b.strike_rate ? String(b.strike_rate) : "0.00",
    isStriker: b.live_current_name === "striker",
  }));

  const bowlers = (d.live?.bowling || []).map((bw) => ({
    name: players[String(bw.player_id)] || `Player ${bw.player_id}`,
    overs: String(bw.overs || "0.0"),
    maidens: Number(bw.maidens) || 0,
    runs: Number(bw.conceded) || 0,
    wickets: Number(bw.wickets) || 0,
    economy: bw.economy_rate ? String(bw.economy_rate) : "0.00",
  }));

  const liveStatus = String(d.live?.status || "").trim();
  const currentSummary = d.match?.current_summary || liveStatus;

  const scores = { team1: team1Score, team2: team2Score, batters, bowlers };

  console.log(`[SEED-M4] ${team1Name} ${team1Score.runs}/${team1Score.wickets} vs ${team2Name} ${team2Score.runs}/${team2Score.wickets}`);
  console.log(`[SEED-M4] Status: ${liveStatus}`);
  console.log(`[SEED-M4] Summary: ${currentSummary}`);

  const { error } = await sb
    .from("matches")
    .update({
      status: "live",
      scores,
      result_statement: currentSummary,
    })
    .eq("id", "match-04");

  if (error) {
    console.error("[SEED-M4] Supabase update failed:", error.message);
  } else {
    console.log("[SEED-M4] ✅ match-04 updated to LIVE in Supabase!");
  }
}

main().catch(console.error);

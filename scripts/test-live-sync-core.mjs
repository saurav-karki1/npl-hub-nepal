import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function mapTeamSlug(name = "") {
  const n = name.toLowerCase();
  if (n.includes("lumbini")) return "lumbini-lions";
  if (n.includes("sudurpaschim") || n.includes("sudur paschim") || n.includes("paschim") || n.includes("royals")) return "sudurpaschim-royals";
  if (n.includes("chitwan") || n.includes("rhinos")) return "chitwan-rhinos";
  if (n.includes("biratnagar") || n.includes("kings")) return "biratnagar-kings";
  if (n.includes("janakpur") || n.includes("bolts")) return "janakpur-bolts";
  if (n.includes("karnali") || n.includes("yaks")) return "karnali-yaks";
  if (n.includes("kathmandu") || n.includes("gorkhas")) return "kathmandu-gorkhas";
  if (n.includes("pokhara") || n.includes("avengers")) return "pokhara-avengers";
  return n.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function run() {
  const espnMatchId = "1558585";
  const url = `https://www.espncricinfo.com/series/a-1558581/b-${espnMatchId}/full-scorecard`;

  console.log(`[TEST] Fetching ${url}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: "https://www.espncricinfo.com/",
    },
  });

  const html = await res.text();
  const scriptMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!scriptMatch) throw new Error("No __NEXT_DATA__ found!");

  const json = JSON.parse(scriptMatch[1]);
  const data = json.props?.appPageProps?.data;
  const match = data.match || {};
  const content = data.content || {};

  console.log("Match state:", match.state);
  console.log("Match statusText:", match.statusText);

  const rawInnings = content.innings || [];
  console.log("Innings count:", rawInnings.length);

  let team1Score = { runs: 0, wickets: 0, overs: "0.0" };
  let team2Score = { runs: 0, wickets: 0, overs: "0.0" };

  for (const inn of rawInnings) {
    const innTeamSlug = mapTeamSlug(inn.team?.name || "");
    const score = {
      runs: Number(inn.runs || 0),
      wickets: Number(inn.wickets || 0),
      overs: String(inn.overs || "0.0"),
    };
    console.log(`Inning: ${inn.team?.name} (${innTeamSlug}) -> ${score.runs}/${score.wickets} in ${score.overs} ov`);
    if (innTeamSlug === "pokhara-avengers") {
      team1Score = score;
    } else if (innTeamSlug === "sudurpaschim-royals") {
      team2Score = score;
    }
  }

  let currentInning = rawInnings.find((i) => i.isCurrent) || rawInnings[rawInnings.length - 1];
  const activeBatsmen = (currentInning?.inningBatsmen || [])
    .filter((b) => b.battedType === "yes" && (!b.dismissalText || b.dismissalText?.short === "not out"))
    .map((b) => ({
      name: b.player?.longName || b.player?.name,
      runs: Number(b.runs || 0),
      balls: Number(b.balls || 0),
      fours: Number(b.fours || 0),
      sixes: Number(b.sixes || 0),
      strikeRate: b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : "0.00",
      isStriker: false,
    }));

  const currentBowlers = (currentInning?.inningBowlers || []).slice(-2).map((bw) => ({
    name: bw.player?.longName || bw.player?.name,
    overs: String(bw.overs || "0.0"),
    maidens: Number(bw.maidens || 0),
    runs: Number(bw.conceded || 0),
    wickets: Number(bw.wickets || 0),
    economy: bw.overs ? (bw.conceded / Math.max(0.1, parseFloat(bw.overs))).toFixed(2) : "0.00",
  }));

  console.log("Active Batters:", activeBatsmen);
  console.log("Current Bowlers:", currentBowlers);

  const scores = {
    team1: team1Score,
    team2: team2Score,
    batters: activeBatsmen,
    bowlers: currentBowlers,
  };

  const summary = `${match.statusText || ""} (Pokhara ${team1Score.runs}/${team1Score.wickets} in ${team1Score.overs} ov)`;

  const { error } = await sb.from("matches").update({
    status: match.state === "POST" ? "completed" : "live",
    scores,
    result_statement: summary,
  }).eq("id", "match-04");

  if (error) console.error("Update error:", error);
  else console.log("SUCCESSFULLY UPDATED MATCH 4 IN SUPABASE!");
}

run().catch(console.error);

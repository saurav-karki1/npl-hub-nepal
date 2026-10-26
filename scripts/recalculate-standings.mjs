import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export function oversToDecimal(oversInput, wickets = 0, maxQuotaOvers = 20) {
  if (wickets >= 10) return maxQuotaOvers;
  if (!oversInput && oversInput !== 0) return 0;
  const str = String(oversInput).trim();
  if (!str.includes(".")) return Math.min(parseFloat(str) || 0, maxQuotaOvers);
  const [oversStr, ballsStr] = str.split(".");
  const overs = parseInt(oversStr, 10) || 0;
  const balls = parseInt(ballsStr, 10) || 0;
  return Math.min(overs + balls / 6, maxQuotaOvers);
}

export async function recalculateStandings(seasonId = "season-3") {
  const { data: dbMatches, error: matchesErr } = await sb
    .from("matches")
    .select("*")
    .eq("season_id", seasonId)
    .order("match_number", { ascending: true });

  if (matchesErr || !dbMatches) {
    console.error("Failed to query matches:", matchesErr?.message);
    return;
  }

  const completed = dbMatches.filter((m) => m.stage === "League" && m.status === "completed");
  console.log(`Found ${completed.length} completed league matches.`);

  const teamIds = [
    "biratnagar-kings",
    "chitwan-rhinos",
    "janakpur-bolts",
    "karnali-yaks",
    "kathmandu-gorkhas",
    "lumbini-lions",
    "pokhara-avengers",
    "sudurpaschim-royals",
  ];

  const table = {};
  for (const tid of teamIds) {
    table[tid] = {
      team_id: tid,
      played: 0,
      won: 0,
      lost: 0,
      no_result: 0,
      points: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
      nrr: null,
    };
  }

  for (const m of completed) {
    const t1 = m.team1_id;
    const t2 = m.team2_id;
    if (!t1 || !t2 || !table[t1] || !table[t2]) continue;

    table[t1].played += 1;
    table[t2].played += 1;

    const r1 = m.scores?.team1?.runs || 0;
    const r2 = m.scores?.team2?.runs || 0;
    const ov1 = oversToDecimal(m.scores?.team1?.overs, m.scores?.team1?.wickets);
    const ov2 = oversToDecimal(m.scores?.team2?.overs, m.scores?.team2?.wickets);

    table[t1].runsScored += r1;
    table[t1].oversFaced += ov1;
    table[t1].runsConceded += r2;
    table[t1].oversBowled += ov2;

    table[t2].runsScored += r2;
    table[t2].oversFaced += ov2;
    table[t2].runsConceded += r1;
    table[t2].oversBowled += ov1;

    if (r1 > r2) {
      table[t1].won += 1;
      table[t1].points += 2;
      table[t2].lost += 1;
    } else if (r2 > r1) {
      table[t2].won += 1;
      table[t2].points += 2;
      table[t1].lost += 1;
    } else {
      table[t1].no_result += 1;
      table[t2].no_result += 1;
      table[t1].points += 1;
      table[t2].points += 1;
    }
  }

  for (const tid of teamIds) {
    const t = table[tid];
    if (t.oversFaced > 0 && t.oversBowled > 0) {
      t.nrr = t.runsScored / t.oversFaced - t.runsConceded / t.oversBowled;
    }
  }

  const sorted = Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const nrrA = a.nrr ?? 0;
    const nrrB = b.nrr ?? 0;
    if (nrrB !== nrrA) return nrrB - nrrA;
    const winDiff = (b.won ?? 0) - (a.won ?? 0);
    if (winDiff !== 0) return winDiff;
    return a.team_id.localeCompare(b.team_id);
  });

  console.log("Calculated Standings:");
  for (let idx = 0; idx < sorted.length; idx++) {
    const row = sorted[idx];
    const pos = idx + 1;
    console.log(
      `${pos}. ${row.team_id}: P=${row.played} W=${row.won} L=${row.lost} Pts=${row.points} NRR=${
        row.nrr !== null ? (row.nrr >= 0 ? `+${row.nrr.toFixed(3)}` : row.nrr.toFixed(3)) : "—"
      }`
    );

    const updatePayload = {
      standing_position: pos,
      played: row.played,
      won: row.won,
      lost: row.lost,
      no_result: row.no_result,
      points: row.points,
      net_run_rate: row.nrr !== null ? parseFloat(row.nrr.toFixed(3)) : null,
      runs_scored: row.runsScored,
      overs_faced_decimal: parseFloat(row.oversFaced.toFixed(4)),
      runs_conceded: row.runsConceded,
      overs_bowled_decimal: parseFloat(row.oversBowled.toFixed(4)),
      updated_at: new Date().toISOString(),
    };

    const { error: updErr } = await sb
      .from("team_seasons")
      .update(updatePayload)
      .eq("season_id", seasonId)
      .eq("team_id", row.team_id);

    if (updErr) {
      console.error(`Failed to update team_seasons for ${row.team_id}:`, updErr.message);
    }
  }

  console.log("Successfully updated team_seasons in Supabase!");
}

if (process.argv[1]?.endsWith("recalculate-standings.mjs")) {
  recalculateStandings();
}

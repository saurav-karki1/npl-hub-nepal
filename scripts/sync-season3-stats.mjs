import { createClient } from "@supabase/supabase-js";
import { recalculateStandings } from "./recalculate-standings.mjs";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function mapTeamSlug(name = "") {
  const n = name.toLowerCase();
  if (n.includes("lumbini")) return "lumbini-lions";
  if (n.includes("sudurpaschim") || n.includes("paschim")) return "sudurpaschim-royals";
  if (n.includes("chitwan")) return "chitwan-rhinos";
  if (n.includes("biratnagar")) return "biratnagar-kings";
  if (n.includes("janakpur")) return "janakpur-bolts";
  if (n.includes("karnali")) return "karnali-yaks";
  if (n.includes("kathmandu")) return "kathmandu-gorkhas";
  if (n.includes("pokhara")) return "pokhara-avengers";
  return n;
}

function teamReadableName(slug) {
  const map = {
    "lumbini-lions": "Lumbini Lions",
    "sudurpaschim-royals": "Sudurpaschim Royals",
    "chitwan-rhinos": "Chitwan Rhinos",
    "biratnagar-kings": "Biratnagar Kings",
    "janakpur-bolts": "Janakpur Bolts",
    "karnali-yaks": "Karnali Yaks",
    "kathmandu-gorkhas": "Kathmandu Gorkhas",
    "pokhara-avengers": "Pokhara Avengers",
  };
  return map[slug] || slug;
}

function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function syncCompletedMatchStats() {
  console.log("[STATS SYNC] Starting full Season 3 stats sync...");

  // 1. Fetch completed matches from Supabase
  const { data: completedMatches } = await sb
    .from("matches")
    .select("id, match_number, status, match_date, team1_id, team2_id, result_statement, result")
    .eq("season_id", "season-3")
    .eq("status", "completed")
    .order("match_number", { ascending: true });

  console.log(`[STATS SYNC] Found ${completedMatches?.length || 0} completed matches.`);

  const cumulativePlayers = {}; // key: playerSlug
  const awardsToInsert = [];

  for (const m of completedMatches || []) {
    const espnMatchId = String(1558581 + m.match_number);
    const url = `https://www.espncricinfo.com/series/a-1558581/b-${espnMatchId}/full-scorecard`;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        redirect: "follow",
      });

      if (!res.ok) {
        console.warn(`[STATS SYNC] Match #${m.match_number} returned HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const matchNext = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!matchNext) {
        console.warn(`[STATS SYNC] Could not parse __NEXT_DATA__ for Match #${m.match_number}`);
        continue;
      }

      const nextData = JSON.parse(matchNext[1]);
      const data = nextData.props?.appPageProps?.data;
      const innings = data?.content?.innings || [];
      const potmAward = data?.content?.matchPlayerAwards?.find((a) => a.type === "PLAYER_OF_MATCH");

      if (potmAward && potmAward.player) {
        const p = potmAward.player;
        const teamSlug = mapTeamSlug(potmAward.team?.name || potmAward.team?.longName || "");
        const potmName = p.longName || p.name;
        const potmSlug = p.slug || slugify(potmName);

        // Find potm match stats for detail
        let statDetail = "";
        for (const inn of innings) {
          const b = (inn.inningBatsmen || []).find((bat) => bat.player?.id === p.id);
          if (b && b.runs) {
            statDetail += `${b.runs} runs (${b.balls}b) `;
          }
          const bw = (inn.inningBowlers || []).find((bowl) => bowl.player?.id === p.id);
          if (bw && bw.wickets) {
            statDetail += `${bw.wickets}/${bw.conceded} (${bw.overs} ov, Econ: ${bw.economy}) `;
          }
        }

        const awardId = `00000003-0000-0000-0000-${String(m.match_number).padStart(12, "0")}`;

        awardsToInsert.push({
          id: awardId,
          season_id: "season-3",
          award_type: "player-of-match",
          award_name: `Player of the Match (Match #${m.match_number})`,
          recipient_name: potmName,
          recipient_player_slug: potmSlug,
          recipient_team_id: teamSlug,
          recipient_team_name: teamReadableName(teamSlug),
          stat_metric: statDetail.trim() || undefined,
          secondary_detail: `Match #${m.match_number} at TU Cricket Ground`,
          confidence: "High",
          sort_order: m.match_number,
        });

        // Also update matches table with player_of_the_match
        await sb
          .from("matches")
          .update({ player_of_the_match: potmName })
          .eq("id", m.id);
      }

      // Process batting & bowling from innings
      for (const inn of innings) {
        const battingTeamSlug = mapTeamSlug(inn.team?.longName || inn.team?.name || "");

        // Batting
        for (const b of inn.inningBatsmen || []) {
          if (!b.player) continue;
          const pName = b.player.longName || b.player.name;
          const pSlug = b.player.slug || slugify(pName);

          if (!cumulativePlayers[pSlug]) {
            cumulativePlayers[pSlug] = {
              name: pName,
              slug: pSlug,
              teamSlug: battingTeamSlug,
              matches: new Set(),
              innings: 0,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              highestScore: 0,
              highestScoreRaw: "0",
              isNotOutMax: false,
              dismissals: 0,
              overs: 0,
              maidens: 0,
              conceded: 0,
              wickets: 0,
              bestWickets: 0,
              bestConceded: 999,
            };
          }

          const entry = cumulativePlayers[pSlug];
          entry.matches.add(m.match_number);

          const hasBatted = b.battedType === "yes" || b.runs !== null;
          if (hasBatted) {
            entry.innings += 1;
            const r = Number(b.runs) || 0;
            const balls = Number(b.balls) || 0;
            entry.runs += r;
            entry.balls += balls;
            entry.fours += Number(b.fours) || 0;
            entry.sixes += Number(b.sixes) || 0;

            const isOut = Boolean(b.isOut || (b.dismissalText?.long && !b.dismissalText.long.toLowerCase().includes("not out")));
            if (isOut) entry.dismissals += 1;

            if (r > entry.highestScore || (r === entry.highestScore && !isOut)) {
              entry.highestScore = r;
              entry.highestScoreRaw = isOut ? String(r) : `${r}*`;
            }
          }
        }

        // Bowling (bowling team is opposing team)
        const bowlingTeamSlug = battingTeamSlug === m.team1_id ? m.team2_id : m.team1_id;
        for (const bw of inn.inningBowlers || []) {
          if (!bw.player) continue;
          const pName = bw.player.longName || bw.player.name;
          const pSlug = bw.player.slug || slugify(pName);

          if (!cumulativePlayers[pSlug]) {
            cumulativePlayers[pSlug] = {
              name: pName,
              slug: pSlug,
              teamSlug: bowlingTeamSlug,
              matches: new Set(),
              innings: 0,
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              highestScore: 0,
              highestScoreRaw: "0",
              isNotOutMax: false,
              dismissals: 0,
              overs: 0,
              maidens: 0,
              conceded: 0,
              wickets: 0,
              bestWickets: 0,
              bestConceded: 999,
            };
          }

          const entry = cumulativePlayers[pSlug];
          entry.matches.add(m.match_number);

          const w = Number(bw.wickets) || 0;
          const c = Number(bw.conceded) || 0;
          const ov = parseFloat(bw.overs) || 0;
          entry.overs += ov;
          entry.maidens += Number(bw.maidens) || 0;
          entry.conceded += c;
          entry.wickets += w;

          if (w > entry.bestWickets || (w === entry.bestWickets && c < entry.bestConceded)) {
            entry.bestWickets = w;
            entry.bestConceded = c;
          }
        }
      }

      console.log(`[STATS SYNC] Match #${m.match_number} successfully ingested.`);
    } catch (err) {
      console.error(`[STATS SYNC] Error processing Match #${m.match_number}:`, err.message);
    }
  }

  // 2. Upsert awards into tournament_awards
  if (awardsToInsert.length > 0) {
    const { error: awErr } = await sb
      .from("tournament_awards")
      .upsert(awardsToInsert, { onConflict: "id" });
    if (awErr) {
      console.error("[STATS SYNC] Awards upsert error:", awErr.message);
    } else {
      console.log(`[STATS SYNC] Upserted ${awardsToInsert.length} tournament awards.`);
    }
  }

  // 3. Format and upsert player_season_stats
  const statsRows = [];
  for (const p of Object.values(cumulativePlayers)) {
    const matchesCount = p.matches.size;
    const avg = p.dismissals > 0 ? parseFloat((p.runs / p.dismissals).toFixed(2)) : p.runs > 0 ? p.runs : null;
    const sr = p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(2)) : null;
    const econ = p.overs > 0 ? parseFloat((p.conceded / p.overs).toFixed(2)) : null;
    const bestBowling = p.bestWickets > 0 ? `${p.bestWickets}/${p.bestConceded}` : null;

    statsRows.push({
      id: `s3_${p.slug}`,
      season_id: "season-3",
      player_name: p.name,
      player_slug: p.slug,
      team_id: p.teamSlug,
      team_name: teamReadableName(p.teamSlug),
      matches: matchesCount,
      innings: p.innings > 0 ? p.innings : null,
      runs: p.innings > 0 ? p.runs : null,
      highest_score: p.innings > 0 ? p.highestScoreRaw : null,
      average: avg,
      strike_rate: sr,
      wickets: p.overs > 0 ? p.wickets : null,
      best_bowling: bestBowling,
      economy: econ,
      fours: p.fours,
      sixes: p.sixes,
      hundreds: p.highestScore >= 100 ? 1 : 0,
      fifties: p.highestScore >= 50 && p.highestScore < 100 ? 1 : 0,
      confidence: "High",
      source_note: `Season 3 Verified Data (${matchesCount} match${matchesCount === 1 ? "" : "es"})`,
    });
  }

  if (statsRows.length > 0) {
    const { error: stErr } = await sb
      .from("player_season_stats")
      .upsert(statsRows, { onConflict: "id" });
    if (stErr) {
      console.error("[STATS SYNC] Player stats upsert error:", stErr.message);
    } else {
      console.log(`[STATS SYNC] Upserted ${statsRows.length} player season stats rows.`);
    }
  }

  // 4. Recalculate standings
  await recalculateStandings("season-3");
  console.log("[STATS SYNC] Full Season 3 stats sync complete!");
}

if (process.argv[1]?.endsWith("sync-season3-stats.mjs")) {
  syncCompletedMatchStats();
}

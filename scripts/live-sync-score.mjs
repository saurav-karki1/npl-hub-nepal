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
 * Fetch ESPN match data via HTML __NEXT_DATA__ extraction.
 * Prioritizes ball-by-ball-commentary, then full-scorecard.
 */
async function fetchEspnData(espnMatchId) {
  const endpoints = [
    `https://www.espncricinfo.com/series/a-${ESPN_SERIES_ID}/b-${espnMatchId}/ball-by-ball-commentary`,
    `https://www.espncricinfo.com/series/a-${ESPN_SERIES_ID}/b-${espnMatchId}/full-scorecard`,
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
      });

      if (!res.ok) continue;

      const html = await res.text();
      const m = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
      );
      if (!m || !m[1]) continue;

      const json = JSON.parse(m[1]);
      const d = json?.props?.appPageProps?.data;
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

/**
 * Sync a single match by match number (1 to 32).
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
      return;
    }

    // 2. Fetch fresh data from ESPN
    const espnData = await fetchEspnData(espnMatchId);
    if (!espnData) {
      console.error(`[SYNC M${matchNumber}] Failed to fetch ESPN data.`);
      return;
    }

    const { match: espnMatch, content } = espnData;

    // 3. Determine match state
    const matchState = String(espnMatch.state || "").toUpperCase();
    const statusText = String(espnMatch.statusText || espnMatch.status || "");
    const statusTextLower = statusText.toLowerCase();

    const isCompleted =
      matchState === "POST" ||
      statusTextLower.includes("won by") ||
      statusTextLower.includes("won the match") ||
      statusTextLower.includes("beat") ||
      statusTextLower.includes("no result") ||
      statusTextLower.includes("abandoned") ||
      statusTextLower.includes("match tied") ||
      statusTextLower.includes("tied");

    const innings = content.innings || [];
    const hasInningsData = innings.length > 0 && (innings[0].runs > 0 || parseFloat(innings[0].overs) > 0);

    const isLive =
      !isCompleted &&
      (matchState === "LIVE" ||
        hasInningsData ||
        statusTextLower.includes("opted to") ||
        statusTextLower.includes("chose to") ||
        statusTextLower.includes("elected to") ||
        statusTextLower.includes("in progress"));

    if (!isCompleted && !isLive) {
      console.log(
        `[SYNC M${matchNumber}] Scheduled/Upcoming (state=${matchState}, status="${statusText}"). Skipping.`
      );
      return;
    }

    // 4. Parse scores from innings
    let team1Score = { runs: 0, wickets: 0, overs: "0.0" };
    let team2Score = { runs: 0, wickets: 0, overs: "0.0" };

    for (const inn of innings) {
      const innTeamName = inn.team?.name || inn.battingTeam?.name || "";
      const innTeamSlug = mapTeamSlug(innTeamName);

      const parsedScore = {
        runs: Number(inn.runs) || 0,
        wickets: Number(inn.wickets) || 0,
        overs: String(inn.overs || inn.oversActual || "0.0"),
      };

      if (innTeamSlug === dbMatch.team1_id) {
        team1Score = parsedScore;
      } else if (innTeamSlug === dbMatch.team2_id) {
        team2Score = parsedScore;
      } else if (team1Score.runs === 0 && team1Score.overs === "0.0") {
        team1Score = parsedScore;
      } else {
        team2Score = parsedScore;
      }
    }

    // 5. Parse current batters and bowlers from active innings
    let activeBatters = [];
    let activeBowlers = [];
    const activeInn = innings[innings.length - 1];

    if (activeInn) {
      const batsmen = activeInn.inningBatsmen || [];
      const currentBatsmen = batsmen.filter(
        (b) =>
          b.battedType === "yes" &&
          (!b.dismissalText ||
            b.dismissalText?.short === "not out" ||
            b.dismissalText?.short === "batting")
      );

      activeBatters = (currentBatsmen.length > 0 ? currentBatsmen : batsmen.slice(0, 2)).map(
        (b) => ({
          name: b.player?.longName || b.player?.name || "Batter",
          runs: Number(b.runs) || 0,
          balls: Number(b.balls) || 0,
          fours: Number(b.fours) || 0,
          sixes: Number(b.sixes) || 0,
          strikeRate: b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : "0.00",
          isStriker: Boolean(b.isStriker),
        })
      );

      const bowlers = activeInn.inningBowlers || [];
      const currentBowlers = bowlers.slice(-2);
      activeBowlers = currentBowlers.map((bw) => ({
        name: bw.player?.longName || bw.player?.name || "Bowler",
        overs: String(bw.overs || "0.0"),
        maidens: Number(bw.maidens) || 0,
        runs: Number(bw.conceded) || 0,
        wickets: Number(bw.wickets) || 0,
        economy: bw.overs
          ? (bw.conceded / Math.max(0.1, parseFloat(bw.overs))).toFixed(2)
          : "0.00",
      }));
    }

    // 6. Build result statement (detect Innings Break, Chases, Results)
    let resultStatement = statusText;
    let winnerName = undefined;
    let winMargin = undefined;
    let winType = undefined;
    let winnerTeamSlug = undefined;

    const inn1 = innings[0];
    const inn2 = innings[1];
    const isInn1Finished = Boolean(
      inn1 && (Number(inn1.wickets) >= 10 || parseFloat(inn1.overs) >= 20)
    );
    const isInn2Started = Boolean(
      inn2 && (Number(inn2.runs) > 0 || parseFloat(inn2.overs) > 0 || (inn2.inningBatsmen && inn2.inningBatsmen.length > 0))
    );
    const isInningsBreak = isLive && isInn1Finished && !isInn2Started;

    if (isCompleted) {
      const wonMatch = statusText.match(/^(.*?)\s+won by\s+(.*)$/i);
      if (wonMatch) {
        winnerName = wonMatch[1].replace(/\(NPL\)/gi, "").trim();
        winMargin = wonMatch[2].trim();
        winType = winMargin.toLowerCase().includes("run") ? "runs" : "wickets";
        resultStatement = `${winnerName} won by ${winMargin}`;
        winnerTeamSlug = mapTeamSlug(winnerName);
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
      const activeScore =
        team2Score.runs > 0 || parseFloat(team2Score.overs) > 0 ? team2Score : team1Score;
      resultStatement = statusText
        ? `${statusText} (${activeScore.runs}/${activeScore.wickets} in ${activeScore.overs} ov)`
        : `${activeScore.runs}/${activeScore.wickets} (${activeScore.overs} ov)`;
    }

    // 7. Update Supabase matches table
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

    // 8. Sync ball-by-ball commentary
    let commCount = 0;
    const comments = content.comments || [];

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
          if (isWicket) {
            commentaryText = `OUT! ${batterName || "The batter"} is dismissed${bowlerName ? ` by ${bowlerName}` : ""}.`;
          } else if (isSix) {
            commentaryText = `SIX! ${batterName || "The batter"} smashes a maximum${bowlerName ? ` off ${bowlerName}` : ""}!`;
          } else if (isFour) {
            commentaryText = `FOUR! ${batterName || "The batter"} hits a boundary${bowlerName ? ` off ${bowlerName}` : ""}.`;
          } else if (runs === 1) {
            commentaryText = `1 run. ${batterName || "The batter"} rotates the strike${bowlerName ? ` off ${bowlerName}` : ""}.`;
          } else if (runs > 1) {
            commentaryText = `${runs} runs scored${bowlerName ? ` off ${bowlerName}` : ""}.`;
          } else {
            commentaryText = `Dot ball.${bowlerName ? ` Good delivery by ${bowlerName}.` : ""}`;
          }
        }

        const headline = isWicket ? "WICKET!" : isSix ? "SIX!" : isFour ? "FOUR!" : undefined;

        const commentaryRow = {
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
        };

        const { error: cErr } = await sb
          .from("match_commentary")
          .upsert(commentaryRow, { onConflict: "match_id,external_event_id" });

        if (!cErr) commCount++;
      }
    } else if (activeInn && Array.isArray(activeInn.inningOvers)) {
      for (const overGroup of activeInn.inningOvers) {
        for (const ball of overGroup.balls || []) {
          if (ball.oversActual == null) continue;
          const overNum = parseFloat(ball.oversActual) || 0;
          const overInt = Math.floor(overNum);
          const ballInt = Math.round((overNum - overInt) * 10);
          const innNum = activeInn.inningNumber || 1;
          const eventId = `espn_${espnMatchId}_inn${innNum}_${String(ball.oversActual)}`;

          const batterName =
            ball.batsmanStatText?.long?.replace(/\s*\d+.*$/, "").trim() ||
            ball.batsmanStatText?.short?.replace(/\s*\d+.*$/, "").trim() ||
            activeBatters[0]?.name;
          const bowlerName =
            ball.bowlerStatText?.long?.replace(/\s*\d+.*$/, "").trim() ||
            ball.bowlerStatText?.short?.replace(/\s*\d+.*$/, "").trim() ||
            activeBowlers[0]?.name;

          let commentaryText = ball.dismissalText?.long || ball.dismissalText?.short || "";
          if (!commentaryText) {
            if (isWicket) commentaryText = `OUT! ${batterName || "The batter"} is dismissed.`;
            else if (isSix) commentaryText = `SIX! ${batterName || "The batter"} hits a maximum!`;
            else if (isFour) commentaryText = `FOUR! ${batterName || "The batter"} finds the fence.`;
            else if (runs === 1) commentaryText = `1 run. ${batterName || "The batter"} rotates the strike.`;
            else if (runs > 1) commentaryText = `${runs} runs scored.`;
            else commentaryText = `Dot ball. Defended.`;
          }

          const headline = isWicket ? "WICKET!" : isSix ? "SIX!" : isFour ? "FOUR!" : undefined;

          const commentaryRow = {
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
          };

          const { error: cErr } = await sb
            .from("match_commentary")
            .upsert(commentaryRow, { onConflict: "match_id,external_event_id" });

          if (!cErr) commCount++;
        }
      }
    }

    if (commCount > 0) {
      console.log(`[SYNC M${matchNumber}] Commentary: ${commCount} balls upserted.`);
    }

    // 9. Recalculate standings and stats when match completes
    if (isCompleted && dbMatch.status !== "completed") {
      try {
        await recalculateStandings("season-3");
        await syncCompletedMatchStats();
        console.log(`[SYNC M${matchNumber}] Tournament standings & stats recalculated.`);
      } catch (stErr) {
        console.error(`[SYNC M${matchNumber}] Standings error:`, stErr.message);
      }
    }
  } catch (err) {
    console.error(`[SYNC M${matchNumber}] Unexpected error:`, err.message);
  }
}

// Continuous loop for background worker
async function runLoop() {
  console.log("[LIVE SYNC] Daemon initialized. Polling active matches every 15s...");
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

      // Also check next upcoming match
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

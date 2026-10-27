import { createClient } from "@supabase/supabase-js";
import { recalculateStandings } from "./recalculate-standings.mjs";
import { syncCompletedMatchStats } from "./sync-season3-stats.mjs";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function parseMatchStartMs(dateStr, timeStr) {
  if (!timeStr || timeStr === "Time TBA") return null;
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (m[3].toUpperCase() === "AM" && hours === 12) hours = 0;
  const isoNepal = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:45`;
  const d = new Date(isoNepal);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Sync a single match by match number (1 to 32).
 * Automatically resolves ESPN Cricinfo match ID (1558582 for Match 1, etc.)
 */
export async function syncMatch(matchNumber = 1) {
  const espnMatchId = String(1558581 + matchNumber);
  const matchIdStr = `match-${String(matchNumber).padStart(2, "0")}`;

  try {
    // Fetch match metadata from Supabase
    const { data: dbMatch } = await sb
      .from("matches")
      .select("id, slug, match_date, match_time, status, team1_id, team2_id")
      .eq("id", matchIdStr)
      .single();

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
    const team1Name = teams[0]?.team_name?.replace(/\s*\(NPL\)/gi, "").trim() || "Team 1";
    const team2Name = teams[1]?.team_name?.replace(/\s*\(NPL\)/gi, "").trim() || "Team 2";

    // Build player name lookup dictionary
    const players = {};
    for (const t of teams) {
      for (const p of t.player || []) {
        if (p.player_id && p.known_as) {
          players[String(p.player_id)] = p.known_as;
        }
      }
    }

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

    // Parse active live batters and bowlers
    const batters = (d.live?.batting || []).map((b) => ({
      name: players[String(b.player_id)] || b.player_id || "Batter",
      runs: Number(b.runs) || 0,
      balls: Number(b.balls_faced) || 0,
      fours: Number(b.fours) || 0,
      sixes: Number(b.sixes) || 0,
      strikeRate: b.strike_rate ? String(b.strike_rate) : "0.00",
      isStriker: b.live_current_name === "striker",
    }));

    const bowlers = (d.live?.bowling || []).map((bw) => ({
      name: players[String(bw.player_id)] || bw.player_id || "Bowler",
      overs: String(bw.overs || "0.0"),
      maidens: Number(bw.maidens) || 0,
      runs: Number(bw.conceded) || 0,
      wickets: Number(bw.wickets) || 0,
      economy: bw.economy_rate ? String(bw.economy_rate) : "0.00",
    }));

    // Detect match completion
    const liveStatusStr = String(d.live?.status || "").trim();
    const liveStatusLower = liveStatusStr.toLowerCase();

    const hasWonString =
      liveStatusLower.includes("won by") ||
      liveStatusLower.includes("won the match") ||
      liveStatusLower.includes("beat") ||
      liveStatusLower.includes("defeat");

    const isTiedOrAbandoned =
      liveStatusLower.includes("match tied") ||
      liveStatusLower.includes("tied") ||
      liveStatusLower.includes("no result") ||
      liveStatusLower.includes("abandoned") ||
      liveStatusLower.includes("match over");

    const inn1 = d.innings?.[0];
    const inn2 = d.innings?.[1];
    const inn2Completed = Boolean(
      inn2 &&
      (Number(inn2.wickets) >= 10 ||
        parseFloat(inn2.overs) >= 20 ||
        (inn2.target && Number(inn2.runs) >= Number(inn2.target)))
    );

    const isCompleted =
      (d.match?.result !== "0" && Boolean(d.match?.result)) ||
      hasWonString ||
      isTiedOrAbandoned ||
      inn2Completed;

    // Detect if match is live
    const hasTossOrLiveStatus =
      liveStatusLower.includes("toss") ||
      liveStatusLower.includes("opted to") ||
      liveStatusLower.includes("elected to") ||
      liveStatusLower.includes("chose to") ||
      liveStatusLower.includes("in progress") ||
      liveStatusLower.includes("delayed");

    const hasInningsData = Boolean(
      (d.innings && d.innings.length > 0) ||
      (d.live?.innings && d.live.innings.runs !== undefined)
    );

    const matchDate = dbMatch?.match_date;
    const matchTime = dbMatch?.match_time;
    const startMs = parseMatchStartMs(matchDate, matchTime);
    const nowMs = Date.now();

    const isLiveMatch =
      !isCompleted &&
      (hasInningsData || hasTossOrLiveStatus || (startMs !== null && nowMs >= startMs));

    // If upcoming and match start moment hasn't arrived, skip
    if (!isCompleted && !isLiveMatch) {
      console.log(`[SYNC M${matchNumber}] Upcoming fixture (${d.live?.status || "Scheduled"}).`);
      return;
    }

    // Determine result statement & winner
    let winnerName = undefined;
    let winMargin = d.match?.amount && d.match?.amount_name ? `${d.match.amount} ${d.match.amount_name}` : undefined;
    let winType = d.match?.amount_name?.includes("run") ? "runs" : "wickets";
    let winnerTeamSlug = undefined;
    let resultStatement = "";

    if (isCompleted) {
      if (hasWonString) {
        resultStatement = liveStatusStr.replace(/\s*\(NPL\)/gi, "").trim();
        const wonMatch = resultStatement.match(/^(.*?)\s+won by\s+(.*)$/i);
        if (wonMatch) {
          winnerName = wonMatch[1].trim();
          winMargin = wonMatch[2].trim();
          winType = winMargin.toLowerCase().includes("run") ? "runs" : "wickets";
        }
      } else if (isTiedOrAbandoned) {
        resultStatement = liveStatusStr.replace(/\s*\(NPL\)/gi, "").trim();
      } else if (inn1 && inn2) {
        const inn1Runs = Number(inn1.runs) || 0;
        const inn2Runs = Number(inn2.runs) || 0;
        const inn2Wickets = Number(inn2.wickets) || 0;
        const inn1TeamId = String(inn1.batting_team_id);
        const inn1TeamName = inn1TeamId === team1Id ? team1Name : team2Name;
        const inn2TeamName = inn1TeamId === team1Id ? team2Name : team1Name;

        if (inn2Runs > inn1Runs) {
          const wktMargin = 10 - inn2Wickets;
          winnerName = inn2TeamName;
          winMargin = `${wktMargin} wicket${wktMargin === 1 ? "" : "s"}`;
          winType = "wickets";
          resultStatement = `${winnerName} won by ${winMargin}`;
        } else if (inn1Runs > inn2Runs) {
          const runMargin = inn1Runs - inn2Runs;
          winnerName = inn1TeamName;
          winMargin = `${runMargin} run${runMargin === 1 ? "" : "s"}`;
          winType = "runs";
          resultStatement = `${winnerName} won by ${winMargin}`;
        } else {
          resultStatement = "Match tied";
        }
      } else {
        resultStatement = "Match Completed";
      }

      if (winnerName) {
        if (team1Name && winnerName.toLowerCase().includes(team1Name.toLowerCase())) {
          winnerTeamSlug = dbMatch?.team1_id;
        } else if (team2Name && winnerName.toLowerCase().includes(team2Name.toLowerCase())) {
          winnerTeamSlug = dbMatch?.team2_id;
        }
      }
    } else {
      resultStatement = d.match?.current_summary || liveStatusStr || "";
    }

    // 1. Update Supabase matches table
    const targetStatus = isCompleted ? "completed" : "live";
    const { error: matchErr } = await sb
      .from("matches")
      .update({
        status: targetStatus,
        scores: {
          team1: team1Score ?? { runs: 0, wickets: 0, overs: "0.0" },
          team2: team2Score ?? { runs: 0, wickets: 0, overs: "0.0" },
          batters: batters.length > 0 ? batters : undefined,
          bowlers: bowlers.length > 0 ? bowlers : undefined,
        },
        result: isCompleted ? resultStatement : undefined,
        result_statement: resultStatement,
        winner_name: isCompleted ? winnerName : undefined,
        winner_team_id: isCompleted ? winnerTeamSlug : undefined,
        win_margin: isCompleted ? winMargin : undefined,
        win_type: isCompleted ? winType : undefined,
      })
      .eq("id", matchIdStr);

    if (matchErr) {
      console.error(`[SYNC M${matchNumber}] Error updating match:`, matchErr.message);
    } else {
      console.log(
        `[SYNC ${new Date().toLocaleTimeString()}] Match #${matchNumber} [${targetStatus.toUpperCase()}]: ${resultStatement}`
      );
    }

    // 2. Parse and sync commentary events
    const allBalls = [];
    for (const page of d.comms || []) {
      for (const b of page.ball || []) {
        allBalls.push(b);
      }
    }

    let inserted = 0;
    const activeStriker = batters.find((b) => b.isStriker)?.name || batters[0]?.name;
    const activeBowler = bowlers[0]?.name;

    for (const ball of allBalls.slice(0, 60)) {
      if (!ball.overs_actual) continue;
      const overNum = parseFloat(ball.overs_actual) || 0;
      const overInt = Math.floor(overNum);
      const ballInt = Math.round((overNum - overInt) * 10);
      const eventId = `espn_${espnMatchId}_${ball.overs_actual}`;

      const evStr = String(ball.event || "");
      const evLower = evStr.toLowerCase();
      const txtLower = String(ball.text || "").toLowerCase();

      const isWicket = Boolean(
        ball.dismissal ||
        evLower.includes("out") ||
        evLower.includes("wicket") ||
        txtLower.includes("out")
      );
      const isSix =
        evLower.includes("six") ||
        evLower.includes("6") ||
        txtLower.includes("six");
      const isFour =
        !isSix &&
        (evLower.includes("four") ||
          evLower.includes("4") ||
          txtLower.includes("four"));

      let runs = 0;
      if (isSix) {
        runs = 6;
      } else if (isFour) {
        runs = 4;
      } else {
        const runMatch = evLower.match(/(\d+)\s*run/);
        if (runMatch) {
          runs = parseInt(runMatch[1], 10) || 0;
        } else {
          runs = parseInt(evStr, 10) || 0;
        }
      }

      const rawBatter = ball.players ? ball.players.split(" to ")[1]?.trim() : activeStriker;
      const rawBowler = ball.players ? ball.players.split(" to ")[0]?.trim() : activeBowler;

      let commentaryText = ball.dismissal || ball.text;
      if (!commentaryText || commentaryText.trim() === "" || commentaryText === ball.event) {
        if (isWicket) {
          commentaryText = `OUT! ${rawBatter || "The batter"} is dismissed by ${rawBowler || "the bowler"}.`;
        } else if (isSix) {
          commentaryText = `SIX! ${rawBatter || "The batter"} hits a massive maximum off ${rawBowler || "the bowler"}!`;
        } else if (isFour) {
          commentaryText = `FOUR! ${rawBatter || "The batter"} drives it to the boundary off ${rawBowler || "the bowler"}.`;
        } else if (runs === 1) {
          commentaryText = `1 run. ${rawBatter || "The batter"} rotates the strike with a single off ${rawBowler || "the bowler"}.`;
        } else if (runs > 1) {
          commentaryText = `${runs} runs scored off ${rawBowler || "the bowler"}.`;
        } else {
          commentaryText = `Dot ball. Good delivery by ${rawBowler || "the bowler"}.`;
        }
      }

      const commentaryRow = {
        match_id: matchIdStr,
        external_event_id: eventId,
        over_number: overNum,
        ball_number: ballInt,
        event_type: isWicket ? "wicket" : (isFour || isSix) ? "boundary" : "ball",
        commentary_text: commentaryText,
        headline: isWicket ? "WICKET!" : isSix ? "SIX!" : isFour ? "FOUR!" : undefined,
        runs,
        is_wicket: isWicket,
        is_boundary: Boolean(isFour || isSix),
        is_six: Boolean(isSix),
        batter_name: rawBatter,
        bowler_name: rawBowler,
        provider: "manual",
      };

      const { error: commErr } = await sb
        .from("match_commentary")
        .upsert(commentaryRow, { onConflict: "match_id,external_event_id" });

      if (!commErr) inserted++;
    }

    // 3. Trigger standings and full stats recalculation when completed
    if (isCompleted) {
      try {
        await recalculateStandings("season-3");
        await syncCompletedMatchStats();
      } catch (err) {
        console.error(`[SYNC M${matchNumber}] Standings/stats recalculation error:`, err.message);
      }
    }
  } catch (err) {
    console.error(`[SYNC M${matchNumber}] Error:`, err.message);
  }
}

// Continuous background monitoring loop
async function runLoop() {
  console.log("[SYNC SERVICE] Started live sync daemon for NPL Season 3 matches...");
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

      // Also inspect the next upcoming match to auto-detect kickoff
      const { data: upcomingMatches } = await sb
        .from("matches")
        .select("id,match_number,status")
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
    } catch (err) {
      console.error("[SYNC LOOP] Loop error:", err.message);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
}

// Auto-run if executed as main script
runLoop();

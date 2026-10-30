const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558584.json", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const d = await res.json();
console.log("Match 3 status:", {
  result: d.match?.result,
  live_status: d.live?.status,
  current_summary: d.match?.current_summary
});
if (d.innings) {
  for (const inn of d.innings) {
    console.log(`Innings: Team ${inn.batting_team_id} - ${inn.runs}/${inn.wickets} in ${inn.overs} ov`);
  }
}
if (d.live?.batting) {
  console.log("Live batting:", d.live.batting.map(b => ({ id: b.player_id, runs: b.runs, balls: b.balls_faced })));
}
if (d.live?.bowling) {
  console.log("Live bowling:", d.live.bowling.map(bw => ({ id: bw.player_id, overs: bw.overs, conceded: bw.conceded, wickets: bw.wickets })));
}

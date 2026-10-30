const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558583.json", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const d = await res.json();
console.log("Innings count:", d.innings?.length);
for (let i = 0; i < (d.innings?.length || 0); i++) {
  const inn = d.innings[i];
  console.log(`\n--- Innings ${i+1}: Team ${inn.batting_team_id} (${inn.runs}/${inn.wickets} in ${inn.overs} ov) ---`);
  console.log("Batters in inn:", inn.batting?.length);
  for (const b of inn.batting || []) {
    console.log(`  ${b.player_id}: ${b.runs} runs (${b.balls_faced} balls, 4x${b.fours}, 6x${b.sixes}) - ${b.dismissal_name || b.dismissal_type_name || "not out"}`);
  }
  console.log("Bowlers in inn:", inn.bowling?.length);
  for (const bw of inn.bowling || []) {
    console.log(`  ${bw.player_id}: ${bw.overs} ov, ${bw.conceded} r, ${bw.wickets} w, econ ${bw.economy_rate}`);
  }
}

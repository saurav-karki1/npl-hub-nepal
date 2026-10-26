const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558582.html", {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  },
});
const html = await res.text();
const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
const json = JSON.parse(nextDataMatch[1]);
const d = json.props.appPageProps.data.data;

console.log("Awards:", d.content?.matchPlayerAwards);

for (const inn of d.content?.innings || []) {
  console.log(`\n=== INNINGS ${inn.inningNumber}: ${inn.team?.name} (${inn.runs}/${inn.wickets} in ${inn.overs} ov) ===`);
  console.log("BATSMEN:");
  for (const b of inn.inningBatsmen || []) {
    console.log(`  ${b.player?.fieldingName || b.player?.name}: ${b.runs} (${b.balls}) [4s: ${b.fours}, 6s: ${b.sixes}, SR: ${b.strikerate}]`);
  }
  console.log("BOWLERS:");
  for (const bw of inn.inningBowlers || []) {
    console.log(`  ${bw.player?.fieldingName || bw.player?.name}: ${bw.overs}-${bw.maidens}-${bw.conceded}-${bw.wickets} (Econ: ${bw.economy})`);
  }
}

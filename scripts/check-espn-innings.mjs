const res = await fetch("https://www.espncricinfo.com/series/nepal-premier-league-2026-27-1558581/biratnagar-kings-vs-chitwan-rhinos-2nd-match-1558583/full-scorecard", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (m) {
  const nextData = JSON.parse(m[1]);
  const innings = nextData.props?.appPageProps?.data?.content?.innings || [];
  console.log("Innings length:", innings.length);
  for (const inn of innings) {
    console.log(`\nInnings ${inn.inningNumber}: ${inn.team?.longName} (${inn.runs}/${inn.wickets} in ${inn.overs} ov)`);
    console.log("Batters count:", inn.inningBatsmen?.length);
    for (const b of (inn.inningBatsmen || []).slice(0, 5)) {
      console.log(`  ${b.player?.longName}: ${b.runs} (${b.balls}) 4s:${b.fours} 6s:${b.sixes} SR:${b.strikerate}`);
    }
    console.log("Bowlers count:", inn.inningBowlers?.length);
    for (const bw of (inn.inningBowlers || []).slice(0, 5)) {
      console.log(`  ${bw.player?.longName}: ${bw.overs} ov, ${bw.conceded} r, ${bw.wickets} w, econ:${bw.economy}`);
    }
  }
}

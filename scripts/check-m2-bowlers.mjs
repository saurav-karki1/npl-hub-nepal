const res = await fetch("https://www.espncricinfo.com/series/nepal-premier-league-2026-27-1558581/biratnagar-kings-vs-chitwan-rhinos-2nd-match-1558583/full-scorecard", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (m) {
  const nextData = JSON.parse(m[1]);
  const inn2 = nextData.props?.appPageProps?.data?.content?.innings?.[1];
  console.log("All bowlers in Innings 2:");
  for (const bw of inn2.inningBowlers || []) {
    console.log(`  ${bw.player?.longName}: ${bw.overs} ov, ${bw.maidens} m, ${bw.conceded} r, ${bw.wickets} w, econ: ${bw.economy}`);
  }
}

const res = await fetch("https://www.espncricinfo.com/series/nepal-premier-league-2026-27-1558581/biratnagar-kings-vs-chitwan-rhinos-2nd-match-1558583/full-scorecard", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (m) {
  const nextData = JSON.parse(m[1]);
  const inn1 = nextData.props?.appPageProps?.data?.content?.innings?.[0];
  console.log("Sample batter object:", inn1?.inningBatsmen?.[0]);
  console.log("Sample non-batted batter:", inn1?.inningBatsmen?.[10]);
}

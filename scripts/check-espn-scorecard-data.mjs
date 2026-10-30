const res = await fetch("https://www.espncricinfo.com/series/nepal-premier-league-2026-27-1558581/biratnagar-kings-vs-chitwan-rhinos-2nd-match-1558583/full-scorecard", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (m) {
  const nextData = JSON.parse(m[1]);
  const pageProps = nextData.props?.appPageProps;
  console.log("appPageProps keys:", Object.keys(pageProps || {}));
  const data = pageProps?.data;
  if (data) {
    console.log("data keys:", Object.keys(data));
    console.log("content keys:", data.content ? Object.keys(data.content) : null);
    if (data.content?.scorecard) {
      console.log("scorecard keys:", Object.keys(data.content.scorecard));
      console.log("scorecard.innings:", data.content.scorecard.innings?.length);
    }
    if (data.content?.matchPlayerAwards) {
      console.log("matchPlayerAwards:", data.content.matchPlayerAwards);
    }
  }
}

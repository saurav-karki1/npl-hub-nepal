const res = await fetch("https://www.espncricinfo.com/series/nepal-premier-league-2026-27-1558581/biratnagar-kings-vs-chitwan-rhinos-2nd-match-1558583/full-scorecard", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
console.log("Full scorecard status:", res.status);
if (res.ok) {
  const html = await res.text();
  console.log("HTML length:", html.length);
  // Look for __NEXT_DATA__
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (m) {
    console.log("Found __NEXT_DATA__!");
    const nextData = JSON.parse(m[1]);
    console.log("pageProps keys:", Object.keys(nextData.props?.pageProps || {}));
    const data = nextData.props?.pageProps?.data;
    if (data) {
      console.log("data keys:", Object.keys(data));
      if (data.scorecard) {
        console.log("Scorecard innings:", data.scorecard.innings?.length);
      }
    }
  }
}

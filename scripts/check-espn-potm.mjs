const res = await fetch("https://www.espncricinfo.com/series/nepal-premier-league-2026-27-1558581/biratnagar-kings-vs-chitwan-rhinos-2nd-match-1558583/full-scorecard", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (m) {
  const nextData = JSON.parse(m[1]);
  console.log("nextData keys:", Object.keys(nextData));
  console.log("nextData.query:", nextData.query);
  console.log("props keys:", Object.keys(nextData.props || {}));
}

// Search for player of the match in html
const potmMatches = html.match(/Player of the Match[^\n<]{0,100}/gi);
console.log("potm in html:", potmMatches);

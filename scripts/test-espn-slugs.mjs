async function testSlug(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow"
    });
    console.log(url, "-> status:", res.status, "finalUrl:", res.url);
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      console.log("Found __NEXT_DATA__?", Boolean(m));
      if (m) {
        const nextData = JSON.parse(m[1]);
        const data = nextData.props?.appPageProps?.data;
        console.log("Has scorecard data?", Boolean(data?.content?.innings));
        if (data?.content?.innings) {
          console.log("Innings:", data.content.innings.map(i => `${i.team?.name}: ${i.runs}/${i.wickets}`));
        }
      }
    }
  } catch (e) {
    console.log(url, "error:", e.message);
  }
}

// Test URL formats
await testSlug("https://www.espncricinfo.com/series/nepal-premier-league-2026-27-1558581/biratnagar-kings-vs-chitwan-rhinos-2nd-match-1558583/full-scorecard");
await testSlug("https://www.espncricinfo.com/series/nepal-premier-league-1558581/match-1558583/full-scorecard");
await testSlug("https://www.espncricinfo.com/series/a-1558581/b-1558583/full-scorecard");
await testSlug("https://www.espncricinfo.com/ci/engine/match/1558583.html");

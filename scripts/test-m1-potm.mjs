const res = await fetch("https://www.espncricinfo.com/series/a-1558581/b-1558582/full-scorecard", {
  headers: { "User-Agent": "Mozilla/5.0" },
  redirect: "follow"
});
const html = await res.text();
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (m) {
  const nextData = JSON.parse(m[1]);
  const data = nextData.props?.appPageProps?.data;
  console.log("Match 1 POTM:", data?.content?.matchPlayerAwards);
  console.log("Match 1 Innings:", data?.content?.innings?.map(i => `${i.team?.name}: ${i.runs}/${i.wickets}`));
}

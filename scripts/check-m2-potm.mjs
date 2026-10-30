const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558583.json", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const d = await res.json();
console.log("Match awards/potm:", {
  player_of_match: d.match?.player_of_match,
  mom: d.match?.mom,
  potm: d.match?.player_of_the_match,
  live_status: d.live?.status,
  break: d.live?.break
});

// Check all keys in d.match that might have player or award
for (const k of Object.keys(d.match || {})) {
  if (k.includes("player") || k.includes("award") || k.includes("man") || k.includes("potm") || k.includes("mom")) {
    console.log(`match.${k}:`, d.match[k]);
  }
}

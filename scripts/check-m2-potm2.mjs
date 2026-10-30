const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558583.json", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const d = await res.json();
console.log("Top level keys in d:", Object.keys(d));
if (d.description) console.log("description:", d.description);
if (d.series) console.log("series:", d.series);
if (d.official) console.log("official:", d.official);
// Check player of the match in innings or teams
for (const t of d.team || []) {
  for (const p of t.player || []) {
    if (p.player_of_match || p.mom || p.potm) {
      console.log("POTM player:", p.known_as);
    }
  }
}

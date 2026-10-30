const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558583.json", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const d = await res.json();
console.log("centre keys:", d.centre ? Object.keys(d.centre) : null);
console.log("match_card keys:", d.match_card ? Object.keys(d.match_card) : null);
console.log("middle_column keys:", d.middle_column ? Object.keys(d.middle_column) : null);
if (d.centre?.common) console.log("centre.common:", d.centre.common);
if (d.centre?.batting) console.log("centre.batting:", d.centre.batting);

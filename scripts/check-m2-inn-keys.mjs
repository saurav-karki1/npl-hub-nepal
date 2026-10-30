const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558583.json", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const d = await res.json();
console.log("Innings[0] keys:", Object.keys(d.innings[0]));
console.log("Innings[0]:", d.innings[0]);

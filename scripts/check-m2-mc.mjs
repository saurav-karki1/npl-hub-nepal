const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558583.json", {
  headers: { "User-Agent": "Mozilla/5.0" }
});
const d = await res.json();
console.log("typeof match_card:", typeof d.match_card);
console.log("slice(0, 500):", typeof d.match_card === "string" ? d.match_card.slice(0, 500) : JSON.stringify(d.match_card).slice(0, 500));

import fs from "fs";

const u = "https://en.wikipedia.org/w/api.php?action=parse&page=2026_Nepal_Premier_League&prop=wikitext&section=11&format=json";
const res = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } });
const data = await res.json();
const text = data.parse.wikitext["*"];

const rawMatches = text.split("{{Single-innings cricket match").slice(1);

const parsed = rawMatches.map((block, idx) => {
  const getField = (field) => {
    const regex = new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\|\\}\\n]+)`);
    const match = block.match(regex);
    return match ? match[1].trim() : null;
  };

  const cleanWiki = (val) => {
    if (!val) return null;
    return val.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1").replace(/<[^>]+>/g, "").trim();
  };

  return {
    matchNumber: idx + 1,
    date: cleanWiki(getField("date")),
    time: cleanWiki(getField("time")),
    team1: cleanWiki(getField("team1")),
    team2: cleanWiki(getField("team2")),
    score1: cleanWiki(getField("score1")),
    runs1: cleanWiki(getField("runs1")),
    wickets1: cleanWiki(getField("wickets1")),
    score2: cleanWiki(getField("score2")),
    runs2: cleanWiki(getField("runs2")),
    wickets2: cleanWiki(getField("wickets2")),
    result: cleanWiki(getField("result")),
    motm: cleanWiki(getField("motm")),
    toss: cleanWiki(getField("toss")),
    notes: cleanWiki(getField("notes")),
  };
});

fs.writeFileSync("scripts/wiki-matches.json", JSON.stringify(parsed, null, 2));
console.log("Parsed", parsed.length, "matches successfully.");
for (let i = 0; i < parsed.length; i++) {
  const m = parsed[i];
  console.log(`Match ${m.matchNumber}: ${m.date} | ${m.team1} vs ${m.team2} | Result: ${m.result} | MOTM: ${m.motm}`);
}

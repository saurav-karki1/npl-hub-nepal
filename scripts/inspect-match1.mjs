const res = await fetch("https://www.espncricinfo.com/ci/engine/match/1558582.json", {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  },
});
const d = await res.json();
console.log("innings object:", JSON.stringify(d.innings, null, 2));
console.log("live object:", JSON.stringify(d.live, null, 2));

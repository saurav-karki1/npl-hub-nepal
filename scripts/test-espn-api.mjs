async function testUrl(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    console.log(url, res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("Keys:", Object.keys(data));
      if (data.scorecard) console.log("Has scorecard!");
      if (data.centre) console.log("Has centre!");
      return data;
    }
  } catch (e) {
    console.log(url, "Error:", e.message);
  }
}

await testUrl("https://hs-consumer-api.espncricinfo.com/v1/pages/match/details?lang=en&seriesId=1558581&matchId=1558583");
await testUrl("https://hs-consumer-api.espncricinfo.com/v1/pages/match/scorecard?lang=en&seriesId=1558581&matchId=1558583");

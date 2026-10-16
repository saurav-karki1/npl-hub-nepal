const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const blocks = JSON.parse(require("fs").readFileSync("scripts/blocks.json","utf8"));
const payload = {
  id: "article-10",
  slug: "npl-season-3-squad-rankings-strongest-team",
  title: "NPL Season 3 Squad Rankings: Which Team Looks Strongest on Paper?",
  meta_title: "NPL Season 3 Squad Rankings: Which Team Looks Strongest?",
  meta_description: "Our comprehensive Nepal Premier League Season 3 squad rankings analyze all eight franchise rosters on paper ahead of the Kirtipur tournament opener on 26 October.",
  excerpt: "An independent editorial ranking of all eight Nepal Premier League Season 3 franchise squads — assessed on batting, bowling, overseas power and squad depth, with every score backed by confirmed player data.",
  content: { blocks },
  category: "Teams",
  status: "published",
  featured: true,
  image_url: "/images/news/npl-season-3-overseas-stars.webp",
  author: "NPL Hub Nepal Editorial Team",
  author_role: "Editorial Team",
  read_time: "8 min read",
  tags: ["NPL Season 3 squad rankings","Nepal Premier League","NPL 2026 squads"],
  published_at: "2026-10-14T10:00:00+05:45",
  updated_at: "2026-10-14T10:00:00+05:45"
};
async function run() {
  const { data: ex } = await supabase.from("news_articles").select("id").eq("slug","npl-season-3-squad-rankings-strongest-team").maybeSingle();
  if (ex) {
    const {error} = await supabase.from("news_articles").update(payload).eq("id",ex.id);
    if (error) { console.error(JSON.stringify(error)); process.exit(1); }
    console.log("Updated",ex.id);
  } else {
    const {error} = await supabase.from("news_articles").insert(payload);
    if (error) { console.error(JSON.stringify(error)); process.exit(1); }
    console.log("Inserted article-10");
  }
  await supabase.from("news_team_relations").delete().eq("article_id","article-10");
  const ids = ["lumbini-lions","janakpur-bolts","kathmandu-gorkhas","sudurpaschim-royals","chitwan-rhinos","biratnagar-kings","pokhara-avengers","karnali-yaks"];
  const {error:re} = await supabase.from("news_team_relations").insert(ids.map(id=>({article_id:"article-10",team_id:id})));
  if(re) console.error("Relations:",JSON.stringify(re)); else console.log("Relations OK:",ids.length);
}
run();

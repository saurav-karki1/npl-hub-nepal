import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const { data: topRuns } = await sb
  .from("player_season_stats")
  .select("player_name, team_name, runs, highest_score, strike_rate")
  .eq("season_id", "season-3")
  .not("runs", "is", null)
  .order("runs", { ascending: false })
  .limit(10);

console.log("Top 10 Run Scorers (Season 3):");
console.log(topRuns);

const { data: topWickets } = await sb
  .from("player_season_stats")
  .select("player_name, team_name, wickets, best_bowling, economy")
  .eq("season_id", "season-3")
  .not("wickets", "is", null)
  .order("wickets", { ascending: false })
  .limit(10);

console.log("\nTop 10 Wicket Takers (Season 3):");
console.log(topWickets);

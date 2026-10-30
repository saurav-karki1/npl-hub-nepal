import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const { data: awards, error: aErr } = await sb
  .from("tournament_awards")
  .select("*")
  .eq("season_id", "season-3");

console.log("Season 3 awards in Supabase:", awards);

const { data: stats, error: sErr } = await sb
  .from("player_season_stats")
  .select("*")
  .eq("season_id", "season-3")
  .limit(5);

console.log("Season 3 player stats in Supabase count:", stats?.length);
if (stats?.length > 0) {
  console.log("Sample stat row keys:", Object.keys(stats[0]));
  console.log("Sample stat row:", stats[0]);
}

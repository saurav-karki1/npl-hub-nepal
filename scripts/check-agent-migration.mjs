import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const admin = createClient(url, key);

console.log("Checking AI News Agent migration status...");

// 1. Check ai_generated column in news_articles
const { data: articles, error: colError } = await admin
  .from("news_articles")
  .select("id, slug, ai_generated")
  .limit(1);

if (colError) {
  console.log("❌ Column 'ai_generated' NOT detected in news_articles:", colError.message);
} else {
  console.log("✅ Column 'ai_generated' exists in news_articles! Sample:", articles);
}

// 2. Check agent_config table
const { data: config, error: configError } = await admin
  .from("agent_config")
  .select("*")
  .limit(1);

if (configError) {
  console.log("❌ Table 'agent_config' NOT found:", configError.message);
} else {
  console.log("✅ Table 'agent_config' exists! Row count:", config?.length);
}

// 3. Check agent_runs table
const { data: runs, error: runsError } = await admin
  .from("agent_runs")
  .select("id")
  .limit(1);

if (runsError) {
  console.log("❌ Table 'agent_runs' NOT found:", runsError.message);
} else {
  console.log("✅ Table 'agent_runs' exists! Row count:", runs?.length);
}

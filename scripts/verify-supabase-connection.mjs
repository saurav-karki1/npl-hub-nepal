/**
 * NPL Hub Nepal — Supabase Connection Verification Script
 *
 * Checks:
 * 1. Environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 * 2. API Gateway connectivity (REST endpoint ping)
 * 3. Auth token acceptance by PostgREST
 *
 * Run with: node --env-file=.env.local scripts/verify-supabase-connection.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log('====================================================');
console.log('NPL Hub Nepal — Supabase Connection Verification');
console.log('====================================================');

if (!url) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  process.exit(1);
}

if (!key) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) environment variable');
  process.exit(1);
}

console.log(`📡 Supabase Endpoint : ${url}`);
console.log(`🔑 Key Format         : ${key.startsWith('sb_publishable_') ? 'Supabase Publishable Key' : key.startsWith('eyJ') ? 'JWT Anon Key' : 'Standard Key'} (${key.substring(0, 14)}...)`);

const supabase = createClient(url, key);

async function verifyConnection() {
  try {
    const startTime = Date.now();
    // Query a known endpoint/schema ping
    const { data, error, status } = await supabase
      .from('seasons')
      .select('count', { count: 'exact', head: true });
    
    const latency = Date.now() - startTime;

    if (error) {
      // If table doesn't exist yet (PGRST205 / 404), the connection to Supabase was still 100% established and authenticated!
      if (error.code === 'PGRST205' || status === 404) {
        console.log(`\n✅ Connection Successful! (${latency}ms)`);
        console.log('ℹ️  Gateway reachable and authenticated. Tables have not yet been run against PostgreSQL (Schema migration pending execution).');
        console.log('ℹ️  PostgREST Response: PGRST205 (Table not in schema cache - Expected prior to SQL execution)');
        process.exit(0);
      } else {
        console.error(`\n❌ Supabase query returned error (${error.code || status}):`, error.message);
        process.exit(1);
      }
    } else {
      console.log(`\n✅ Connection Successful! (${latency}ms)`);
      console.log('✅ Connected to database tables.');
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ Unexpected network or client error:', err.message);
    process.exit(1);
  }
}

verifyConnection();

/**
 * NPL Hub Nepal — Supabase Seed Runner
 *
 * Executes supabase/seed.sql against the Supabase project using the
 * service-role key (required to bypass RLS for seeding).
 *
 * ⚠️  SERVICE ROLE KEY: Set via SUPABASE_SERVICE_ROLE_KEY environment variable.
 *     NEVER commit this key to Git. NEVER prefix it with NEXT_PUBLIC_.
 *
 * Run: node --env-file=.env.local scripts/run-seed.mjs
 *      (after adding SUPABASE_SERVICE_ROLE_KEY to .env.local)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedPath = path.resolve(__dirname, '../supabase/seed.sql');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('====================================================');
console.log('NPL Hub Nepal — Supabase Seed Runner');
console.log('====================================================');

if (!url) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('  To seed the database, add this variable to .env.local:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
  console.error('');
  console.error('  Find it in: Supabase Dashboard → Project Settings → API → service_role secret');
  console.error('  ⚠️  NEVER commit this key to Git or expose it in NEXT_PUBLIC_ variables.');
  process.exit(1);
}

console.log(`📡 Supabase URL: ${url}`);
console.log(`🔑 Service Role Key: ${serviceRoleKey.substring(0, 14)}... (hidden)`);

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const seedSql = fs.readFileSync(seedPath, 'utf8');

// Split SQL into individual statements for error tracking
// We use the Supabase rpc/execute approach via REST — execute as one transaction
console.log('\n📋 Executing seed.sql...');
console.log(`   File: ${seedPath}`);
console.log(`   Size: ${seedSql.length} bytes`);

const startTime = Date.now();

try {
  const { data, error } = await supabase.rpc('exec_sql_seed', { sql: seedSql }).catch(() => ({
    data: null,
    error: { message: 'rpc exec_sql_seed not found — using direct REST API instead' },
  }));

  if (error && error.message.includes('rpc exec_sql_seed not found')) {
    // Use Supabase Management API /pg/query endpoint instead
    const response = await fetch(`${url}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: seedSql }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`❌ REST API error ${response.status}:`, body.substring(0, 500));
      console.error('\n📋 The SQL is ready — please run supabase/seed.sql manually via the Supabase SQL Editor.');
      process.exit(1);
    }
    const result = await response.json();
    console.log('✅ Seed executed successfully via REST API');
    console.log(JSON.stringify(result).substring(0, 200));
  } else if (error) {
    throw error;
  } else {
    console.log('✅ Seed executed successfully via RPC');
  }
} catch (err) {
  console.error('❌ Seed error:', err);
  console.error('\n📋 Fallback: The SQL is ready. Run supabase/seed.sql manually via the Supabase SQL Editor.');
  process.exit(1);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n⏱  Completed in ${elapsed}s`);

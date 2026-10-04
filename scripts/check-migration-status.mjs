import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const admin = createClient(url, key);

// Check if external_provider exists
const { data, error } = await admin
  .from('matches')
  .select('id, slug, external_provider, external_match_id')
  .limit(1);

if (error) {
  console.log('Columns NOT yet in database (requires SQL Editor execution):', error.message);
  console.log('\nMigration file ready at: supabase/migrations/20261003000000_phase6b_live_data.sql');
  console.log('Execute this file in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/zohmcgjixebuiconrven/sql)');
} else {
  console.log('Columns EXIST in database! Sample:', data);
}

// Check match_commentary table
const { error: commError } = await admin.from('match_commentary').select('id').limit(1);
if (commError) {
  console.log('match_commentary table does not yet exist:', commError.message);
} else {
  console.log('match_commentary table exists!');
}

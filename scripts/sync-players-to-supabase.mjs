import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import { NPL_PLAYERS } from '../src/lib/data/players-data.ts';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseDate(val) {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const match = val.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthNames = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12'
    };
    const month = monthNames[match[2].toLowerCase()];
    if (month) return `${match[3]}-${month}-${day}`;
  }
  const match2 = val.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (match2) {
    const day = match2[2].padStart(2, '0');
    const monthNames = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12'
    };
    const month = monthNames[match2[1].toLowerCase()];
    if (month) return `${match2[3]}-${month}-${day}`;
  }
  return null;
}

async function main() {
  console.log(`Syncing ${NPL_PLAYERS.length} players to Supabase...`);

  // 1. Prepare players rows
  const playersRows = NPL_PLAYERS.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    display_name: p.displayName || null,
    nationality: p.nationality || 'Nepalese',
    date_of_birth: parseDate(p.dateOfBirth),
    birth_place: p.birthPlace || null,
    batting_style: p.battingStyle || null,
    bowling_style: p.bowlingStyle || null,
    profile_image: p.profileImage || null,
    bio: p.bio || null,
    updated_at: new Date().toISOString()
  }));

  const { error: pError } = await supabase
    .from('players')
    .upsert(playersRows, { onConflict: 'id' });

  if (pError) {
    console.error('Error upserting players:', pError);
    process.exit(1);
  }
  console.log(`✅ Upserted ${playersRows.length} players into Supabase`);

  // 2. Prepare player_seasons rows for season-3
  const psRows = NPL_PLAYERS.map(p => ({
    id: `season-3_${p.id}`,
    season_id: 'season-3',
    player_id: p.id,
    team_id: p.teamId,
    role: p.role,
    status: p.status || 'confirmed',
    captain: Boolean(p.captain),
    marquee: Boolean(p.marquee),
    confidence: p.confidence || 'confirmed',
    source: p.source || null,
    source_date: p.sourceDate || null,
    updated_at: new Date().toISOString()
  }));

  const { error: psError } = await supabase
    .from('player_seasons')
    .upsert(psRows, { onConflict: 'id' });

  if (psError) {
    console.error('Error upserting player_seasons:', psError);
    process.exit(1);
  }
  console.log(`✅ Upserted ${psRows.length} player_seasons for season-3 into Supabase`);

  // 3. Verify total in season-3
  const { data, count, error: countErr } = await supabase
    .from('player_seasons')
    .select('id', { count: 'exact' })
    .eq('season_id', 'season-3');

  if (!countErr) {
    console.log(`Verification: Supabase now has ${count || data?.length} players in season-3!`);
  }
}

main().catch(console.error);

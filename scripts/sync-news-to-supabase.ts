/**
 * Sync canonical news articles from src/lib/data/news-data.ts into Supabase
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import { NEWS_ARTICLES } from '../src/lib/data/news-data';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
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

async function main() {
  console.log(`Syncing ${NEWS_ARTICLES.length} canonical articles to Supabase at ${url}...`);

  for (const a of NEWS_ARTICLES) {
    console.log(`Processing article: ${a.id} (${a.slug})...`);
    const payload = {
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      category: a.category,
      status: a.status,
      featured: a.featured,
      image_url: a.imageUrl ?? null,
      author: a.author,
      author_role: 'Editorial',
      read_time: a.readTime,
      source: a.source ?? null,
      published_at: a.publishedAt,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('news_articles')
      .upsert(payload, { onConflict: 'id' })
      .select('id, slug, title, updated_at');

    if (error) {
      console.error(`❌ Error upserting ${a.id}:`, error.message);
    } else {
      console.log(`✅ Upserted ${a.id}: ${a.title}`);
    }

    // Sync team relations if any
    const teamIds = a.relatedTeamIds ?? [];
    if (teamIds.length > 0) {
      // Delete existing relations first
      await supabase.from('news_team_relations').delete().eq('article_id', a.id);
      // Re-insert
      const relRows = teamIds.map((teamId) => ({
        article_id: a.id,
        team_id: teamId,
      }));
      const { error: relError } = await supabase.from('news_team_relations').insert(relRows);
      if (relError) {
        console.error(`❌ Error inserting relations for ${a.id}:`, relError.message);
      } else {
        console.log(`   Linked ${teamIds.length} teams for ${a.id}`);
      }
    }
  }

  console.log('\nFinished sync!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

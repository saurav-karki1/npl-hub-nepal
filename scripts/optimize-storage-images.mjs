/**
 * NPL Hub Nepal — Storage Images Retroactive Optimizer
 *
 * Safely optimizes existing full-resolution PNG/JPG images in the Supabase Storage
 * 'article-images' bucket into compressed WebP format (max width 1200px, quality 80).
 *
 * Rules:
 * - Does NOT delete original storage files or records.
 * - Uploads new .webp alongside originals with 1-year immutable cache header.
 * - Updates news_articles.image_url references to the new .webp public URLs.
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = "https://zohmcgjixebuiconrven.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaG1jZ2ppeGVidWljb25ydmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxMDU5NCwiZXhwIjoyMTA2MTg2NTk0fQ.gvchNbBCDUdijT58NCpbwAQJSRcgPfyphmBvHhIX0Gw";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function optimizeStorageImages() {
  console.log("=== NPL Hub Nepal: Storage Image Optimization ===");

  // 1. Fetch all articles from news_articles to map image_url references
  const { data: articles, error: artErr } = await sb
    .from("news_articles")
    .select("id, slug, title, image_url");

  if (artErr) {
    console.error("Failed to query news_articles:", artErr.message);
    return;
  }

  // 2. Scan article-images bucket
  const { data: folders, error: fErr } = await sb.storage
    .from("article-images")
    .list("articles", { limit: 100 });

  if (fErr || !folders) {
    console.error("Failed to list articles directory:", fErr?.message);
    return;
  }

  let totalSavedBytes = 0;
  let optimizedCount = 0;
  let urlUpdatedCount = 0;

  for (const folder of folders) {
    const { data: files } = await sb.storage
      .from("article-images")
      .list(`articles/${folder.name}`);

    for (const file of files || []) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const fileSize = file.metadata?.size || file.size || 0;

      // Only optimize uncompressed raster images > 300KB
      if ((ext === "png" || ext === "jpg" || ext === "jpeg") && fileSize > 300 * 1024) {
        const originalPath = `articles/${folder.name}/${file.name}`;
        const baseName = file.name.substring(0, file.name.lastIndexOf("."));
        const webpPath = `articles/${folder.name}/${baseName}.webp`;

        console.log(`\nOptimizing: ${originalPath} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

        try {
          const { data: dlData, error: dlErr } = await sb.storage
            .from("article-images")
            .download(originalPath);

          if (dlErr || !dlData) {
            console.warn(`  Failed to download: ${dlErr?.message}`);
            continue;
          }

          const rawBuffer = Buffer.from(await dlData.arrayBuffer());
          const webpBuffer = await sharp(rawBuffer)
            .rotate()
            .resize(1200, null, { withoutEnlargement: true })
            .webp({ quality: 80, effort: 4 })
            .toBuffer();

          const newSize = webpBuffer.length;
          const savedBytes = fileSize - newSize;
          totalSavedBytes += savedBytes;

          console.log(`  Compressed to WebP: ${(newSize / 1024).toFixed(1)} KB (Saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB, ${Math.round((savedBytes / fileSize) * 100)}%)`);

          // Upload optimized WebP with 1-year immutable caching
          const { error: upErr } = await sb.storage
            .from("article-images")
            .upload(webpPath, webpBuffer, {
              contentType: "image/webp",
              cacheControl: "31536000, public, immutable",
              upsert: true,
            });

          if (upErr) {
            console.warn(`  Upload failed for ${webpPath}:`, upErr.message);
            continue;
          }

          optimizedCount++;

          // Get public URL of new WebP
          const { data: urlData } = sb.storage
            .from("article-images")
            .getPublicUrl(webpPath);

          const newPublicUrl = urlData.publicUrl;

          // Check if any news article referenced the old image
          for (const article of articles || []) {
            if (article.image_url && article.image_url.includes(file.name)) {
              console.log(`  Updating article reference: ${article.slug}`);
              const { error: patchErr } = await sb
                .from("news_articles")
                .update({ image_url: newPublicUrl, updated_at: new Date().toISOString() })
                .eq("id", article.id);

              if (!patchErr) {
                urlUpdatedCount++;
                console.log(`  Updated article ${article.slug} -> ${newPublicUrl}`);
              } else {
                console.warn(`  Failed to update article ${article.slug}:`, patchErr.message);
              }
            }
          }
        } catch (procErr) {
          console.warn(`  Error processing ${originalPath}:`, procErr.message);
        }
      }
    }
  }

  console.log("\n==============================================");
  console.log(`Optimization Complete!`);
  console.log(`Files optimized: ${optimizedCount}`);
  console.log(`Article URLs updated: ${urlUpdatedCount}`);
  console.log(`Total storage reduction: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log("==============================================");
}

optimizeStorageImages();

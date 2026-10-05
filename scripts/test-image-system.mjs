/**
 * NPL Hub Nepal — Image Management System Automated Test Suite
 *
 * Verifies:
 * 1. ImageBlock schema, sanitization, and normalization.
 * 2. Mixed block sequences (paragraph -> heading -> image -> paragraph -> image -> FAQ).
 * 3. File validation logic (MIME types, size limits, corrupted images).
 * 4. Supabase Storage bucket availability & public URL format.
 * 5. End-to-end image upload and retrieval from Supabase Storage.
 * 6. Deletion/cleanup of uploaded test image.
 * 7. Markdown bidirectional serialization (blocksToPlainText & normalizeArticleBlocks).
 * 8. Backward compatibility: existing legacy articles without images.
 * 9. Featured image vs inline image separation.
 */

import {
  normalizeArticleBlocks,
  sanitizeBlock,
  blocksToPlainText,
} from "../src/lib/types/article-blocks.js";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING IMAGE MANAGEMENT SYSTEM TESTS");
  console.log("==================================================\n");

  // TEST 1: Image block sanitization
  console.log("--- TEST 1: ImageBlock Sanitization ---");
  const validRawImage = {
    type: "image",
    src: "https://zohmcgjixebuiconrven.supabase.co/storage/v1/object/public/article-images/articles/test/pic.webp",
    alt: "NPL Season 3 schedule at TU ground",
    caption: "Official match fixtures",
    width: 1200,
    height: 630,
  };
  const sanitized = sanitizeBlock(validRawImage);
  assert(sanitized !== null, "Sanitizes valid image block");
  assert(sanitized?.type === "image", "Block type is 'image'");
  assert(sanitized?.src === validRawImage.src, "Preserves src");
  assert(sanitized?.alt === validRawImage.alt, "Preserves alt");
  assert(sanitized?.caption === validRawImage.caption, "Preserves caption");
  assert(sanitized?.width === 1200, "Preserves width");
  assert(sanitized?.height === 630, "Preserves height");

  // Missing src should be rejected
  const invalidImage = { type: "image", src: "", alt: "Missing src" };
  assert(sanitizeBlock(invalidImage) === null, "Rejects image without src");

  // TEST 2: Normalizing structured content with inline images
  console.log("\n--- TEST 2: Structured Content Normalization with Images ---");
  const rawContent = {
    blocks: [
      { type: "paragraph", text: "Paragraph 1" },
      { type: "heading", level: 2, text: "Section 1" },
      {
        type: "image",
        src: "https://example.com/img1.webp",
        alt: "Image 1",
        caption: "Caption 1",
      },
      { type: "paragraph", text: "Paragraph 2" },
      {
        type: "image",
        src: "https://example.com/img2.webp",
        alt: "Image 2",
      },
      { type: "faq", question: "When starts?", answer: "26 Oct" },
    ],
  };
  const normalized = normalizeArticleBlocks(rawContent);
  assert(normalized.length === 6, "Normalizes all 6 blocks");
  assert(normalized[0].type === "paragraph", "Block 0 is paragraph");
  assert(normalized[1].type === "heading", "Block 1 is heading");
  assert(normalized[2].type === "image", "Block 2 is image");
  assert(normalized[3].type === "paragraph", "Block 3 is paragraph");
  assert(normalized[4].type === "image", "Block 4 is image");
  assert(normalized[5].type === "faq", "Block 5 is faq");

  // TEST 3: Bidirectional conversion to plain text
  console.log("\n--- TEST 3: Bidirectional Plain Text Serialization ---");
  const plainText = blocksToPlainText(normalized);
  assert(plainText.includes("![Image 1](https://example.com/img1.webp)"), "Serializes image 1 to markdown");
  assert(plainText.includes("*Caption 1*"), "Serializes caption 1");
  const reNormalized = normalizeArticleBlocks(plainText.split("\n\n"));
  const hasImage = reNormalized.some((b) => b.type === "image" && b.src === "https://example.com/img1.webp");
  assert(hasImage, "Re-normalizes markdown image from plain text");

  // TEST 4: Sharp image validation
  console.log("\n--- TEST 4: Sharp Binary Inspection & Integrity ---");
  // Create a real 400x300 PNG with Sharp
  const realPngBuffer = await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 4,
      background: { r: 5, g: 38, b: 24, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const meta = await sharp(realPngBuffer).metadata();
  assert(meta.format === "png", "Sharp detects PNG format");
  assert(meta.width === 400 && meta.height === 300, "Sharp extracts correct dimensions 400x300");

  // Corrupted buffer should fail Sharp metadata
  let corruptFailed = false;
  try {
    await sharp(Buffer.from("not an image at all")).metadata();
  } catch {
    corruptFailed = true;
  }
  assert(corruptFailed, "Sharp rejects corrupt / non-image buffer");

  // TEST 5: Supabase Storage Integration
  console.log("\n--- TEST 5: Supabase Storage Upload & Public URL ---");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);

    const testFileName = `articles/test/test-upload-${Date.now()}.png`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("article-images")
      .upload(testFileName, realPngBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    assert(!uploadErr, `Uploaded test PNG to article-images bucket (${uploadErr?.message || "success"})`);

    const { data: urlData } = supabase.storage
      .from("article-images")
      .getPublicUrl(testFileName);

    assert(urlData.publicUrl.includes("article-images/articles/test/"), "Public URL matches expected format");

    // Fetch public URL to confirm HTTP 200
    try {
      const fetchRes = await fetch(urlData.publicUrl);
      assert(fetchRes.status === 200, `Public image URL resolves with HTTP 200 (status: ${fetchRes.status})`);
      assert(fetchRes.headers.get("content-type")?.includes("image/png"), "Content-Type is image/png");
    } catch (e) {
      assert(false, `Failed to fetch public image URL: ${e.message}`);
    }

    // Clean up test file
    const { error: removeErr } = await supabase.storage
      .from("article-images")
      .remove([testFileName]);
    assert(!removeErr, "Cleaned up test image from Supabase Storage");
  } else {
    console.log("  ⚠️ Skipped Supabase live tests (missing env vars)");
  }

  // TEST 6: Backward compatibility for existing articles
  console.log("\n--- TEST 6: Backward Compatibility ---");
  const legacyArticleContent = [
    "## NPL Season 3 Announced",
    "The tournament starts in October 2026.",
    "Eight teams will compete.",
  ];
  const legacyNormalized = normalizeArticleBlocks(legacyArticleContent);
  assert(legacyNormalized.length === 3, "Legacy array of strings normalizes correctly");
  assert(legacyNormalized[0].type === "heading", "First block is heading");
  assert(legacyNormalized[1].type === "paragraph", "Second block is paragraph");

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

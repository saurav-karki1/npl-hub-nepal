/**
 * NPL Hub Nepal — Icon Generation Script
 * Uses Sharp (bundled with Next.js) to produce all required icon files
 * from public/images/logo.png (512x512 PNG with alpha).
 *
 * Outputs:
 *   src/app/icon.png        — 512x512, logo with 20px safe margin on white bg
 *   src/app/apple-icon.png  — 180x180, logo on solid #052618 green background
 *   src/app/favicon.ico     — multi-size ICO: 16x16, 32x32, 48x48 (embedded PNGs)
 */

import sharp from "sharp";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logoPath = join(root, "public", "images", "logo.png");
const appDir = join(root, "src", "app");

// ─── Helper: create square image with logo on coloured background ─────────────
async function logoOnBackground(size, bgHex, margin) {
  const logoSize = size - margin * 2;
  const resized = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const background = { r: parseInt(bgHex.slice(1, 3), 16), g: parseInt(bgHex.slice(3, 5), 16), b: parseInt(bgHex.slice(5, 7), 16) };

  return sharp({
    create: { width: size, height: size, channels: 4, background: { ...background, alpha: 1 } },
  })
    .composite([{ input: resized, top: margin, left: margin }])
    .png()
    .toBuffer();
}

// ─── Helper: write a minimal ICO from an array of PNG Buffers ─────────────────
// ICO format: ICONDIR + N * ICONDIRENTRY + N * image data
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6; // ICONDIR
  const entrySize = 16; // ICONDIRENTRY each
  const dataOffset = headerSize + entrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(count, 4);

  const entries = [];
  const datas = [];
  let offset = dataOffset;

  for (const buf of pngBuffers) {
    // Read width/height from PNG IHDR (bytes 16-23)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const w = width >= 256 ? 0 : width;
    const h = height >= 256 ? 0 : height;

    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(w, 0);
    entry.writeUInt8(h, 1);
    entry.writeUInt8(0, 2); // color count (0=no palette)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    datas.push(buf);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...datas]);
}

async function main() {
  console.log("📐 Logo source:", logoPath);
  const meta = await sharp(logoPath).metadata();
  console.log(`   ${meta.width}×${meta.height} ${meta.format} (alpha: ${meta.hasAlpha})`);

  // 1. icon.png — 512×512, white background, 20px margin
  console.log("\n🖼  Generating src/app/icon.png (512×512)...");
  const icon512 = await logoOnBackground(512, "#ffffff", 20);
  const iconPath = join(appDir, "icon.png");
  writeFileSync(iconPath, icon512);
  const iconMeta = await sharp(iconPath).metadata();
  console.log(`   ✅ ${iconMeta.width}×${iconMeta.height} ${iconMeta.format}`);

  // 2. apple-icon.png — 180×180, dark green background, 14px margin
  console.log("\n🍎 Generating src/app/apple-icon.png (180×180)...");
  const apple180 = await logoOnBackground(180, "#052618", 14);
  const applePath = join(appDir, "apple-icon.png");
  writeFileSync(applePath, apple180);
  const appleMeta = await sharp(applePath).metadata();
  console.log(`   ✅ ${appleMeta.width}×${appleMeta.height} ${appleMeta.format}`);

  // 3. favicon.ico — 16×16, 32×32, 48×48 PNGs embedded in ICO
  console.log("\n🔖 Generating src/app/favicon.ico (16, 32, 48px)...");
  const sizes = [16, 32, 48];
  const pngBuffers = [];
  for (const s of sizes) {
    // Small sizes: white background, no margin (tight fit)
    const buf = await logoOnBackground(s, "#ffffff", 0);
    pngBuffers.push(buf);
    const m = await sharp(buf).metadata();
    console.log(`   PNG ${m.width}×${m.height}`);
  }
  const icoBuffer = buildIco(pngBuffers);
  const faviconPath = join(appDir, "favicon.ico");
  writeFileSync(faviconPath, icoBuffer);
  console.log(`   ✅ favicon.ico written (${icoBuffer.length} bytes, ${sizes.length} sizes)`);

  console.log("\n✅ All icons generated successfully.");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

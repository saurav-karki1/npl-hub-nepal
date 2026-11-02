/**
 * NPL Hub Nepal — Editorial Image Compositor
 *
 * Generates branded, high-contrast 1200x675 WebP feature images for news articles:
 * - Uses Cloudflare Flux background if available, or deterministic SVG constellation background
 * - Composites verified franchise crests (single team or head-to-head match matchup)
 * - Branded category pills (NPL Season 3 + Category)
 * - Safe typography overlay with high contrast and dark scrim
 * - Uploads directly to Supabase Storage "article-images" bucket via service role
 * - Zero empty images guarantee: Always produces a valid WebP image
 */

import path from "path";
import fs from "fs";
import sharp, { type OverlayOptions, type Sharp } from "sharp";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { ImageResult } from "./types";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 675;

interface CompositeImageOptions {
  title: string;
  category: string;
  teamIds?: string[];
  articleId: string;
  backgroundBuffer?: Buffer | null;
}

/**
 * Helper to split text into lines fitting the card width.
 */
function wrapText(text: string, maxCharsPerLine = 38): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 3) break; // Max 3 lines of title
    }
  }

  if (currentLine && lines.length < 3) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Escapes characters for safe inclusion in SVG text nodes.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates deterministic SVG background with constellation lines and rich sports gradients.
 */
function generateConstellationSvg(category: string): string {
  const primaryGlow = category === "Matches" ? "#38bdf8" : "#f59e0b";

  return `
  <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#040914" />
        <stop offset="50%" stop-color="#0b1736" />
        <stop offset="100%" stop-color="#111c44" />
      </linearGradient>
      <radialGradient id="glowTopRight" cx="85%" cy="20%" r="50%">
        <stop offset="0%" stop-color="${primaryGlow}" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#040914" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="glowBottomLeft" cx="15%" cy="85%" r="45%">
        <stop offset="0%" stop-color="#0284c7" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#040914" stop-opacity="0" />
      </radialGradient>
      <pattern id="cricketPitchLines" width="120" height="120" patternUnits="userSpaceOnUse">
        <path d="M 0 120 L 120 0 M 0 0 L 120 120" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1.5" />
      </pattern>
    </defs>

    <!-- Base Gradients -->
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#bgGrad)" />
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#cricketPitchLines)" />
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#glowTopRight)" />
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#glowBottomLeft)" />

    <!-- Stylized Constellation Geometry -->
    <g stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.2">
      <line x1="120" y1="80" x2="350" y2="150" />
      <line x1="350" y1="150" x2="600" y2="90" />
      <line x1="600" y1="90" x2="850" y2="180" />
      <line x1="850" y1="180" x2="1100" y2="100" />
      <line x1="350" y1="150" x2="250" y2="350" />
      <line x1="600" y1="90" x2="700" y2="320" />
      <line x1="850" y1="180" x2="1000" y2="400" />
    </g>

    <!-- Glowing Stars -->
    <circle cx="120" cy="80" r="4" fill="#38bdf8" opacity="0.6" />
    <circle cx="350" cy="150" r="5" fill="#f59e0b" opacity="0.7" />
    <circle cx="600" cy="90" r="4.5" fill="#38bdf8" opacity="0.8" />
    <circle cx="850" cy="180" r="5.5" fill="#f59e0b" opacity="0.6" />
    <circle cx="1100" cy="100" r="4" fill="#38bdf8" opacity="0.7" />
    <circle cx="250" cy="350" r="3.5" fill="#ffffff" opacity="0.4" />
    <circle cx="700" cy="320" r="4" fill="#ffffff" opacity="0.5" />
    <circle cx="1000" cy="400" r="3.5" fill="#ffffff" opacity="0.4" />
  </svg>
  `;
}

/**
 * Generates the SVG overlay for title, badges, and brand branding.
 *
 * FONT RENDERING: Sharp/librsvg on Windows servers does not automatically
 * load Windows system fonts via fontconfig. To guarantee readable text in
 * the rendered WebP we embed the Arial Bold font as a Base64 @font-face
 * directly inside the SVG <style> block. This forces librsvg/freetype to
 * use the embedded font data regardless of the OS font configuration.
 */
function generateTypographyOverlaySvg(
  title: string,
  category: string,
  hasTeams: boolean
): string {
  const lines = wrapText(title, hasTeams ? 30 : 38);
  const escapedCategory = escapeXml(category.toUpperCase());
  const pillText = `NPL SEASON 3 • ${escapedCategory}`;

  // Load and embed Arial Bold as Base64 so librsvg can render the text
  // regardless of the host OS fontconfig configuration.
  let fontFaceDeclaration = "";
  try {
    const fontPath = path.join(process.cwd(), "public", "fonts", "arialbd.ttf");
    if (fs.existsSync(fontPath)) {
      const fontBase64 = fs.readFileSync(fontPath).toString("base64");
      fontFaceDeclaration = `
        @font-face {
          font-family: 'NPLHeadline';
          src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
          font-weight: bold;
        }`;
    }
  } catch {
    // Font embedding failed — SVG will fall back to generic sans-serif
  }

  const fontFamily = fontFaceDeclaration
    ? "'NPLHeadline', Arial, sans-serif"
    : "Arial, 'Liberation Sans', sans-serif";

  const titleLinesSvg = lines
    .map((line, idx) => {
      const y = 322 + idx * 60;
      return `<text x="70" y="${y}" font-family="${fontFamily}" font-size="46" font-weight="bold" fill="#ffffff" letter-spacing="-0.01em">${escapeXml(line)}</text>`;
    })
    .join("\n");

  return `
  <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>${fontFaceDeclaration}
        text { font-family: ${fontFamily}; }
      </style>
      <linearGradient id="scrimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stop-color="#040914" stop-opacity="0.25" />
        <stop offset="38%"  stop-color="#040914" stop-opacity="0.72" />
        <stop offset="100%" stop-color="#040914" stop-opacity="0.96" />
      </linearGradient>
    </defs>

    <!-- Dark scrim for text legibility -->
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#scrimGrad)" />

    <!-- Category Pill -->
    <rect x="70" y="210" width="290" height="36" rx="6" fill="rgba(245,158,11,0.14)" stroke="#f59e0b" stroke-width="1.5" />
    <text x="215" y="234" font-family="${fontFamily}" font-size="12" font-weight="bold" fill="#f59e0b" letter-spacing="0.08em" text-anchor="middle">${pillText}</text>

    <!-- Main Headline -->
    ${titleLinesSvg}

    <!-- Bottom Brand Bar -->
    <rect x="70" y="580" width="1060" height="1" fill="rgba(255,255,255,0.12)" />
    <text x="70"  y="616" font-family="${fontFamily}" font-size="14" font-weight="bold" fill="#94a3b8" letter-spacing="0.05em">NPL HUB NEPAL • INDEPENDENT EDITORIAL DESK</text>
    <text x="1130" y="616" font-family="${fontFamily}" font-size="14" font-weight="bold" fill="#38bdf8" text-anchor="end">nplhubnepal.com</text>
  </svg>
  `;
}

/**
 * Finds the local filesystem path for a franchise crest.
 */
function findTeamCrestPath(teamSlug: string): string | null {
  const publicDir = path.join(process.cwd(), "public", "images", "teams");
  const webpPath = path.join(publicDir, `${teamSlug}.webp`);
  if (fs.existsSync(webpPath)) return webpPath;

  const pngPath = path.join(publicDir, `${teamSlug}.png`);
  if (fs.existsSync(pngPath)) return pngPath;

  return null;
}

/**
 * Finds the local logo path for default watermark/branding.
 */
function findLogoPath(): string | null {
  const logoWebp = path.join(process.cwd(), "public", "images", "logo.webp");
  if (fs.existsSync(logoWebp)) return logoWebp;

  const logoPng = path.join(process.cwd(), "public", "images", "logo.png");
  if (fs.existsSync(logoPng)) return logoPng;

  return null;
}

/**
 * Composites the full feature image and uploads to Supabase Storage.
 */
export async function compositeEditorialFeatureImage(
  options: CompositeImageOptions
): Promise<ImageResult> {
  const { title, category, teamIds = [], articleId, backgroundBuffer } = options;

  let basePipeline: Sharp;
  let isFallback = false;
  let generatorUsed: "cloudflare-flux" | "local-sharp-svg" = "local-sharp-svg";

  if (backgroundBuffer && backgroundBuffer.length > 0) {
    try {
      basePipeline = sharp(backgroundBuffer)
        .resize(CANVAS_WIDTH, CANVAS_HEIGHT, { fit: "cover" })
        .modulate({ brightness: 0.85, saturation: 1.1 });
      generatorUsed = "cloudflare-flux";
    } catch {
      basePipeline = sharp(Buffer.from(generateConstellationSvg(category)));
      isFallback = true;
    }
  } else {
    basePipeline = sharp(Buffer.from(generateConstellationSvg(category)));
    isFallback = true;
  }

  // Prepare layers for compositing
  const compositeLayers: OverlayOptions[] = [];

  // Team Crests
  const validTeamSlugs = teamIds.filter((t) => Boolean(findTeamCrestPath(t)));
  const hasTeams = validTeamSlugs.length > 0;

  if (validTeamSlugs.length === 1) {
    // Single franchise crest placed on right side
    const crestPath = findTeamCrestPath(validTeamSlugs[0])!;
    try {
      const resizedCrest = await sharp(crestPath)
        .resize(220, 220, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

      compositeLayers.push({
        input: resizedCrest,
        top: 200,
        left: 900,
      });
    } catch (err) {
      console.warn("[Image Compositor] Failed to overlay team crest:", err);
    }
  } else if (validTeamSlugs.length >= 2) {
    // Two teams matchup (Team 1 vs Team 2)
    const crest1Path = findTeamCrestPath(validTeamSlugs[0])!;
    const crest2Path = findTeamCrestPath(validTeamSlugs[1])!;

    try {
      const crest1Buf = await sharp(crest1Path)
        .resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

      const crest2Buf = await sharp(crest2Path)
        .resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

      compositeLayers.push(
        { input: crest1Buf, top: 180, left: 820 },
        { input: crest2Buf, top: 280, left: 980 }
      );
    } catch (err) {
      console.warn("[Image Compositor] Failed to overlay match crests:", err);
    }
  } else {
    // General NPL Hub Logo watermark on right
    const logoPath = findLogoPath();
    if (logoPath) {
      try {
        const logoBuf = await sharp(logoPath)
          .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer();
        compositeLayers.push({
          input: logoBuf,
          top: 220,
          left: 920,
        });
      } catch (err) {
        console.warn("[Image Compositor] Failed to overlay logo:", err);
      }
    }
  }

  // Overlay typography and scrim
  const typographySvg = generateTypographyOverlaySvg(title, category, hasTeams);
  compositeLayers.push({
    input: Buffer.from(typographySvg),
    top: 0,
    left: 0,
  });

  // Render final 1200x675 WebP
  const finalWebpBuffer = await basePipeline
    .composite(compositeLayers)
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  // Upload to Supabase Storage "article-images"
  const safeFolder = articleId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
  const storagePath = `articles/${safeFolder}/feature-${Date.now()}.webp`;

  let finalImageUrl = `/images/articles/editorial-default.webp`;

  try {
    const admin = getSupabaseAdminClient();
    const { error: uploadError } = await admin.storage
      .from("article-images")
      .upload(storagePath, finalWebpBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000, public, immutable",
        upsert: true,
      });

    if (uploadError) {
      console.warn("[Image Compositor] Storage upload warning:", uploadError.message);
      // Fallback: save to public/images/articles for local persistence if writable
      const localArticlesDir = path.join(process.cwd(), "public", "images", "articles");
      if (!fs.existsSync(localArticlesDir)) {
        fs.mkdirSync(localArticlesDir, { recursive: true });
      }
      const localFilename = `generated-${Date.now()}.webp`;
      fs.writeFileSync(path.join(localArticlesDir, localFilename), finalWebpBuffer);
      finalImageUrl = `/images/articles/${localFilename}`;
    } else {
      const { data: urlData } = admin.storage
        .from("article-images")
        .getPublicUrl(storagePath);
      finalImageUrl = urlData.publicUrl;
    }
  } catch (err) {
    console.warn("[Image Compositor] Supabase upload failed, using local file:", err);
    try {
      const localArticlesDir = path.join(process.cwd(), "public", "images", "articles");
      if (!fs.existsSync(localArticlesDir)) {
        fs.mkdirSync(localArticlesDir, { recursive: true });
      }
      const localFilename = `generated-${Date.now()}.webp`;
      fs.writeFileSync(path.join(localArticlesDir, localFilename), finalWebpBuffer);
      finalImageUrl = `/images/articles/${localFilename}`;
    } catch {
      finalImageUrl = `/images/og-image.png`;
    }
  }

  const teamNames = validTeamSlugs.map((s) => s.replace(/-/g, " ")).join(" vs ");
  const imageAlt = teamNames
    ? `Nepal Premier League: ${title} — featuring ${teamNames}`
    : `Nepal Premier League: ${title} — NPL Season 3`;

  const imageCaption = `Nepal Premier League Season 3 coverage: ${title}. Grounded reporting by NPL Hub Nepal.`;

  return {
    image_url: finalImageUrl,
    image_alt: imageAlt,
    image_caption: imageCaption,
    is_fallback: isFallback,
    generator_used: generatorUsed,
  };
}

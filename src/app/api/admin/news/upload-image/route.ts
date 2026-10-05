/**
 * NPL Hub Nepal — Admin Image Upload API Route
 *
 * Secure server-side endpoint for uploading article images (featured & inline)
 * to the Supabase Storage "article-images" bucket.
 *
 * Requirements:
 * - Admin authentication (Supabase Auth JWT Bearer token).
 * - File validation: MIME type, extension, size limit (10MB).
 * - Image integrity inspection via Sharp (guards against disguised executables).
 * - Unique safe file path generation (articles/{articleId}/{timestamp}-{random}.ext).
 * - Service-role client upload to Supabase Storage.
 * - Returns permanent public URL, dimensions (width, height), and format.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// Maximum upload file size: 10MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
]);

/** Verify the caller has a valid Supabase Auth session token */
async function verifyAuthSession(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header.");
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!anonKey) {
    throw new Error("Supabase public key is not configured.");
  }

  const anonClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Invalid or expired session token.");
  }

  return data.user;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin session
    await verifyAuthSession(req);

    // 2. Parse form-data
    const formData = await req.formData();
    const file = formData.get("file");
    const articleIdRaw = formData.get("articleId");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No image file provided in request." },
        { status: 400 }
      );
    }

    // 3. File size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File is too large (${(file.size / (1024 * 1024)).toFixed(
            1
          )}MB). Maximum allowed size is 10MB.`,
        },
        { status: 400 }
      );
    }

    // 4. MIME type check
    const mimeType = (file.type || "").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error: `Invalid file type (${mimeType || "unknown"}). Allowed formats: JPG, PNG, WebP, GIF, AVIF.`,
        },
        { status: 400 }
      );
    }

    // 5. Extension check from filename
    const originalName = file instanceof File ? file.name : "upload.webp";
    const extension = (originalName.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        {
          error: `Invalid file extension (.${extension}). Allowed: .jpg, .png, .webp, .gif, .avif.`,
        },
        { status: 400 }
      );
    }

    // 6. Convert to Buffer and inspect with Sharp (validates actual binary structure)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let imageMeta: SharpMetadata;
    try {
      imageMeta = await sharp(buffer).metadata();
    } catch {
      return NextResponse.json(
        {
          error:
            "File failed image integrity check. The file is corrupt or not a valid image.",
        },
        { status: 400 }
      );
    }

    if (!imageMeta.format || !imageMeta.width || !imageMeta.height) {
      return NextResponse.json(
        { error: "Could not read valid image dimensions from file." },
        { status: 400 }
      );
    }

    // 7. Generate safe unique storage path
    const safeArticleFolder =
      typeof articleIdRaw === "string" && articleIdRaw.trim()
        ? articleIdRaw.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
        : "general";

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const storagePath = `articles/${safeArticleFolder}/${timestamp}-${randomSuffix}.${extension}`;

    // 8. Upload to Supabase Storage via Service Role client
    const admin = getSupabaseAdminClient();
    const { error: uploadError } = await admin.storage
      .from("article-images")
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 9. Get public URL
    const { data: urlData } = admin.storage
      .from("article-images")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      width: imageMeta.width,
      height: imageMeta.height,
      format: imageMeta.format,
      size: file.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    const isAuth =
      message.includes("session") ||
      message.includes("Authorization") ||
      message.includes("Invalid");

    return NextResponse.json(
      { error: message },
      { status: isAuth ? 401 : 500 }
    );
  }
}

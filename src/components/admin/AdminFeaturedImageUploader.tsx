"use client";

import React, { useState, useRef } from "react";

interface AdminFeaturedImageUploaderProps {
  imageUrl: string;
  articleId: string;
  accessToken: string | null;
  onImageUrlChange: (url: string) => void;
}

export function AdminFeaturedImageUploader({
  imageUrl,
  articleId,
  accessToken,
  onImageUrlChange,
}: AdminFeaturedImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadFile = async (file: File) => {
    if (!accessToken) {
      setUploadError("Authentication required. Please re-login.");
      return;
    }

    // Client-side quick checks
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files (JPG, PNG, WebP, GIF, AVIF) are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("articleId", articleId || "general");
      formData.append("type", "featured");

      const res = await fetch("/api/admin/news/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(data.error || "Failed to upload image.");
        return;
      }

      onImageUrlChange(data.url);
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Network error uploading image."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // reset input so the same file could be selected again if replaced
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          Featured Image
        </label>
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-[10px] text-slate-500 hover:text-slate-300 underline"
        >
          {showManualInput ? "Hide Direct URL" : "Enter Direct URL"}
        </button>
      </div>

      {uploadError && (
        <div className="p-2.5 rounded bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center justify-between gap-2">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-400 hover:text-red-200 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload area or Preview */}
      {imageUrl ? (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-3">
          <div className="relative aspect-[16/9] w-full max-h-56 rounded-md overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Featured preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white text-xs font-medium">
                <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span>Uploading replacement...</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <span
              className="text-[11px] text-slate-400 truncate max-w-xs font-mono"
              title={imageUrl}
            >
              {imageUrl}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 transition-colors disabled:opacity-50"
              >
                Replace Image
              </button>
              <button
                type="button"
                onClick={() => onImageUrlChange("")}
                disabled={isUploading}
                className="px-2.5 py-1 text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded border border-red-800/40 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
            isDragOver
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
              : "border-slate-700 hover:border-slate-600 bg-slate-900/60 text-slate-400"
          }`}
        >
          {isUploading ? (
            <div className="py-4 flex flex-col items-center justify-center gap-2">
              <span className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-300">
                Uploading to Supabase Storage…
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-2xl">🖼</div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                >
                  Choose Image from Laptop
                </button>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  or drag and drop your image file here
                </p>
              </div>
              <p className="text-[10px] text-slate-500">
                JPG, PNG, WebP, GIF, AVIF (max 10MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual direct URL field (fallback / optional) */}
      {showManualInput && (
        <div className="pt-1">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            placeholder="https://... or /images/..."
            className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-md px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
          />
        </div>
      )}
    </div>
  );
}

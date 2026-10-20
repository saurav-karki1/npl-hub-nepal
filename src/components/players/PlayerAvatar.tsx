"use client";

import { useState } from "react";
import Image from "next/image";

interface PlayerAvatarProps {
  name: string;
  image?: string;
  size?: "sm" | "md" | "lg";
  crestBg?: string;
  crestText?: string;
  className?: string;
}

export function PlayerAvatar({
  name,
  image,
  size = "md",
  crestBg,
  crestText,
  className = "",
}: PlayerAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Generate initials for avatar fallback
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeStyles = {
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-18 h-18 sm:w-22 sm:h-22 text-2xl sm:text-3xl",
  };

  const imageDimensions = {
    sm: 36,
    md: 48,
    lg: 88,
  };

  const showImage = Boolean(image) && !hasError;

  return (
    <div
      style={{
        backgroundColor: crestBg || "var(--color-brand)",
        color: crestText || "#ffffff",
      }}
      className={`rounded-full font-black flex items-center justify-center shadow-2xs select-none overflow-hidden relative shrink-0 ${sizeStyles[size]} ${className}`}
      aria-label={name}
    >
      {showImage ? (
        <Image
          src={image!}
          alt={name}
          width={imageDimensions[size]}
          height={imageDimensions[size]}
          className="w-full h-full object-cover object-top"
          onError={() => setHasError(true)}
          priority={size === "lg"}
          sizes={`${imageDimensions[size]}px`}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

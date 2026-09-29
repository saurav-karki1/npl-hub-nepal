import Image from "next/image";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
  name: string;
  shortName?: string;
  initials?: string;
  logoUrl?: string;
  crestBg?: string;
  crestText?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-14 h-14 text-lg",
};

const pixelDimensions = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

export function TeamLogo({
  name,
  shortName,
  initials,
  logoUrl,
  crestBg = "#0a5c36",
  crestText = "#ffffff",
  size = "md",
  className,
  priority = false,
}: TeamLogoProps) {
  const dimension = pixelDimensions[size];
  const fallbackInitials = initials || shortName || name.slice(0, 2).toUpperCase();

  if (logoUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full shrink-0 flex items-center justify-center bg-white shadow-2xs ring-1 ring-black/10",
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={logoUrl}
          alt={`${name} official logo`}
          width={dimension}
          height={dimension}
          priority={priority}
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: crestBg, color: crestText }}
      className={cn(
        "rounded-full font-black flex items-center justify-center shrink-0 shadow-2xs select-none",
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {fallbackInitials}
    </div>
  );
}

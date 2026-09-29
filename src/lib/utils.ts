import { type ClassValue, clsx } from "clsx";

/**
 * cn — className utility
 *
 * Merges Tailwind classes safely using clsx.
 * No twMerge dependency needed at this stage — clsx alone
 * handles conditional classes without conflicts since we are
 * building the design system from scratch with consistent patterns.
 *
 * If class conflicts become common, twMerge can be added later.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}

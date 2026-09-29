/**
 * Button
 *
 * Sports-editorial button system.
 *
 * Variants:
 *   primary   — brand green, filled. Main CTAs.
 *   secondary — outlined border. Secondary actions.
 *   ghost     — no border/background. Nav links, icon buttons.
 *   danger    — red. Destructive actions.
 *
 * Sizes:
 *   sm        — compact, inline use
 *   md        — default
 *   lg        — prominent CTAs
 *
 * Design decisions:
 *   - Radius: 4px (editorial, not pill-shaped)
 *   - No shadows on buttons (they communicate hierarchy via color)
 *   - Focus ring uses brand color for accessibility
 *   - Disabled state is explicit and accessible
 */

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a loading spinner and disables interaction */
  loading?: boolean;
  /** Renders as a full-width block element */
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-brand)] text-white",
    "hover:bg-[var(--color-brand-mid)]",
    "active:bg-[var(--color-brand-dark)]",
    "border border-transparent",
    "disabled:bg-[var(--color-ink-faint)] disabled:cursor-not-allowed",
  ].join(" "),

  secondary: [
    "bg-transparent text-[var(--color-brand)]",
    "border border-[var(--color-brand)]",
    "hover:bg-[var(--color-brand-light)]",
    "active:bg-[var(--color-brand-light)]",
    "disabled:border-[var(--color-rule)] disabled:text-[var(--color-ink-faint)] disabled:cursor-not-allowed",
  ].join(" "),

  ghost: [
    "bg-transparent text-[var(--color-ink-secondary)]",
    "border border-transparent",
    "hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]",
    "active:bg-[var(--color-rule)]",
    "disabled:text-[var(--color-ink-faint)] disabled:cursor-not-allowed",
  ].join(" "),

  danger: [
    "bg-[var(--color-live)] text-white",
    "hover:bg-red-700",
    "active:bg-red-800",
    "border border-transparent",
    "disabled:bg-[var(--color-ink-faint)] disabled:cursor-not-allowed",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm font-medium gap-1.5",
  md: "px-4 py-2 text-sm font-semibold gap-2",
  lg: "px-6 py-3 text-base font-semibold gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          "rounded-[var(--radius-md)]",
          "transition-colors duration-150",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
          "select-none whitespace-nowrap",
          // Variant + size
          variantClasses[variant],
          sizeClasses[size],
          // Width
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * LinkButton
 *
 * Renders an <a> element with Button styling.
 * Use for navigation that looks like a button.
 */
interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <a
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-[var(--radius-md)]",
        "transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
        "select-none whitespace-nowrap cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}

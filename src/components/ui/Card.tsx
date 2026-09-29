/**
 * Card — foundational card components
 *
 * Sports-editorial style. Light, purposeful.
 * NOT a glassmorphism card, NOT a heavy floating card.
 *
 * Use cards when they genuinely help organize information —
 * match results, player profiles, news items.
 * Do NOT wrap every section in a card.
 *
 * Components:
 *   Card          — base container
 *   CardHeader    — optional section above content
 *   CardBody      — padded content area
 *   CardFooter    — optional section below content
 *   CardLabel     — eyebrow text (e.g. "MATCH RESULT")
 *   StatusBadge   — live/upcoming/result/etc. indicators
 */

import { cn } from "@/lib/utils";

/* ── Card ── */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Adds a hover/click style. Use for clickable cards. */
  interactive?: boolean;
  as?: React.ElementType;
}

export function Card({ children, className, interactive, as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={cn(
        "bg-[var(--color-canvas)] border border-[var(--color-rule)]",
        "rounded-[var(--radius-lg)]",
        interactive && [
          "cursor-pointer",
          "hover:border-[var(--color-brand)]",
          "hover:shadow-[var(--shadow-card)]",
          "transition-[border-color,box-shadow] duration-150",
        ],
        className
      )}
    >
      {children}
    </Tag>
  );
}

/* ── CardHeader ── */

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-b border-[var(--color-rule)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── CardBody ── */

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  /** Remove default padding (for tables, images, etc.) */
  flush?: boolean;
}

export function CardBody({ children, className, flush }: CardBodyProps) {
  return (
    <div className={cn(!flush && "px-4 py-4", className)}>
      {children}
    </div>
  );
}

/* ── CardFooter ── */

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-t border-[var(--color-rule)] bg-[var(--color-surface)]",
        "rounded-b-[var(--radius-lg)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── CardLabel ── */

interface CardLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function CardLabel({ children, className }: CardLabelProps) {
  return (
    <span className={cn("text-label", className)}>{children}</span>
  );
}

/* ── StatusBadge ── */

type StatusType = "live" | "upcoming" | "completed" | "cancelled" | "neutral";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot?: boolean; defaultLabel: string }> = {
  live: {
    bg: "bg-[var(--color-live-bg)]",
    text: "text-[var(--color-live)]",
    dot: true,
    defaultLabel: "LIVE",
  },
  upcoming: {
    bg: "bg-blue-50",
    text: "text-[var(--color-upcoming)]",
    defaultLabel: "UPCOMING",
  },
  completed: {
    bg: "bg-[var(--color-surface)]",
    text: "text-[var(--color-ink-muted)]",
    defaultLabel: "RESULT",
  },
  cancelled: {
    bg: "bg-[var(--color-surface)]",
    text: "text-[var(--color-ink-faint)]",
    defaultLabel: "CANCELLED",
  },
  neutral: {
    bg: "bg-[var(--color-surface)]",
    text: "text-[var(--color-ink-muted)]",
    defaultLabel: "",
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.defaultLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-2 py-0.5",
        "rounded-[var(--radius-sm)]",
        "text-[0.6875rem] font-bold tracking-wide uppercase",
        config.bg,
        config.text,
        className
      )}
    >
      {config.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-[var(--color-live)] animate-pulse"
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}

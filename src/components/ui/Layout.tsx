/**
 * Container
 *
 * Standard page-width container.
 * Provides consistent horizontal padding and max-width.
 * Use this on every page and section that needs to be constrained.
 *
 * Variants:
 *   default  — 1280px max (full editorial width)
 *   narrow   — 768px max (article / form pages)
 *   wide     — 1440px max (dashboards, data-heavy views)
 */

import { cn } from "@/lib/utils";

type ContainerVariant = "default" | "narrow" | "wide";

interface ContainerProps {
  children: React.ReactNode;
  variant?: ContainerVariant;
  className?: string;
  as?: React.ElementType;
}

const variantClasses: Record<ContainerVariant, string> = {
  narrow:  "max-w-3xl",
  default: "max-w-screen-xl",
  wide:    "max-w-screen-2xl",
};

export function Container({
  children,
  variant = "default",
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * PageWrapper
 *
 * Wraps a full page with consistent top/bottom spacing.
 * Composed on top of Container.
 */
interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <Container className={cn("py-8 sm:py-12", className)}>
      {children}
    </Container>
  );
}

/**
 * Section
 *
 * Consistent section spacing within a page.
 * Use between logical groups of content.
 */
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function Section({ children, className, as: Tag = "section" }: SectionProps) {
  return (
    <Tag className={cn("py-8 sm:py-12", className)}>
      {children}
    </Tag>
  );
}

/**
 * SectionHeader
 *
 * Editorial section heading with accent rule.
 * Matches the sports-media style: bold title with a brand-color top rule.
 */
interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Optional right-aligned link text + href */
  action?: { label: string; href: string };
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="border-t-2 border-[var(--color-brand)] mb-2" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-section-title">{title}</h2>
          {description && (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{description}</p>
          )}
        </div>
        {action && (
          <a
            href={action.href}
            className="text-[0.8125rem] font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-mid)] transition-colors shrink-0"
          >
            {action.label} →
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Table — sports data table foundation
 *
 * Cricket tables (points table, scorecard, stats) need:
 *   - Clear column alignment
 *   - Readable on small screens (horizontal scroll)
 *   - Highlighted rows (top position, current team, etc.)
 *   - Sticky first column on mobile
 *
 * Design decisions:
 *   - Thin borders (1px), rule color only
 *   - Header uses brand color left-border for emphasis
 *   - Zebra striping is OFF by default (clutters cricket tables)
 *   - Compact by default, spacious option for readability
 *   - No rounded borders (editorial tables are square)
 *
 * Usage:
 *   <TableWrapper>
 *     <Table>
 *       <TableHead>
 *         <tr>
 *           <Th>Team</Th>
 *           <Th numeric>M</Th>
 *         </tr>
 *       </TableHead>
 *       <TableBody>
 *         <TableRow>
 *           <Td>Kathmandu Kings</Td>
 *           <Td numeric>8</Td>
 *         </TableRow>
 *       </TableBody>
 *     </Table>
 *   </TableWrapper>
 */

import { cn } from "@/lib/utils";

/* ── TableWrapper — handles horizontal overflow on mobile ── */

interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function TableWrapper({ children, className }: TableWrapperProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto",
        "-mx-0", // cancel any parent padding if needed via className
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── Table ── */

interface TableProps {
  children: React.ReactNode;
  className?: string;
  /** Spacious adds more cell padding */
  spacious?: boolean;
}

export function Table({ children, className, spacious }: TableProps) {
  return (
    <table
      className={cn(
        "w-full border-collapse text-sm",
        spacious ? "text-base" : "text-sm",
        className
      )}
    >
      {children}
    </table>
  );
}

/* ── TableHead ── */

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead
      className={cn(
        "border-b-2 border-[var(--color-brand)]",
        className
      )}
    >
      {children}
    </thead>
  );
}

/* ── Th — header cell ── */

interface ThProps {
  children: React.ReactNode;
  className?: string;
  /** Right-align numeric columns */
  numeric?: boolean;
  /** Tooltip / screen-reader label for abbreviated headers */
  title?: string;
  scope?: "col" | "row" | "colgroup" | "rowgroup";
}

export function Th({
  children,
  className,
  numeric,
  title,
  scope = "col",
}: ThProps) {
  return (
    <th
      scope={scope}
      title={title}
      className={cn(
        "px-3 py-2.5",
        "text-[0.6875rem] font-bold uppercase tracking-wide",
        "text-[var(--color-ink-muted)]",
        "whitespace-nowrap",
        numeric ? "text-right" : "text-left",
        className
      )}
    >
      {children}
    </th>
  );
}

/* ── TableBody ── */

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-[var(--color-rule)]", className)}>
      {children}
    </tbody>
  );
}

/* ── TableRow ── */

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  /** Highlights the row (e.g. current user's team, top position) */
  highlighted?: boolean;
  /** Makes row clickable */
  interactive?: boolean;
  onClick?: () => void;
}

export function TableRow({
  children,
  className,
  highlighted,
  interactive,
  onClick,
}: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "hover:bg-[var(--color-surface)] transition-colors",
        highlighted && "bg-[var(--color-brand-light)] font-semibold",
        interactive && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

/* ── Td — data cell ── */

interface TdProps {
  children?: React.ReactNode;
  className?: string;
  /** Right-align numeric data */
  numeric?: boolean;
  /** Muted styling for secondary data */
  muted?: boolean;
}

export function Td({ children, className, numeric, muted }: TdProps) {
  return (
    <td
      className={cn(
        "px-3 py-2.5",
        "whitespace-nowrap",
        numeric ? "text-right tabular-nums" : "text-left",
        muted ? "text-[var(--color-ink-muted)]" : "text-[var(--color-ink)]",
        className
      )}
    >
      {children}
    </td>
  );
}

/* ── TableCaption ── */

interface TableCaptionProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCaption({ children, className }: TableCaptionProps) {
  return (
    <caption
      className={cn(
        "text-left py-2 text-[0.8125rem] text-[var(--color-ink-muted)]",
        className
      )}
    >
      {children}
    </caption>
  );
}

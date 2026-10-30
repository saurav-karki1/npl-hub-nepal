import React from "react";
import Link from "next/link";
import { TableBlock, TableStyle, ColumnAlignment } from "@/lib/types/article-blocks";
import { NPL_TEAM_DETAILS, TeamDetail } from "@/lib/data/teams-data";
import { TeamLogo } from "@/components/ui/TeamLogo";

interface RichArticleTableProps {
  table: TableBlock;
  className?: string;
  isEditorPreview?: boolean;
}

/**
 * Normalizes text to check for franchise mentions and matches with NPL_TEAM_DETAILS.
 */
function matchFranchiseTeam(text: string): TeamDetail | undefined {
  const clean = text.toLowerCase().trim();
  return NPL_TEAM_DETAILS.find((t) => {
    const tName = t.name.toLowerCase();
    const tSlug = t.slug.toLowerCase();
    const tShort = t.shortName.toLowerCase();
    return (
      clean === tName ||
      clean === tSlug ||
      clean.startsWith(tName) ||
      clean.includes(tName) ||
      clean === tShort
    );
  });
}

/**
 * Escapes unsafe HTML characters to prevent XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Safely parses simple rich text (links, bold, italic) without allowing arbitrary HTML execution.
 */
function renderSafeCellContent(cellText: string, allowTeamLogo = true): React.ReactNode {
  if (!cellText) return <span className="text-slate-500">—</span>;

  // 1. Check if cell is an exact or prefixed team name
  const matchedTeam = allowTeamLogo ? matchFranchiseTeam(cellText) : undefined;

  // 2. Parse markdown links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(cellText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderInlineText(cellText.substring(lastIndex, match.index)));
    }
    const linkText = match[1];
    const linkUrl = match[2];
    const isInternal = linkUrl.startsWith("/") || linkUrl.startsWith("#");

    parts.push(
      isInternal ? (
        <Link
          key={`${match.index}-${linkUrl}`}
          href={linkUrl}
          className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 decoration-emerald-500/50"
        >
          {renderInlineText(linkText)}
        </Link>
      ) : (
        <a
          key={`${match.index}-${linkUrl}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 decoration-emerald-500/50"
        >
          {renderInlineText(linkText)}
        </a>
      )
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cellText.length) {
    parts.push(renderInlineText(cellText.substring(lastIndex)));
  }

  if (matchedTeam) {
    return (
      <div className="inline-flex items-center gap-2">
        <TeamLogo
          name={matchedTeam.name}
          shortName={matchedTeam.shortName}
          initials={matchedTeam.initials}
          logoUrl={matchedTeam.logoUrl}
          crestBg={matchedTeam.crestBg}
          crestText={matchedTeam.crestText}
          size="xs"
        />
        <span>{parts}</span>
      </div>
    );
  }

  return <>{parts}</>;
}

/**
 * Helper to render inline formatting: bold (**), italic (*).
 */
function renderInlineText(rawText: string): React.ReactNode {
  // Split on bold (**...**)
  const boldParts = rawText.split(/(\*\*[^*]+\*\*)/g);

  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith("**") && bPart.endsWith("**")) {
      const boldText = bPart.slice(2, -2);
      return (
        <strong key={bIdx} className="font-bold text-white">
          {renderItalic(boldText)}
        </strong>
      );
    }
    return <React.Fragment key={bIdx}>{renderItalic(bPart)}</React.Fragment>;
  });
}

function renderItalic(text: string): React.ReactNode {
  // Split on italic (*...*)
  const italicParts = text.split(/(\*[^*]+\*)/g);

  return italicParts.map((iPart, iIdx) => {
    if (iPart.startsWith("*") && iPart.endsWith("*") && !iPart.startsWith("**")) {
      return (
        <em key={iIdx} className="italic text-slate-300">
          {iPart.slice(1, -1)}
        </em>
      );
    }
    return iPart;
  });
}

/**
 * Alignment class helper.
 */
function getAlignmentClass(alignment?: ColumnAlignment): string {
  switch (alignment) {
    case "center":
      return "text-center";
    case "right":
      return "text-right font-mono";
    case "left":
    default:
      return "text-left";
  }
}

export function RichArticleTable({
  table,
  className = "",
  isEditorPreview = false,
}: RichArticleTableProps) {
  const {
    caption,
    style = "standard",
    headers = [],
    rows = [],
    alignments = [],
    highlightRows = [],
  } = table;

  if (headers.length === 0 && rows.length === 0) {
    return null;
  }

  // Visual Theme mapping based on TableStyle
  const theme = {
    standard: {
      wrapper: "border-slate-800 bg-[#0a101d]",
      headerBg: "bg-slate-900 border-b border-slate-700/80 text-slate-200",
      th: "text-slate-300 font-bold",
      rowEven: "bg-[#0c121e]/80",
      rowOdd: "bg-[#090e18]/40",
      rowHover: "hover:bg-slate-800/40",
      border: "border-slate-800",
      cellText: "text-slate-300",
      captionBg: "bg-slate-900/90 text-slate-300 border-b border-slate-800",
    },
    highlight: {
      wrapper: "border-emerald-800/50 bg-[#081318]",
      headerBg: "bg-emerald-950/80 border-b-2 border-emerald-600/40 text-emerald-200",
      th: "text-emerald-300 font-bold uppercase tracking-wider",
      rowEven: "bg-[#061014]/90",
      rowOdd: "bg-[#040b0e]/60",
      rowHover: "hover:bg-emerald-950/40",
      border: "border-emerald-950/80",
      cellText: "text-slate-200",
      captionBg: "bg-emerald-950/90 text-emerald-300 border-b border-emerald-800/60",
    },
    comparison: {
      wrapper: "border-slate-700/80 bg-[#0b1320]",
      headerBg: "bg-slate-850 border-b-2 border-slate-600 text-white",
      th: "text-white font-extrabold tracking-wide",
      rowEven: "bg-[#0c1422]/90",
      rowOdd: "bg-[#080d16]/60",
      rowHover: "hover:bg-slate-800/50",
      border: "border-slate-800 divide-x divide-slate-800",
      cellText: "text-slate-200",
      captionBg: "bg-slate-850 text-slate-200 border-b border-slate-700",
    },
    compact: {
      wrapper: "border-slate-800 bg-[#090d16]",
      headerBg: "bg-slate-900/90 border-b border-slate-800 text-slate-300",
      th: "text-slate-400 font-semibold uppercase tracking-wider text-[10px]",
      rowEven: "bg-[#0b101c]/80",
      rowOdd: "bg-[#080c14]/40",
      rowHover: "hover:bg-slate-850",
      border: "border-slate-850",
      cellText: "text-slate-300",
      captionBg: "bg-slate-900/90 text-slate-300 border-b border-slate-800",
    },
  }[style as TableStyle] || {
    wrapper: "border-slate-800 bg-[#0a101d]",
    headerBg: "bg-slate-900 border-b border-slate-700/80 text-slate-200",
    th: "text-slate-300 font-bold",
    rowEven: "bg-[#0c121e]/80",
    rowOdd: "bg-[#090e18]/40",
    rowHover: "hover:bg-slate-800/40",
    border: "border-slate-800",
    cellText: "text-slate-300",
    captionBg: "bg-slate-900/90 text-slate-300 border-b border-slate-800",
  };

  const isCompact = style === "compact";
  const paddingCell = isCompact ? "py-1.5 px-3 text-xs" : "py-2.5 px-4 text-xs sm:text-sm";
  const paddingTh = isCompact ? "py-2 px-3 text-[10px]" : "py-3 px-4 text-[11px] sm:text-xs";

  return (
    <div className={`my-6 space-y-1.5 ${className}`}>
      {/* Container with rounded border & horizontal scroll */}
      <div
        className={`rounded-xl border overflow-hidden shadow-sm transition-colors ${theme.wrapper}`}
      >
        {/* Table Caption / Header Title */}
        {caption && (
          <div
            className={`px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-tight ${theme.captionBg}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">📊</span>
              <span>{caption}</span>
            </div>
            {isEditorPreview && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                Preview: {style.toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* Scrollable table viewport */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full border-collapse min-w-full text-left">
            {headers.length > 0 && (
              <thead className={theme.headerBg}>
                <tr>
                  {headers.map((h, hIdx) => {
                    const alignClass = getAlignmentClass(alignments[hIdx]);
                    return (
                      <th
                        key={hIdx}
                        scope="col"
                        className={`${paddingTh} ${theme.th} ${alignClass} uppercase tracking-wider font-bold whitespace-nowrap`}
                      >
                        {renderSafeCellContent(h, false)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
            )}

            <tbody className="divide-y divide-slate-800/80">
              {rows.map((row, rIdx) => {
                const isHighlighted = highlightRows.includes(rIdx);
                const zebraBg = rIdx % 2 === 0 ? theme.rowEven : theme.rowOdd;

                // Special row highlight styling
                const rowStyleClass = isHighlighted
                  ? "bg-amber-950/20 border-l-4 border-l-amber-400 font-semibold"
                  : zebraBg;

                return (
                  <tr
                    key={rIdx}
                    className={`transition-colors ${rowStyleClass} ${theme.rowHover}`}
                  >
                    {row.map((cell, cIdx) => {
                      const alignClass = getAlignmentClass(alignments[cIdx]);
                      const isFirstCol = cIdx === 0;

                      // For highlighted statistics table (Style B): emphasize rank or primary number
                      const isRankCol =
                        style === "highlight" && isFirstCol && /^[0-9]+$/.test(cell.trim());
                      const rankNum = isRankCol ? parseInt(cell.trim(), 10) : 0;

                      return (
                        <td
                          key={cIdx}
                          className={`${paddingCell} ${alignClass} ${theme.cellText} whitespace-nowrap`}
                        >
                          {isRankCol ? (
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                                rankNum === 1
                                  ? "bg-amber-400 text-slate-950 shadow-sm"
                                  : rankNum === 2
                                  ? "bg-slate-300 text-slate-950"
                                  : rankNum === 3
                                  ? "bg-amber-700 text-white"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {cell}
                            </span>
                          ) : (
                            renderSafeCellContent(cell, isFirstCol || cell.length > 3)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Horizontal Scroll Indicator (shown only on small screens) */}
      <div className="block sm:hidden text-center">
        <span className="text-[10px] text-slate-500 font-medium">
          ← Swipe to view complete table →
        </span>
      </div>
    </div>
  );
}

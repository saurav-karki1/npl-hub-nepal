"use client";

import React, { useState } from "react";
import { TableBlock, TableStyle, ColumnAlignment } from "@/lib/types/article-blocks";
import { RichArticleTable } from "@/components/news/RichArticleTable";

interface AdminTableBlockEditorProps {
  block: TableBlock;
  blockIndex: number;
  onChange: (updated: TableBlock) => void;
}

export function AdminTableBlockEditor({
  block,
  blockIndex,
  onChange,
}: AdminTableBlockEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const headers = block.headers && block.headers.length > 0 ? block.headers : ["Column 1", "Column 2"];
  const rows = block.rows && block.rows.length > 0 ? block.rows : [["", ""]];
  const style: TableStyle = block.style || "standard";
  const alignments: ColumnAlignment[] = block.alignments || headers.map(() => "left");
  const highlightRows = block.highlightRows || [];

  // Update caption
  const handleCaptionChange = (caption: string) => {
    onChange({ ...block, caption });
  };

  // Update style
  const handleStyleChange = (newStyle: TableStyle) => {
    onChange({ ...block, style: newStyle });
  };

  // Add column
  const handleAddColumn = () => {
    const newHeaders = [...headers, `Col ${headers.length + 1}`];
    const newAlignments = [...alignments, "left" as ColumnAlignment];
    const newRows = rows.map((r) => [...r, ""]);
    onChange({
      ...block,
      headers: newHeaders,
      alignments: newAlignments,
      rows: newRows,
    });
  };

  // Remove column
  const handleRemoveColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, idx) => idx !== colIdx);
    const newAlignments = alignments.filter((_, idx) => idx !== colIdx);
    const newRows = rows.map((r) => r.filter((_, idx) => idx !== colIdx));
    onChange({
      ...block,
      headers: newHeaders,
      alignments: newAlignments,
      rows: newRows,
    });
  };

  // Update column header
  const handleHeaderChange = (colIdx: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[colIdx] = val;
    onChange({ ...block, headers: newHeaders });
  };

  // Cycle alignment for column: left -> center -> right -> left
  const handleCycleAlignment = (colIdx: number) => {
    const current = alignments[colIdx] || "left";
    const next: ColumnAlignment =
      current === "left" ? "center" : current === "center" ? "right" : "left";
    const newAlignments = [...alignments];
    newAlignments[colIdx] = next;
    onChange({ ...block, alignments: newAlignments });
  };

  // Add row
  const handleAddRow = () => {
    const emptyRow = headers.map(() => "");
    const newRows = [...rows, emptyRow];
    onChange({ ...block, rows: newRows });
  };

  // Remove row
  const handleRemoveRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, idx) => idx !== rowIdx);
    // Shift highlight row indices
    const newHighlights = highlightRows
      .filter((idx) => idx !== rowIdx)
      .map((idx) => (idx > rowIdx ? idx - 1 : idx));
    onChange({ ...block, rows: newRows, highlightRows: newHighlights });
  };

  // Move row up / down
  const handleMoveRow = (rowIdx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? rowIdx - 1 : rowIdx + 1;
    if (targetIdx < 0 || targetIdx >= rows.length) return;

    const newRows = [...rows];
    const temp = newRows[rowIdx];
    newRows[rowIdx] = newRows[targetIdx];
    newRows[targetIdx] = temp;

    // Adjust highlight indices
    const isCurrentHighlighted = highlightRows.includes(rowIdx);
    const isTargetHighlighted = highlightRows.includes(targetIdx);
    let newHighlights = [...highlightRows];

    if (isCurrentHighlighted && !isTargetHighlighted) {
      newHighlights = newHighlights.filter((i) => i !== rowIdx).concat(targetIdx);
    } else if (!isCurrentHighlighted && isTargetHighlighted) {
      newHighlights = newHighlights.filter((i) => i !== targetIdx).concat(rowIdx);
    }

    onChange({ ...block, rows: newRows, highlightRows: newHighlights });
  };

  // Toggle row highlight (e.g. for Rank 1 or champion)
  const handleToggleHighlightRow = (rowIdx: number) => {
    const isHighlighted = highlightRows.includes(rowIdx);
    const newHighlights = isHighlighted
      ? highlightRows.filter((i) => i !== rowIdx)
      : [...highlightRows, rowIdx];
    onChange({ ...block, highlightRows: newHighlights });
  };

  // Update individual cell
  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = rows.map((r, rI) => {
      if (rI !== rowIdx) return r;
      const copy = [...r];
      copy[colIdx] = val;
      return copy;
    });
    onChange({ ...block, rows: newRows });
  };

  return (
    <div className="bg-[#090e18] border border-slate-700/80 rounded-lg p-3.5 space-y-3.5 shadow-sm text-xs">
      {/* ── Table Top Control Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Table Caption / Title */}
        <div className="flex-1 max-w-md">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Table Caption / Title
          </label>
          <input
            type="text"
            value={block.caption || ""}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder="e.g. NPL Season 3 Points Table"
            className="w-full bg-slate-900 border border-slate-750 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Style Selector & Preview Mode Toggle */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Table Style
            </label>
            <select
              value={style}
              onChange={(e) => handleStyleChange(e.target.value as TableStyle)}
              className="bg-slate-900 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="standard">Standard Sports Table</option>
              <option value="highlight">Highlighted Statistics</option>
              <option value="comparison">Comparison Table</option>
              <option value="compact">Compact Data Table</option>
            </select>
          </div>

          <div className="self-end pb-0.5">
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-1.5 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                isPreviewMode
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              }`}
            >
              <span>{isPreviewMode ? "✏️ Edit Table" : "👁️ Preview Table"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Table View: Preview or Edit ── */}
      {isPreviewMode ? (
        <div className="pt-1">
          <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
            <span className="italic">
              Rendered preview of table #{blockIndex + 1} with current style &amp; team logos:
            </span>
            <span className="font-mono text-emerald-400 uppercase text-[10px]">
              {style} Style
            </span>
          </div>
          <RichArticleTable table={block} isEditorPreview />
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {/* Scrollable Editor Viewport */}
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <table className="min-w-full border-collapse text-left">
              {/* Table Headers Configuration */}
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800">
                  <th className="p-2 w-16 text-center text-[10px] font-bold text-slate-500 uppercase">
                    Row
                  </th>
                  {headers.map((h, colIdx) => {
                    const align = alignments[colIdx] || "left";
                    return (
                      <th key={colIdx} className="p-2 min-w-[140px] align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={h}
                              onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                              placeholder={`Col ${colIdx + 1}`}
                              className="w-full bg-slate-850 border border-slate-700 text-white font-bold rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            {headers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(colIdx)}
                                title="Remove column"
                                className="text-slate-500 hover:text-red-400 p-1 text-xs transition-colors cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Alignment Toggle Button */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                            <span>Align:</span>
                            <button
                              type="button"
                              onClick={() => handleCycleAlignment(colIdx)}
                              title={`Current: ${align}. Click to change.`}
                              className="font-mono text-emerald-400 hover:text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                            >
                              {align === "left"
                                ? "⬅ Left"
                                : align === "center"
                                ? "↔ Center"
                                : "➡ Right"}
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-2 w-14 text-center align-middle">
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      title="Add Column"
                      className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-600 transition-colors cursor-pointer"
                    >
                      + Col
                    </button>
                  </th>
                </tr>
              </thead>

              {/* Table Rows & Cells */}
              <tbody className="divide-y divide-slate-800/80">
                {rows.map((row, rowIdx) => {
                  const isHighlighted = highlightRows.includes(rowIdx);
                  return (
                    <tr
                      key={rowIdx}
                      className={`transition-colors ${
                        isHighlighted
                          ? "bg-amber-950/20 border-l-2 border-l-amber-400"
                          : "hover:bg-slate-850/50"
                      }`}
                    >
                      {/* Row Controls */}
                      <td className="p-2 text-center text-slate-500 font-mono align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-center">
                          <span className="text-[10px]">#{rowIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleHighlightRow(rowIdx)}
                            title={
                              isHighlighted
                                ? "Remove highlight (Rank 1 / Key Row)"
                                : "Highlight this row (Rank 1 / Key Row)"
                            }
                            className={`p-1 rounded cursor-pointer transition-colors ${
                              isHighlighted
                                ? "text-amber-400 hover:text-amber-300"
                                : "text-slate-600 hover:text-slate-400"
                            }`}
                          >
                            ★
                          </button>
                        </div>
                      </td>

                      {/* Cell Inputs */}
                      {headers.map((_, colIdx) => {
                        const cellVal = row[colIdx] || "";
                        const align = alignments[colIdx] || "left";
                        const textAlignClass =
                          align === "center"
                            ? "text-center"
                            : align === "right"
                            ? "text-right font-mono"
                            : "text-left";

                        return (
                          <td key={colIdx} className="p-1.5 align-middle">
                            <input
                              type="text"
                              value={cellVal}
                              onChange={(e) =>
                                handleCellChange(rowIdx, colIdx, e.target.value)
                              }
                              placeholder="—"
                              className={`w-full bg-slate-900 border border-slate-750 text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${textAlignClass}`}
                            />
                          </td>
                        );
                      })}

                      {/* Row Action Controls */}
                      <td className="p-1.5 text-center whitespace-nowrap align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveRow(rowIdx, "up")}
                            disabled={rowIdx === 0}
                            title="Move Row Up"
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRow(rowIdx, "down")}
                            disabled={rowIdx === rows.length - 1}
                            title="Move Row Down"
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          >
                            ▼
                          </button>
                          {rows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(rowIdx)}
                              title="Delete Row"
                              className="p-1 text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Table Toolbar */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1.5 rounded font-semibold bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>+ Add Row</span>
              </button>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-3 py-1.5 rounded font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>+ Add Column</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span>{headers.length} Columns</span>
              <span>•</span>
              <span>{rows.length} Rows</span>
              <span>•</span>
              <span className="italic text-slate-400">
                Tip: Team names auto-show official logos
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

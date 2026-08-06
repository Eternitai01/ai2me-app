"use client";

/**
 * FortuneSheetRenderer
 * --------------------
 * Full Excel-like spreadsheet viewer using @fortune-sheet/react.
 * Supports single-sheet SpreadSheetData (AI generate) and multi-sheet WorkbookJSON (Open Files).
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Workbook } from "@fortune-sheet/react";
import type { WorkbookInstance } from "@fortune-sheet/react";
import type { Sheet } from "@fortune-sheet/core";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  FolderOpen,
  Maximize2,
} from "lucide-react";
import * as XLSX from "xlsx";

import "@fortune-sheet/react/dist/index.css";
import type { SpreadSheetData } from "@/lib/spreadjs-adapter";
import type { WorkbookJSON } from "@/lib/workbook-types";
import { isPristineBlankWorkbook } from "@/lib/workbook-types";
import { toFortuneSheets, fromFortuneSheet, sameSheetContent } from "@/lib/fortune-sheet-adapter";
import {
  workbookToFortuneSheets,
  fortuneSheetsToWorkbook,
  sameWorkbookContent,
  activeSheetToSpreadSheetData,
  spreadToWorkbook,
} from "@/lib/workbook-adapters";
import {
  downloadWorkbookXlsx,
  activeSheetToCsv,
  spreadToXlsxBook,
} from "@/lib/workbook-export";
import { evaluateFormulas } from "@/lib/formula-eval";
import { WORKBOOK_LIMITS } from "@/lib/workbook-limits";
import { validateSheetName } from "@/lib/validate-sheet-name";
import { SheetBusyOverlay } from "@/components/chat/SheetBusyOverlay";

const WorkbookTyped = Workbook as unknown as React.ForwardRefExoticComponent<
  React.ComponentProps<typeof Workbook> & {
    style?: React.CSSProperties;
  } & React.RefAttributes<WorkbookInstance>
>;

/** Restore tab label after FortuneSheet rejects rename without resetting DOM. */
function restoreSheetTabLabel(oldName: string) {
  if (typeof document === "undefined") return;
  const nodes = document.querySelectorAll<HTMLElement>(
    ".luckysheet-sheets-item-name"
  );
  for (const el of nodes) {
    if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
      el.textContent = oldName;
      return;
    }
  }
}

interface FortuneSheetRendererProps {
  /** Legacy / AI-generated single sheet */
  data?: SpreadSheetData | null;
  /** Multi-sheet workbook (Open Files). Takes precedence over `data` when set. */
  workbook?: WorkbookJSON | null;
  isGenerating?: boolean;
  className?: string;
  onDataChange?: (next: SpreadSheetData) => void;
  onWorkbookChange?: (next: WorkbookJSON) => void;
  /** Open Files — parent parses and owns state */
  onOpenFiles?: (file: File) => void;
  onActiveSheetChange?: (sheetId: string) => void;
}

export default function FortuneSheetRenderer({
  data = null,
  workbook = null,
  isGenerating = false,
  className = "",
  onDataChange,
  onWorkbookChange,
  onOpenFiles,
  onActiveSheetChange,
}: FortuneSheetRendererProps) {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workbookApiRef = useRef<WorkbookInstance | null>(null);
  const sheetsRef = useRef<Sheet[]>([]);
  const trimmingRef = useRef(false);
  const [generation, setGeneration] = useState(0);

  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;
  const onWorkbookChangeRef = useRef(onWorkbookChange);
  onWorkbookChangeRef.current = onWorkbookChange;
  const onActiveSheetChangeRef = useRef(onActiveSheetChange);
  onActiveSheetChangeRef.current = onActiveSheetChange;

  const selfEmittedWorkbookRef = useRef<WorkbookJSON | null>(null);
  const selfEmittedDataRef = useRef<SpreadSheetData | null>(null);

  const workbookRef = useRef<WorkbookJSON | null>(workbook);
  workbookRef.current = workbook;
  const dataRef = useRef<SpreadSheetData | null>(data);
  dataRef.current = data;

  const syncSheets = useCallback((next: Sheet[]) => {
    sheetsRef.current = next;
    setSheets(next);
  }, []);

  const trimLiveFortuneNames = useCallback((fortuneSheets: Sheet[]) => {
    if (trimmingRef.current) return;
    const api = workbookApiRef.current;
    if (!api) return;

    const pending: { id: string; name: string }[] = [];
    for (const fs of fortuneSheets) {
      if (!fs.id) continue;
      const trimmed = (fs.name ?? "").trim();
      if (!trimmed || trimmed === fs.name) continue;
      pending.push({ id: fs.id, name: trimmed });
    }
    if (!pending.length) return;

    trimmingRef.current = true;
    try {
      for (const p of pending) {
        api.setSheetName(p.name, { id: p.id });
      }
    } finally {
      trimmingRef.current = false;
    }
  }, []);

  const renameHooks = useMemo(
    () => ({
      beforeUpdateSheetName: (
        id: string,
        oldName: string,
        newName: string
      ): boolean => {
        const others = (sheetsRef.current ?? [])
          .filter((s) => s.id !== id)
          .map((s) => s.name ?? "");
        const result = validateSheetName(newName, others);
        if (!result.ok) {
          toast.error(result.message);
          restoreSheetTabLabel(oldName);
          return false;
        }
        return true;
      },
    }),
    []
  );

  const effectiveWorkbook: WorkbookJSON | null =
    workbook ?? (data ? spreadToWorkbook(data) : null);

  const displaySheet = workbook
    ? activeSheetToSpreadSheetData(workbook)
    : data;

  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (workbook) {
      if (workbook === selfEmittedWorkbookRef.current) return;
      syncSheets(workbookToFortuneSheets(workbook, containerWidth || undefined));
      setGeneration((g) => g + 1);
      return;
    }
    if (!data) {
      syncSheets([]);
      return;
    }
    if (data === selfEmittedDataRef.current) return;
    syncSheets(toFortuneSheets(data, containerWidth || undefined));
    setGeneration((g) => g + 1);
  }, [workbook, data, containerWidth, syncSheets]);

  const handleChange = useCallback(
    (newSheets: Sheet[]) => {
      sheetsRef.current = newSheets;
      // Pad-only renames must trim Fortune live names before early-returns.
      trimLiveFortuneNames(newSheets);
      const liveSheets = sheetsRef.current;

      const wbPrev = workbookRef.current;
      if (wbPrev) {
        const activeId =
          liveSheets.find((s) => s.status === 1)?.id ||
          wbPrev.activeSheetId;
        const nextWb = fortuneSheetsToWorkbook(liveSheets, activeId, wbPrev);

        const evaluatedSheets = nextWb.sheets.map((s) => {
          const spread = evaluateFormulas({
            sheetName: s.name,
            columns: s.columns.map((c, i) => ({
              name: c.name,
              type: c.type,
              width: s.columnWidths?.[i],
            })),
            rows: s.rows as SpreadSheetData["rows"],
            formulas: s.formulas,
          });
          return {
            ...s,
            rows: spread.rows,
            formulas: spread.formulas,
          };
        });
        const next: WorkbookJSON = { ...nextWb, sheets: evaluatedSheets };

        if (sameWorkbookContent(next, wbPrev)) return;
        if (
          next.sheets.every((s) => s.rows.length === 0) &&
          wbPrev.sheets.some((s) => s.rows.length > 0)
        ) {
          return;
        }

        selfEmittedWorkbookRef.current = next;
        onWorkbookChangeRef.current?.(next);
        const active = evaluatedSheets.find((s) => s.id === next.activeSheetId);
        if (active) {
          selfEmittedDataRef.current = {
            sheetName: active.name,
            columns: active.columns.map((c) => ({
              name: c.name,
              type: c.type,
            })),
            rows: active.rows as SpreadSheetData["rows"],
            formulas: active.formulas,
          };
          onDataChangeRef.current?.(selfEmittedDataRef.current);
        }
        if (activeId !== wbPrev.activeSheetId) {
          onActiveSheetChangeRef.current?.(activeId);
        }
        return;
      }

      const prev = dataRef.current;
      if (!prev) return;

      const read = fromFortuneSheet(liveSheets, prev);
      if (!read) return;
      if (read.rows.length === 0 && prev.rows.length > 0) return;

      const trimmedName = (read.sheetName || prev.sheetName || "Sheet1").trim();
      const next = evaluateFormulas({
        ...read,
        sheetName: trimmedName || prev.sheetName || "Sheet1",
      });
      if (sameSheetContent(next, prev)) return;

      selfEmittedDataRef.current = next;
      onDataChangeRef.current?.(next);
    },
    [trimLiveFortuneNames]
  );

  const handleExportXLSX = useCallback(() => {
    const wbSource = workbookRef.current;
    if (wbSource && wbSource.sheets.length > 0) {
      try {
        downloadWorkbookXlsx(wbSource);
        toast.success(
          wbSource.sheets.length > 1
            ? `XLSX exported (${wbSource.sheets.length} sheets)`
            : "XLSX exported"
        );
      } catch {
        toast.error("XLSX export failed");
      }
      return;
    }

    if (!data) {
      toast.error("No data to export");
      return;
    }
    try {
      const book = spreadToXlsxBook(data);
      XLSX.writeFile(book, `${data.sheetName ?? "spreadsheet"}.xlsx`);
      toast.success("XLSX exported");
    } catch {
      toast.error("XLSX export failed");
    }
  }, [data]);

  const handleExportCSV = useCallback(() => {
    const wbSource = workbookRef.current;
    if (wbSource) {
      const out = activeSheetToCsv(wbSource);
      if (!out) {
        toast.error("No data to export");
        return;
      }
      const blob = new Blob([out.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = out.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported (active sheet)");
      return;
    }

    const active = displaySheet;
    if (!active) {
      toast.error("No data to export");
      return;
    }
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = active.columns.map((c) => esc(c.name)).join(",");
    const rows = active.rows
      .map((r) => active.columns.map((_, i) => esc(r[i])).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", `${header}\r\n${rows}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.sheetName ?? "spreadsheet"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [displaySheet]);

  const handleFilePicked = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      onOpenFiles?.(file);
    },
    [onOpenFiles]
  );

  const title =
    workbook?.importMeta?.originalFileName ||
    displaySheet?.sheetName ||
    "AI Sheets";
  const sheetCount = workbook?.sheets.length ?? (data ? 1 : 0);
  const rowCount = displaySheet?.rows.length ?? 0;
  const colCount = displaySheet?.columns.length ?? 0;
  const canExport =
    !!effectiveWorkbook && !isPristineBlankWorkbook(effectiveWorkbook);

  return (
    <div
      className={`flex flex-col h-full bg-[var(--chat-bg-primary)] ${
        fullscreen ? "fixed inset-0 z-50" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] flex-shrink-0">
        <FileSpreadsheet className="w-4 h-4 text-green-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-[var(--chat-text-primary)] truncate flex-1">
          {title}
        </span>
        {(workbook || data) && (
          <span className="text-[10px] text-[var(--chat-text-muted)] hidden sm:inline">
            {sheetCount > 1 ? `${sheetCount} sheets · ` : ""}
            {rowCount} rows · {colCount} cols
          </span>
        )}
        <div className="flex items-center gap-1 ml-2">
          {onOpenFiles && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={WORKBOOK_LIMITS.acceptedExtensions.join(",")}
                className="hidden"
                onChange={handleFilePicked}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-green-600/40 bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <FolderOpen className="w-3 h-3" /> Open Files
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isGenerating || !canExport}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-[var(--chat-border)] bg-[var(--chat-bg-primary)] text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)] disabled:opacity-30 transition-colors"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
          <button
            type="button"
            onClick={handleExportXLSX}
            disabled={isGenerating || !canExport}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-[var(--chat-border)] bg-[var(--chat-bg-primary)] text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)] disabled:opacity-30 transition-colors"
          >
            <Download className="w-3 h-3" /> XLSX
          </button>
          <div className="w-px h-4 bg-[var(--chat-border)] mx-0.5" />
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[var(--chat-border)] bg-[var(--chat-bg-primary)] text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)] transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative min-h-0 overflow-hidden">
        {sheets.length > 0 && (
          <div
            className={`absolute inset-0 flex flex-col ${
              isGenerating ? "pointer-events-none select-none" : ""
            }`}
          >
            {data?.keyInsights?.length ? (
              <details
                open
                className="flex-shrink-0 border-b border-[var(--chat-border)] bg-[var(--chat-bg-secondary)]"
              >
                <summary className="cursor-pointer select-none px-3 py-1.5 text-xs font-semibold text-[var(--chat-text-primary)]">
                  Key insights ({data.keyInsights.length})
                </summary>
                <ul className="px-3 pb-2 space-y-1">
                  {data.keyInsights.map((insight, i) => (
                    <li
                      key={i}
                      className="text-xs leading-relaxed text-[var(--chat-text-secondary)] pl-3 relative before:absolute before:left-0 before:content-['•'] before:text-green-500"
                    >
                      {insight.replace(/^[•\-\s]+/, "")}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            <div ref={gridContainerRef} className="flex-1 min-h-0">
              <WorkbookTyped
                key={generation}
                ref={workbookApiRef}
                data={sheets}
                onChange={handleChange}
                hooks={renameHooks}
                showToolbar
                showFormulaBar
                showSheetTabs
                allowEdit={!isGenerating}
                rowHeaderWidth={46}
                columnHeaderHeight={28}
                lang="en"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        )}

        {isGenerating && (
          <>
            <div
              className="absolute inset-0 z-20 bg-[var(--chat-bg-primary)]/40 backdrop-blur-md pointer-events-auto"
              aria-hidden
            />
            <SheetBusyOverlay />
          </>
        )}
      </div>
    </div>
  );
}

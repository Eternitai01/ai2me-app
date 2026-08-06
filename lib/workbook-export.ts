/**
 * Workbook → CSV / XLSX export helpers (pure, UI-free).
 */

import * as XLSX from "xlsx";
import type { SpreadSheetData } from "@/lib/spreadjs-adapter";
import type { SheetJSON, WorkbookJSON } from "@/lib/workbook-types";
import { activeSheet } from "@/lib/workbook-types";

function uniqueSheetName(desired: string, used: Set<string>): string {
  let base = (desired || "Sheet").slice(0, 31) || "Sheet";
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let i = 2;
  while (i < 1000) {
    const suffix = ` (${i})`;
    const name = (base.slice(0, 31 - suffix.length) + suffix).slice(0, 31);
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
    i++;
  }
  const fallback = `Sheet${used.size + 1}`.slice(0, 31);
  used.add(fallback);
  return fallback;
}

function sheetJsonToWorksheet(sheet: SheetJSON): XLSX.WorkSheet {
  const header = sheet.columns.map((c) => c.name);
  const body = sheet.rows.map((r) =>
    sheet.columns.map((_, i) =>
      r[i] === null || r[i] === undefined ? undefined : r[i]
    )
  );
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  const colCount = Math.max(0, sheet.columns.length - 1);
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: sheet.rows.length, c: colCount },
  });

  if (sheet.columnWidths?.length) {
    ws["!cols"] = sheet.columnWidths.map((w) => ({
      wch: Math.max(8, Math.round((w || 120) / 8)),
    }));
  }

  if (sheet.formulas?.length) {
    for (const { row, col, formula } of sheet.formulas) {
      const addr = XLSX.utils.encode_cell({ r: row + 1, c: col });
      const cell = ws[addr];
      if (!cell) {
        ws[addr] = { t: "n", v: 0 };
      } else if (cell.t === "s") {
        const n = Number(cell.v);
        if (!Number.isNaN(n) && String(cell.v).trim() !== "") {
          cell.t = "n";
          cell.v = n;
        }
      }
      ws[addr].f = formula.startsWith("=") ? formula.slice(1) : formula;
    }
  }

  return ws;
}

export function workbookExportBasename(workbook: WorkbookJSON): string {
  const fromMeta = workbook.importMeta?.originalFileName?.replace(/\.[^.]+$/, "");
  if (fromMeta?.trim()) return fromMeta.trim();
  const active = activeSheet(workbook);
  return active?.name || workbook.sheets[0]?.name || "spreadsheet";
}

/** Build an XLSX workbook blob/book from WorkbookJSON (all sheets). */
export function workbookToXlsxBook(workbook: WorkbookJSON): XLSX.WorkBook {
  const book = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const sheet of workbook.sheets) {
    const ws = sheetJsonToWorksheet(sheet);
    const name = uniqueSheetName(sheet.name, used);
    XLSX.utils.book_append_sheet(book, ws, name);
  }
  return book;
}

export function downloadWorkbookXlsx(workbook: WorkbookJSON, filename?: string): void {
  const book = workbookToXlsxBook(workbook);
  const base = filename?.replace(/\.[^.]+$/, "") || workbookExportBasename(workbook);
  XLSX.writeFile(book, `${base}.xlsx`);
}

export function activeSheetToCsv(workbook: WorkbookJSON): {
  csv: string;
  filename: string;
} | null {
  const sheet = activeSheet(workbook);
  if (!sheet) return null;
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = sheet.columns.map((c) => esc(c.name)).join(",");
  const rows = sheet.rows
    .map((r) => sheet.columns.map((_, i) => esc(r[i])).join(","))
    .join("\r\n");
  return {
    csv: `\uFEFF${header}\r\n${rows}`,
    filename: `${sheet.name || "spreadsheet"}.csv`,
  };
}

/** Legacy single-sheet export path. */
export function spreadToXlsxBook(data: SpreadSheetData): XLSX.WorkBook {
  return workbookToXlsxBook({
    schemaVersion: 1,
    activeSheetId: "sheet1",
    sheets: [
      {
        id: "sheet1",
        name: data.sheetName || "Sheet1",
        columns: data.columns.map((c) => ({ name: c.name, type: c.type })),
        rows: data.rows,
        formulas: data.formulas,
        columnWidths: data.columns.map((c) => c.width || 120),
      },
    ],
  });
}

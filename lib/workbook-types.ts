/**
 * Canonical workbook contracts for AI Sheets Open Files.
 * Matches docs/superpowers/specs/2026-08-04-ai-sheets-open-files-design.md §8.1
 *
 * schemaVersion = JSON shape version.
 * Persist API `version` = DB concurrency counter (see WorkbookPersistResponse).
 */

export type CellValue = string | number | boolean | null;

export type ImportWarningCode =
  | "FORMULA_FALLBACK"
  | "STYLE_DROPPED"
  | "UNSUPPORTED";

export interface ImportWarning {
  code: ImportWarningCode;
  message: string;
  sheetId?: string;
  cell?: { row: number; col: number };
}

export interface SheetColumn {
  name: string;
  type?: string;
}

export interface SheetFormula {
  row: number;
  col: number;
  formula: string;
}

export interface SheetJSON {
  id: string;
  name: string;
  columns: SheetColumn[];
  rows: CellValue[][];
  formulas?: SheetFormula[];
  /** Best-effort only; may be empty in v1 */
  columnWidths?: number[];
  merges?: unknown[];
}

export interface WorkbookImportMeta {
  originalFileName: string;
  originalContentType: string;
  importedAt: string;
  warnings: ImportWarning[];
}

export interface WorkbookJSON {
  schemaVersion: 1;
  activeSheetId: string;
  sheets: SheetJSON[];
  importMeta?: WorkbookImportMeta;
}

/** Response shape for GET/PUT/import workbook APIs (Phase 2). */
export interface WorkbookPersistResponse {
  workbook: WorkbookJSON;
  version: number;
  conflict?: boolean;
  session_id: string;
}

export function emptyWorkbook(sheetName = "Sheet1"): WorkbookJSON {
  const id = "sheet1";
  return {
    schemaVersion: 1,
    activeSheetId: id,
    sheets: [
      {
        id,
        name: sheetName,
        columns: [],
        rows: [],
      },
    ],
  };
}

/** In-memory AI Sheets canvas seed (no session / no persist). */
export function blankSheetsCanvas(sheetName = "Sheet1"): WorkbookJSON {
  return emptyWorkbook(sheetName);
}

function cellNonEmpty(v: CellValue): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  return true;
}

/**
 * Content/shape pristine check — single rule for export + Open Files confirm.
 * Canvas-only empty column slots (name "" or absent) are allowed; letter-only
 * default headers with zero data rows are also treated as canvas chrome.
 */
export function isPristineBlankWorkbook(
  wb: WorkbookJSON | null | undefined
): boolean {
  if (!wb) return false;
  if (wb.importMeta) return false;
  if (wb.sheets.length !== 1) return false;
  const sheet = wb.sheets[0];
  if (!sheet || sheet.name !== "Sheet1") return false;
  if (sheet.formulas?.length) return false;

  for (const col of sheet.columns) {
    const n = (col.name ?? "").trim();
    if (n === "") continue;
    if (!/^[A-Z]{1,3}$/.test(n)) return false;
  }

  for (const row of sheet.rows) {
    for (const cell of row) {
      if (cellNonEmpty(cell)) return false;
    }
  }
  return true;
}

export function findSheet(
  workbook: WorkbookJSON,
  sheetId: string
): SheetJSON | undefined {
  return workbook.sheets.find((s) => s.id === sheetId);
}

export function activeSheet(workbook: WorkbookJSON): SheetJSON | undefined {
  return (
    findSheet(workbook, workbook.activeSheetId) ?? workbook.sheets[0]
  );
}

export function workbookCellCount(workbook: WorkbookJSON): number {
  return workbook.sheets.reduce((sum, sheet) => {
    const cols = Math.max(
      sheet.columns.length,
      ...sheet.rows.map((r) => r.length),
      0
    );
    return sum + sheet.rows.length * cols;
  }, 0);
}

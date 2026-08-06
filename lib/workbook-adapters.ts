/**
 * Bridges WorkbookJSON ↔ SpreadSheetData ↔ FortuneSheet Sheet[].
 * Keeps multi-sheet state intact when reading onChange (all tabs).
 */

import type { Sheet } from "@fortune-sheet/core";
import type { SpreadSheetData } from "@/lib/spreadjs-adapter";
import {
  toFortuneSheets,
  fromFortuneSheet,
  sameSheetContent,
} from "@/lib/fortune-sheet-adapter";
import type { SheetJSON, WorkbookJSON } from "@/lib/workbook-types";
import { activeSheet, findSheet } from "@/lib/workbook-types";

export function sheetJsonToSpread(sheet: SheetJSON): SpreadSheetData {
  return {
    sheetName: sheet.name,
    columns: sheet.columns.map((c, i) => ({
      name: c.name,
      type: c.type,
      width: sheet.columnWidths?.[i],
    })),
    rows: sheet.rows as SpreadSheetData["rows"],
    formulas: sheet.formulas,
  };
}

export function spreadToSheetJson(
  data: SpreadSheetData,
  id: string
): SheetJSON {
  return {
    id,
    name: data.sheetName || "Sheet1",
    columns: data.columns.map((c) => ({
      name: c.name,
      type: c.type,
    })),
    rows: data.rows,
    formulas: data.formulas,
    columnWidths: data.columns.map((c) => c.width || 120),
  };
}

export function spreadToWorkbook(data: SpreadSheetData): WorkbookJSON {
  const id = "sheet1";
  return {
    schemaVersion: 1,
    activeSheetId: id,
    sheets: [spreadToSheetJson(data, id)],
  };
}

export function activeSheetToSpreadSheetData(
  workbook: WorkbookJSON
): SpreadSheetData | null {
  const sheet = activeSheet(workbook);
  if (!sheet) return null;
  return sheetJsonToSpread(sheet);
}

export function replaceActiveSheet(
  workbook: WorkbookJSON,
  data: SpreadSheetData
): WorkbookJSON {
  const activeId = workbook.activeSheetId;
  const sheets = workbook.sheets.map((s) =>
    s.id === activeId ? spreadToSheetJson(data, s.id) : s
  );
  // If active id missing, replace first
  if (!sheets.some((s) => s.id === activeId) && sheets.length) {
    sheets[0] = spreadToSheetJson(data, sheets[0].id);
  }
  return { ...workbook, sheets };
}

export function workbookToFortuneSheets(
  workbook: WorkbookJSON,
  containerWidth?: number
): Sheet[] {
  return workbook.sheets.map((sheet, order) => {
    const spread = sheetJsonToSpread(sheet);
    const [fortune] = toFortuneSheets(spread, containerWidth);
    return {
      ...fortune,
      id: sheet.id,
      name: sheet.name,
      order,
      status: sheet.id === workbook.activeSheetId ? 1 : 0,
    };
  });
}

function emptySpread(name: string): SpreadSheetData {
  return { sheetName: name, columns: [{ name: "A" }], rows: [] };
}

/**
 * Rebuild workbook from FortuneSheet's full sheets array so inactive tabs are kept.
 */
export function fortuneSheetsToWorkbook(
  fortuneSheets: Sheet[],
  activeSheetId: string,
  prev?: WorkbookJSON
): WorkbookJSON {
  const sheets: SheetJSON[] = fortuneSheets.map((fs, index) => {
    const id = fs.id || prev?.sheets[index]?.id || `sheet-${index + 1}`;
    const prevSheet = findSheet(
      prev ?? { schemaVersion: 1, activeSheetId: id, sheets: [] },
      id
    ) ?? prev?.sheets[index];

    // Trim so autosave never persists padded Fortune tab names.
    const finalize = (sheet: SheetJSON): SheetJSON => ({
      ...sheet,
      name: sheet.name.trim() || `Sheet${index + 1}`,
    });

    const prevSpread = prevSheet
      ? sheetJsonToSpread(prevSheet)
      : emptySpread(fs.name || `Sheet${index + 1}`);

    const read = fromFortuneSheet([fs], prevSpread);
    if (!read) {
      return finalize(
        prevSheet ?? {
          id,
          name: fs.name || `Sheet${index + 1}`,
          columns: [{ name: "A" }],
          rows: [],
        }
      );
    }
    return finalize(spreadToSheetJson(read, id));
  });

  const resolvedActive =
    sheets.find((s) => s.id === activeSheetId)?.id ??
    sheets.find((s) => s.id === prev?.activeSheetId)?.id ??
    sheets[0]?.id ??
    "sheet1";

  return {
    schemaVersion: 1,
    activeSheetId: resolvedActive,
    sheets,
    importMeta: prev?.importMeta,
  };
}

export function sameWorkbookContent(a: WorkbookJSON, b: WorkbookJSON): boolean {
  if (a.activeSheetId !== b.activeSheetId) return false;
  if (a.sheets.length !== b.sheets.length) return false;
  for (let i = 0; i < a.sheets.length; i++) {
    const sa = sheetJsonToSpread(a.sheets[i]);
    const sb = sheetJsonToSpread(b.sheets[i]);
    if (a.sheets[i].id !== b.sheets[i].id) return false;
    if (!sameSheetContent(sa, sb)) return false;
  }
  return true;
}

/**
 * Client-side workbook import (SheetJS preview).
 * Server re-parse in Phase 2 is authoritative.
 */

import * as XLSX from "xlsx";
import {
  assertWithinHardLimits,
  isAcceptedWorkbookFilename,
  WORKBOOK_LIMITS,
  countCells,
  extensionOf,
} from "@/lib/workbook-limits";
import type {
  CellValue,
  ImportWarning,
  SheetJSON,
  WorkbookJSON,
} from "@/lib/workbook-types";

export class WorkbookImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkbookImportError";
  }
}

function slugId(name: string, index: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "sheet"}-${index + 1}`;
}

function cellToValue(cell: XLSX.CellObject | undefined): CellValue {
  if (!cell) return null;
  const v = cell.v;
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") {
    return v;
  }
  return String(v);
}

function looksLikeHeaderRow(row: CellValue[]): boolean {
  if (!row.length) return false;
  let nonEmpty = 0;
  let stringish = 0;
  for (const v of row) {
    if (v === null || v === undefined || v === "") continue;
    nonEmpty++;
    if (typeof v === "string") stringish++;
  }
  return nonEmpty > 0 && stringish >= Math.ceil(nonEmpty * 0.6);
}

function sheetFromAoA(
  name: string,
  id: string,
  aoa: CellValue[][],
  formulaMap: Map<string, string>,
  warnings: ImportWarning[]
): SheetJSON {
  if (!aoa.length) {
    return { id, name, columns: [{ name: "A" }], rows: [] };
  }

  const maxCols = Math.max(...aoa.map((r) => r.length), 1);
  const pad = (row: CellValue[]) => {
    const out = row.slice(0, maxCols);
    while (out.length < maxCols) out.push(null);
    return out;
  };

  const first = pad(aoa[0] ?? []);
  const useHeader = looksLikeHeaderRow(first);

  let columns: { name: string; type?: string }[];
  let dataRows: CellValue[][];

  if (useHeader) {
    columns = first.map((v, i) => ({
      name: v === null || v === "" ? `Column ${i + 1}` : String(v),
    }));
    dataRows = aoa.slice(1).map(pad);
  } else {
    columns = Array.from({ length: maxCols }, (_, i) => ({
      name: XLSX.utils.encode_col(i),
    }));
    dataRows = aoa.map(pad);
  }

  // Drop trailing empty rows
  while (
    dataRows.length &&
    dataRows[dataRows.length - 1].every((v) => v === null || v === "")
  ) {
    dataRows.pop();
  }

  const formulas: { row: number; col: number; formula: string }[] = [];
  const rowOffset = useHeader ? 1 : 0;

  formulaMap.forEach((formula, key) => {
    const [rs, cs] = key.split(",").map(Number);
    const dataRow = rs - rowOffset;
    if (dataRow < 0 || dataRow >= dataRows.length) return;
    if (cs < 0 || cs >= columns.length) return;

    const f = formula.startsWith("=") ? formula : `=${formula}`;
    // SheetJS sometimes leaves value empty for formula cells — keep formula when present
    formulas.push({ row: dataRow, col: cs, formula: f });
  });

  if (formulas.length === 0 && formulaMap.size > 0) {
    warnings.push({
      code: "UNSUPPORTED",
      message: "Some formulas could not be mapped into the grid",
      sheetId: id,
    });
  }

  return {
    id,
    name,
    columns,
    rows: dataRows,
    formulas: formulas.length ? formulas : undefined,
  };
}

function extractSheet(
  wb: XLSX.WorkBook,
  sheetName: string,
  index: number,
  warnings: ImportWarning[]
): SheetJSON {
  const ws = wb.Sheets[sheetName];
  const id = slugId(sheetName, index);
  if (!ws) {
    return { id, name: sheetName, columns: [{ name: "A" }], rows: [] };
  }

  const ref = ws["!ref"];
  const range = ref
    ? XLSX.utils.decode_range(ref)
    : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };

  const formulaMap = new Map<string, string>();
  const aoa: CellValue[][] = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: CellValue[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr] as XLSX.CellObject | undefined;
      if (cell?.f) {
        formulaMap.set(`${r},${c}`, cell.f);
      }
      row.push(cellToValue(cell));
    }
    aoa.push(row);
  }

  return sheetFromAoA(sheetName, id, aoa, formulaMap, warnings);
}

export function parseWorkbookArrayBuffer(
  buffer: ArrayBuffer,
  filename: string,
  contentType = ""
): WorkbookJSON {
  if (!isAcceptedWorkbookFilename(filename)) {
    throw new WorkbookImportError(
      `Unsupported file type. Use ${WORKBOOK_LIMITS.acceptedExtensions.join(" or ")}`
    );
  }

  if (buffer.byteLength > WORKBOOK_LIMITS.maxFileBytes) {
    throw new WorkbookImportError(
      `File exceeds ${WORKBOOK_LIMITS.maxFileBytes / (1024 * 1024)} MB limit`
    );
  }

  const ext = extensionOf(filename);
  const warnings: ImportWarning[] = [
    {
      code: "STYLE_DROPPED",
      message: "Cell styles and charts are not preserved in v1 (values and formulas only)",
    },
  ];

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, {
      type: "array",
      cellFormula: true,
      cellNF: true,
      dense: false,
    });
  } catch {
    throw new WorkbookImportError("Could not read spreadsheet file");
  }

  const names =
    ext === ".csv"
      ? wb.SheetNames.slice(0, 1)
      : wb.SheetNames;

  if (!names.length) {
    throw new WorkbookImportError("Workbook has no sheets");
  }

  if (names.length > WORKBOOK_LIMITS.maxSheets) {
    throw new WorkbookImportError(
      `Workbooks may have at most ${WORKBOOK_LIMITS.maxSheets} sheets`
    );
  }

  const sheets = names.map((n, i) => extractSheet(wb, n, i, warnings));

  let cellCount = 0;
  for (const s of sheets) {
    cellCount += countCells(s.rows.length, s.columns.length);
  }

  const limitErr = assertWithinHardLimits({
    fileBytes: buffer.byteLength,
    sheetCount: sheets.length,
    cellCount,
  });
  if (limitErr) throw new WorkbookImportError(limitErr);

  return {
    schemaVersion: 1,
    activeSheetId: sheets[0].id,
    sheets,
    importMeta: {
      originalFileName: filename,
      originalContentType: contentType || guessContentType(filename),
      importedAt: new Date().toISOString(),
      warnings,
    },
  };
}

function guessContentType(filename: string): string {
  const ext = extensionOf(filename);
  if (ext === ".csv") return "text/csv";
  if (ext === ".xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "application/octet-stream";
}

export async function parseWorkbookFile(file: File): Promise<WorkbookJSON> {
  if (!isAcceptedWorkbookFilename(file.name)) {
    throw new WorkbookImportError(
      `Unsupported file type. Use ${WORKBOOK_LIMITS.acceptedExtensions.join(" or ")}`
    );
  }
  if (file.size > WORKBOOK_LIMITS.maxFileBytes) {
    throw new WorkbookImportError(
      `File exceeds ${WORKBOOK_LIMITS.maxFileBytes / (1024 * 1024)} MB limit`
    );
  }
  const buffer = await file.arrayBuffer();
  return parseWorkbookArrayBuffer(buffer, file.name, file.type);
}

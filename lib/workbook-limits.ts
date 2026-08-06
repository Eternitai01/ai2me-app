/**
 * Hard limits for AI Sheets workbook import (client mirror of api sheet_workbook_parser).
 * Server re-parse is authoritative; keep these values in sync.
 */

export const WORKBOOK_LIMITS = {
  maxFileBytes: 10 * 1024 * 1024,
  maxSheets: 20,
  maxCells: 100_000,
  maxAiFullGridCells: 8_000,
  acceptedExtensions: [".csv", ".xlsx"] as const,
} as const;

export type WorkbookAcceptedExtension =
  (typeof WORKBOOK_LIMITS.acceptedExtensions)[number];

export function countCells(rowCount: number, colCount: number): number {
  return Math.max(0, rowCount) * Math.max(0, colCount);
}

export function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return "";
  return filename.slice(i).toLowerCase();
}

export function isAcceptedWorkbookFilename(filename: string): boolean {
  const ext = extensionOf(filename);
  return (WORKBOOK_LIMITS.acceptedExtensions as readonly string[]).includes(ext);
}

/**
 * @returns Human-readable error, or null if within limits.
 */
export function assertWithinHardLimits(input: {
  fileBytes?: number;
  sheetCount: number;
  cellCount: number;
}): string | null {
  if (
    input.fileBytes != null &&
    input.fileBytes > WORKBOOK_LIMITS.maxFileBytes
  ) {
    return `File exceeds ${WORKBOOK_LIMITS.maxFileBytes / (1024 * 1024)} MB limit`;
  }
  if (input.sheetCount > WORKBOOK_LIMITS.maxSheets) {
    return `Workbooks may have at most ${WORKBOOK_LIMITS.maxSheets} sheets`;
  }
  if (input.cellCount > WORKBOOK_LIMITS.maxCells) {
    return `Workbooks may have at most ${WORKBOOK_LIMITS.maxCells.toLocaleString()} cells`;
  }
  return null;
}

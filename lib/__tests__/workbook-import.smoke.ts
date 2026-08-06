/**
 * Lightweight import smoke test (no vitest required).
 * Run: cd web && npx --yes tsx lib/__tests__/workbook-import.smoke.ts
 */

import * as XLSX from "xlsx";
import { parseWorkbookArrayBuffer } from "../workbook-import";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// Build a tiny CSV via SheetJS write → read path
const aoa = [
  ["Name", "Visits"],
  ["Ada", 10],
  ["Bob", 20],
];
const ws = XLSX.utils.aoa_to_sheet(aoa);
const book = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(book, ws, "Sheet1");
const csv = XLSX.write(book, { type: "string", bookType: "csv" }) as string;
const buf = new TextEncoder().encode(csv).buffer;

const wb = parseWorkbookArrayBuffer(buf, "sample.csv", "text/csv");
assert(wb.schemaVersion === 1, "schemaVersion");
assert(wb.sheets.length === 1, "one sheet");
assert(wb.sheets[0].columns[0].name === "Name", "header Name");
assert(wb.sheets[0].columns[1].name === "Visits", "header Visits");
assert(wb.sheets[0].rows.length === 2, "two data rows");
assert(wb.sheets[0].rows[0][0] === "Ada", "Ada");
assert(wb.importMeta?.warnings?.some((w) => w.code === "STYLE_DROPPED"), "style warning");

// Reject bad extension
let rejected = false;
try {
  parseWorkbookArrayBuffer(buf, "notes.txt");
} catch {
  rejected = true;
}
assert(rejected, "reject .txt");

console.log("workbook-import.smoke: OK");

/**
 * Smoke: workbook export + workbook-ops extensibility.
 * Run: cd web && npx --yes tsx lib/__tests__/workbook-export-ops.smoke.ts
 */

import {
  workbookToXlsxBook,
  activeSheetToCsv,
  workbookExportBasename,
} from "../workbook-export";
import { applyWorkbookOps, parseWorkbookOps } from "../workbook-ops";
import type { WorkbookJSON } from "../workbook-types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const workbook: WorkbookJSON = {
  schemaVersion: 1,
  activeSheetId: "s1",
  importMeta: {
    originalFileName: "demo.xlsx",
    originalContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    importedAt: new Date().toISOString(),
    warnings: [],
  },
  sheets: [
    {
      id: "s1",
      name: "Visits",
      columns: [{ name: "Name" }, { name: "N" }],
      rows: [
        ["Ada", 1],
        ["Bob", 2],
      ],
      formulas: [{ row: 0, col: 1, formula: "=1+0" }],
    },
    {
      id: "s2",
      name: "Other",
      columns: [{ name: "X" }],
      rows: [["keep"]],
    },
  ],
};

assert(workbookExportBasename(workbook) === "demo", "basename from importMeta");

const book = workbookToXlsxBook(workbook);
assert(book.SheetNames.length === 2, "two sheets in xlsx");
assert(book.SheetNames.includes("Visits"), "Visits tab");
assert(book.SheetNames.includes("Other"), "Other tab");
assert(book.Sheets.Visits?.B2?.f, "formula preserved on export");

const csv = activeSheetToCsv(workbook);
assert(csv?.filename === "Visits.csv", "csv active filename");
assert(csv?.csv.includes("Ada"), "csv has Ada");
assert(!csv?.csv.includes("keep"), "csv excludes other sheet");

const targeted = parseWorkbookOps(
  JSON.stringify({
    ops: [{ op: "setCell", sheet: "Other", row: 0, col: 0, value: "changed" }],
  })
);
assert(targeted?.length === 1, "parse targeted op");
const afterTarget = applyWorkbookOps(workbook, targeted!);
assert(afterTarget.workbook.sheets[0].rows[0][0] === "Ada", "active untouched");
assert(afterTarget.workbook.sheets[1].rows[0][0] === "changed", "other targeted");

const struct = parseWorkbookOps(
  JSON.stringify({
    ops: [
      { op: "addSheet", name: "NewTab" },
      { op: "setActiveSheet", sheet: "NewTab" },
    ],
  })
)!;
const afterStruct = applyWorkbookOps(workbook, struct);
assert(afterStruct.workbook.sheets.length === 3, "added sheet");
assert(
  afterStruct.workbook.sheets.some((s) => s.name === "NewTab"),
  "NewTab exists"
);

console.log("workbook-export-ops.smoke: OK");

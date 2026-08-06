/**
 * Smoke: sheet-ops patch active sheet without touching other workbook tabs.
 * Run: cd web && npx --yes tsx lib/__tests__/workbook-ops.smoke.ts
 */

import { applySheetOps } from "../sheet-ops";
import {
  replaceActiveSheet,
  sheetJsonToSpread,
  activeSheetToSpreadSheetData,
} from "../workbook-adapters";
import type { WorkbookJSON } from "../workbook-types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const workbook: WorkbookJSON = {
  schemaVersion: 1,
  activeSheetId: "s1",
  sheets: [
    {
      id: "s1",
      name: "Active",
      columns: [{ name: "Name" }, { name: "Visits" }],
      rows: [
        ["Ada", 10],
        ["Bob", 20],
      ],
    },
    {
      id: "s2",
      name: "Other",
      columns: [{ name: "X" }],
      rows: [["keep-me"]],
    },
  ],
};

const active = activeSheetToSpreadSheetData(workbook)!;
const patched = applySheetOps(active, [
  { op: "setCell", row: 0, col: 1, value: 500 },
  { op: "setCell", row: 1, col: 1, value: 500 },
]);

const next = replaceActiveSheet(workbook, patched);

assert(next.sheets.length === 2, "two sheets");
assert(next.sheets[1].rows[0][0] === "keep-me", "other sheet untouched");
assert(next.sheets[0].rows[0][1] === 500, "active row0 visits=500");
assert(next.sheets[0].rows[1][1] === 500, "active row1 visits=500");
assert(next.sheets[0].rows[0][0] === "Ada", "name preserved");

const otherSpread = sheetJsonToSpread(next.sheets[1]);
assert(otherSpread.rows[0][0] === "keep-me", "other via adapter");

console.log("workbook-ops.smoke: OK");

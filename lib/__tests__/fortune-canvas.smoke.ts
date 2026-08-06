/**
 * Canvas paint/read round-trip (no A1→A2 shift).
 * Run: cd web && npx --yes tsx lib/__tests__/fortune-canvas.smoke.ts
 */

import {
  BLANK_CANVAS_COLS,
  BLANK_CANVAS_ROWS,
  fromFortuneSheet,
  isCanvasSpread,
  toFortuneSheets,
} from "../fortune-sheet-adapter";
import type { SpreadSheetData } from "../spreadjs-adapter";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const empty: SpreadSheetData = { sheetName: "Sheet1", columns: [], rows: [] };
assert(isCanvasSpread(empty), "empty must be canvas");

const painted = toFortuneSheets(empty);
assert(painted[0].column === BLANK_CANVAS_COLS, "blank cols");
assert(painted[0].row === BLANK_CANVAS_ROWS, "blank rows");
assert((painted[0].celldata?.length ?? 0) === 0, "no fake header celldata");

const afterType: SpreadSheetData = {
  sheetName: "Sheet1",
  columns: [{ name: "A" }],
  rows: [["hello"]],
};
assert(isCanvasSpread(afterType), "letter cols stay canvas");

const painted2 = toFortuneSheets(afterType);
const a1 = painted2[0].celldata?.find((c) => c.r === 0 && c.c === 0);
assert(a1?.v?.m === "hello" || a1?.v?.v === "hello", "value at r=0 (A1), not r=1");
assert(!painted2[0].celldata?.some((c) => c.r === 0 && c.c === 0 && c.v?.m === "A"), "no letter header cell");

// Simulate FortuneSheet matrix after edit
const fakeSheets = [
  {
    name: "Sheet1",
    data: [[{ v: "hello", m: "hello" }], [], []],
  },
] as Parameters<typeof fromFortuneSheet>[0];

const read = fromFortuneSheet(fakeSheets, empty);
assert(read, "read ok");
assert(read!.rows[0]?.[0] === "hello", "A1 value in data row 0");
assert(read!.columns[0]?.name === "A", "letter column");
assert(isCanvasSpread(read!), "read stays canvas");

const repaint = toFortuneSheets(read!);
const a1b = repaint[0].celldata?.find((c) => c.r === 0 && c.c === 0);
assert(a1b?.v?.m === "hello" || a1b?.v?.v === "hello", "repaint keeps A1");

console.log("fortune-canvas.smoke: OK");

/**
 * Blank canvas + pristine workbook helpers.
 * Run: cd web && npx --yes tsx lib/__tests__/workbook-blank.smoke.ts
 */

import {
  blankSheetsCanvas,
  emptyWorkbook,
  isPristineBlankWorkbook,
  type WorkbookJSON,
} from "../workbook-types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const seed = blankSheetsCanvas();
assert(isPristineBlankWorkbook(seed), "seed must be pristine");
assert(
  isPristineBlankWorkbook(emptyWorkbook()),
  "emptyWorkbook must be pristine (same contract)"
);

const withCell: WorkbookJSON = {
  ...seed,
  sheets: [
    {
      ...seed.sheets[0],
      columns: [{ name: "A" }],
      rows: [["hello"]],
    },
  ],
};
assert(!isPristineBlankWorkbook(withCell), "typed cell must not be pristine");

const cleared: WorkbookJSON = {
  ...withCell,
  sheets: [
    {
      ...seed.sheets[0],
      columns: seed.sheets[0].columns,
      rows: [],
      formulas: undefined,
    },
  ],
};
assert(isPristineBlankWorkbook(cleared), "edit-then-clear must be pristine again");

const imported: WorkbookJSON = {
  ...seed,
  importMeta: {
    originalFileName: "x.xlsx",
    originalContentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    importedAt: new Date().toISOString(),
    warnings: [],
  },
};
assert(!isPristineBlankWorkbook(imported), "importMeta must not be pristine");

const renamed: WorkbookJSON = {
  ...seed,
  sheets: [{ ...seed.sheets[0], name: "Budget" }],
};
assert(!isPristineBlankWorkbook(renamed), "renamed sheet must not be pristine");

const twoSheets: WorkbookJSON = {
  ...seed,
  sheets: [seed.sheets[0], { ...seed.sheets[0], id: "sheet2", name: "Sheet2" }],
};
assert(!isPristineBlankWorkbook(twoSheets), "multi-sheet must not be pristine");

console.log("workbook-blank.smoke: OK");

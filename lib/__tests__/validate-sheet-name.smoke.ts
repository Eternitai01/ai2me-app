/**
 * Run: cd web && npx --yes tsx lib/__tests__/validate-sheet-name.smoke.ts
 */

import assert from "node:assert/strict";
import type { Sheet } from "@fortune-sheet/core";
import { fortuneSheetsToWorkbook } from "../workbook-adapters";
import {
  SHEET_NAME_MAX_LENGTH,
  validateSheetName,
} from "../validate-sheet-name";

const empty = validateSheetName("   ", ["Employees"]);
assert.equal(empty.ok, false);
if (!empty.ok) {
  assert.equal(empty.reason, "empty");
  assert.equal(empty.message, "Sheet name cannot be empty");
}

const dup = validateSheetName("employees", ["Employees"]);
assert.equal(dup.ok, false);
if (!dup.ok) {
  assert.equal(dup.reason, "duplicate");
  assert.equal(dup.message, "Sheet name already exists");
}

const long = "a".repeat(SHEET_NAME_MAX_LENGTH + 1);
const tooLong = validateSheetName(long, []);
assert.equal(tooLong.ok, false);
if (!tooLong.ok) {
  assert.equal(tooLong.reason, "too_long");
  assert.equal(tooLong.message, "Sheet name cannot exceed 31 characters");
}

const ok = validateSheetName("  Employees  ", ["Other"]);
assert.equal(ok.ok, true);
if (ok.ok) assert.equal(ok.name, "Employees");

const sameAllowed = validateSheetName("Employees", []);
assert.equal(sameAllowed.ok, true);

const paddedDup = validateSheetName("Employees", ["  employees  "]);
assert.equal(paddedDup.ok, false);

const paddedFs = {
  id: "s1",
  name: "  Hello  ",
  celldata: [],
  order: 0,
  status: 1,
} as Sheet;
const mapped = fortuneSheetsToWorkbook([paddedFs], "s1");
assert.equal(mapped.sheets[0].name, "Hello");

console.log("validate-sheet-name.smoke: ok");

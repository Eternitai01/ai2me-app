export const SHEET_NAME_MAX_LENGTH = 31;

export type SheetNameValidationOk = { ok: true; name: string };
export type SheetNameValidationErr = {
  ok: false;
  reason: "empty" | "duplicate" | "too_long";
  message: string;
};
export type SheetNameValidationResult =
  | SheetNameValidationOk
  | SheetNameValidationErr;

const MSG = {
  empty: "Sheet name cannot be empty",
  duplicate: "Sheet name already exists",
  too_long: "Sheet name cannot exceed 31 characters",
} as const;

function namesEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Pure sheet-tab name validation. `existingNames` = other sheets only. */
export function validateSheetName(
  raw: string,
  existingNames: string[]
): SheetNameValidationResult {
  const name = raw.trim();
  if (name.length === 0) {
    return { ok: false, reason: "empty", message: MSG.empty };
  }
  if (name.length > SHEET_NAME_MAX_LENGTH) {
    return { ok: false, reason: "too_long", message: MSG.too_long };
  }
  if (existingNames.some((n) => namesEqual(n.trim(), name))) {
    return { ok: false, reason: "duplicate", message: MSG.duplicate };
  }
  return { ok: true, name };
}

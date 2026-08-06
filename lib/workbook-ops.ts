/**
 * Workbook-level patch protocol
 * -----------------------------
 * Extends sheet-ops so future NL edits can target sheets by name/id and perform
 * workbook structure changes (add/rename/delete/activate tabs) without a rewrite.
 *
 * Phase 3 applies sheet ops to the active sheet only.
 * Phase 4+ can emit optional `sheet` targeting and workbook ops below.
 *
 * Unknown ops are dropped (same as sheet-ops).
 */

import type { SpreadSheetData } from "@/lib/spreadjs-adapter";
import {
  applySheetOps,
  parseSheetOps,
  summariseOps,
  type SheetOp,
} from "@/lib/sheet-ops";
import { extractJSON, repairJSON } from "@/lib/spreadjs-adapter";
import type { WorkbookJSON, SheetJSON } from "@/lib/workbook-types";
import { findSheet } from "@/lib/workbook-types";
import {
  activeSheetToSpreadSheetData,
  replaceActiveSheet,
  sheetJsonToSpread,
  spreadToSheetJson,
} from "@/lib/workbook-adapters";

/** Sheet-scoped op with optional target (id or name). Default = active sheet. */
export type TargetedSheetOp = SheetOp & { sheet?: string };

export type WorkbookStructureOp =
  | { op: "setActiveSheet"; sheet: string }
  | { op: "addSheet"; name: string; index?: number }
  | { op: "deleteSheet"; sheet: string }
  | { op: "renameSheetTab"; sheet: string; name: string };

export type WorkbookOp = TargetedSheetOp | WorkbookStructureOp;

export type ApplyWorkbookOpsResult = {
  workbook: WorkbookJSON;
  applied: WorkbookOp[];
  skipped: string[];
};

function isIdx(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0;
}

function slugId(name: string, index: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "sheet"}-${index + 1}`;
}

function resolveSheet(
  workbook: WorkbookJSON,
  ref?: string
): SheetJSON | undefined {
  if (!ref) {
    return findSheet(workbook, workbook.activeSheetId) ?? workbook.sheets[0];
  }
  return (
    findSheet(workbook, ref) ||
    workbook.sheets.find((s) => s.name === ref) ||
    workbook.sheets.find((s) => s.name.toLowerCase() === ref.toLowerCase())
  );
}

function coerceWorkbookOp(raw: unknown): WorkbookOp | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  switch (o.op) {
    case "setActiveSheet":
      if (typeof o.sheet !== "string" || !o.sheet.trim()) return null;
      return { op: "setActiveSheet", sheet: o.sheet.trim() };

    case "addSheet":
      if (typeof o.name !== "string" || !o.name.trim()) return null;
      return {
        op: "addSheet",
        name: o.name.trim(),
        index: isIdx(o.index) ? o.index : undefined,
      };

    case "deleteSheet":
      if (typeof o.sheet !== "string" || !o.sheet.trim()) return null;
      return { op: "deleteSheet", sheet: o.sheet.trim() };

    case "renameSheetTab":
      if (
        typeof o.sheet !== "string" ||
        !o.sheet.trim() ||
        typeof o.name !== "string" ||
        !o.name.trim()
      ) {
        return null;
      }
      return {
        op: "renameSheetTab",
        sheet: o.sheet.trim(),
        name: o.name.trim(),
      };

    default: {
      // Reuse sheet-ops coercion via a one-op payload
      const sheetOps = parseSheetOps(JSON.stringify({ ops: [raw] }));
      if (!sheetOps?.length) return null;
      const sheetOp = sheetOps[0];
      const sheet =
        typeof o.sheet === "string" && o.sheet.trim()
          ? o.sheet.trim()
          : undefined;
      return sheet ? { ...sheetOp, sheet } : sheetOp;
    }
  }
}

/**
 * Parse ops that may include workbook structure ops and/or sheet-targeted sheet ops.
 * Returns null when the payload is a full sheet (caller falls back to parseLLMToSheetData).
 */
export function parseWorkbookOps(text: string): WorkbookOp[] | null {
  const jsonStr = extractJSON(text);
  if (!jsonStr) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    try {
      parsed = JSON.parse(repairJSON(jsonStr));
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;
  const payload = parsed as Record<string, unknown>;
  if (Array.isArray(payload.columns) || Array.isArray(payload.rows)) return null;
  if (!Array.isArray(payload.ops)) return null;

  const ops = payload.ops
    .map(coerceWorkbookOp)
    .filter((op): op is WorkbookOp => op !== null);
  return ops.length ? ops : null;
}

function isStructureOp(op: WorkbookOp): op is WorkbookStructureOp {
  return (
    op.op === "setActiveSheet" ||
    op.op === "addSheet" ||
    op.op === "deleteSheet" ||
    op.op === "renameSheetTab"
  );
}

/**
 * Apply workbook + sheet ops in order. Sheet ops without `sheet` target the active tab.
 */
export function applyWorkbookOps(
  workbook: WorkbookJSON,
  ops: WorkbookOp[]
): ApplyWorkbookOpsResult {
  let next: WorkbookJSON = {
    ...workbook,
    sheets: workbook.sheets.map((s) => ({ ...s, rows: s.rows.map((r) => r.slice()) })),
  };
  const applied: WorkbookOp[] = [];
  const skipped: string[] = [];

  // Group consecutive sheet ops that target the same sheet for one applySheetOps call
  let pendingTarget: string | undefined;
  let pendingSheetOps: SheetOp[] = [];

  const flushPending = () => {
    if (!pendingSheetOps.length) return;
    const target = resolveSheet(next, pendingTarget);
    if (!target) {
      skipped.push(`sheet:${pendingTarget ?? "(active)"}`);
      pendingSheetOps = [];
      pendingTarget = undefined;
      return;
    }
    const base = sheetJsonToSpread(target);
    const patched = applySheetOps(base, pendingSheetOps);
    next = {
      ...next,
      sheets: next.sheets.map((s) =>
        s.id === target.id ? spreadToSheetJson(patched, s.id) : s
      ),
      activeSheetId:
        pendingTarget && target.id !== next.activeSheetId
          ? next.activeSheetId
          : next.activeSheetId,
    };
    // If we patched active via renameSheet sheet-op, active id stays; name updates in sheet json
    pendingSheetOps = [];
    pendingTarget = undefined;
  };

  for (const op of ops) {
    if (isStructureOp(op)) {
      flushPending();
      switch (op.op) {
        case "setActiveSheet": {
          const t = resolveSheet(next, op.sheet);
          if (!t) {
            skipped.push(`setActiveSheet:${op.sheet}`);
            break;
          }
          next = { ...next, activeSheetId: t.id };
          applied.push(op);
          break;
        }
        case "addSheet": {
          const id = slugId(op.name, next.sheets.length);
          const sheet: SheetJSON = {
            id,
            name: op.name,
            columns: [{ name: "A" }],
            rows: [],
          };
          const sheets = next.sheets.slice();
          const idx =
            op.index !== undefined && op.index <= sheets.length
              ? op.index
              : sheets.length;
          sheets.splice(idx, 0, sheet);
          next = { ...next, sheets, activeSheetId: id };
          applied.push(op);
          break;
        }
        case "deleteSheet": {
          if (next.sheets.length <= 1) {
            skipped.push(`deleteSheet:last`);
            break;
          }
          const t = resolveSheet(next, op.sheet);
          if (!t) {
            skipped.push(`deleteSheet:${op.sheet}`);
            break;
          }
          const sheets = next.sheets.filter((s) => s.id !== t.id);
          const activeSheetId =
            next.activeSheetId === t.id ? sheets[0].id : next.activeSheetId;
          next = { ...next, sheets, activeSheetId };
          applied.push(op);
          break;
        }
        case "renameSheetTab": {
          const t = resolveSheet(next, op.sheet);
          if (!t) {
            skipped.push(`renameSheetTab:${op.sheet}`);
            break;
          }
          next = {
            ...next,
            sheets: next.sheets.map((s) =>
              s.id === t.id ? { ...s, name: op.name } : s
            ),
          };
          applied.push(op);
          break;
        }
      }
      continue;
    }

    const targetKey = op.sheet;
    if (pendingSheetOps.length && targetKey !== pendingTarget) {
      flushPending();
    }
    pendingTarget = targetKey;
    const { sheet: _sheet, ...sheetOp } = op as TargetedSheetOp;
    pendingSheetOps.push(sheetOp as SheetOp);
    applied.push(op);
  }
  flushPending();

  return { workbook: next, applied, skipped };
}

export function summariseWorkbookOps(ops: WorkbookOp[]): string {
  const structure = ops.filter(isStructureOp);
  const sheetOps = ops.filter((o) => !isStructureOp(o)) as SheetOp[];
  const parts: string[] = [];
  if (sheetOps.length) parts.push(summariseOps(sheetOps));
  if (structure.length) {
    parts.push(
      structure
        .map((o) => {
          switch (o.op) {
            case "setActiveSheet":
              return `activate "${o.sheet}"`;
            case "addSheet":
              return `add sheet "${o.name}"`;
            case "deleteSheet":
              return `delete sheet "${o.sheet}"`;
            case "renameSheetTab":
              return `rename "${o.sheet}" → "${o.name}"`;
          }
        })
        .join(", ")
    );
  }
  return parts.join("; ") || "updated";
}

/** Convenience: patch active sheet via classic sheet-ops when no workbook ops present. */
export function applySheetOpsToWorkbook(
  workbook: WorkbookJSON,
  sheetOps: SheetOp[]
): WorkbookJSON {
  const active = activeSheetToSpreadSheetData(workbook);
  if (!active) return workbook;
  return replaceActiveSheet(workbook, applySheetOps(active, sheetOps));
}

export type { SpreadSheetData };

/**
 * Sheet edit operations
 * ---------------------
 * A patch protocol for AI Sheets, mirroring the block-ops AI Docs uses for document edits.
 *
 * Before this, every follow-up ("set Bob's Maths to 95") made the model re-emit the entire sheet.
 * That is slow, bills the user for ~150 regenerated cells to change one, and leaves every
 * untouched cell free to drift — the model reproducing them correctly was luck, not a guarantee.
 *
 * With ops, one edit is one `setCell`. Cells nobody mentioned cannot change, structurally.
 *
 * The server prompt (EnhancedRoutingService._get_ai_sheets_instructions) emits these whenever a
 * CURRENT SHEET block is in context; it may still return a full sheet for sweeping changes, which
 * the caller handles by falling back to parseLLMToSheetData.
 */

import type { SpreadSheetData, SheetColumn, SheetFormula } from "@/lib/spreadjs-adapter";
import { extractJSON, repairJSON } from "@/lib/spreadjs-adapter";
import { evaluateFormulas } from "@/lib/formula-eval";

export type CellValue = string | number | boolean | null;

export type SheetOp =
    | { op: "setCell"; row: number; col: number; value: CellValue }
    | { op: "setFormula"; row: number; col: number; formula: string }
    | { op: "clearFormula"; row: number; col: number }
    | { op: "addRow"; index?: number; cells?: CellValue[] }
    | { op: "deleteRow"; index: number }
    | { op: "addColumn"; index?: number; column: SheetColumn; cells?: CellValue[] }
    | { op: "deleteColumn"; index: number }
    | { op: "renameColumn"; index: number; name: string }
    | { op: "renameSheet"; name: string }
    | { op: "setInsights"; insights: string[] };

// ─── Parsing ─────────────────────────────────────────────────────────────────

function toCellValue(v: unknown): CellValue {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") return v;
    return String(v);
}

/** Validate one op. Unknown or malformed ops are dropped rather than guessed at. */
function coerceOp(raw: unknown): SheetOp | null {
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    const isIdx = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;

    switch (o.op) {
        case "setCell":
            if (!isIdx(o.row) || !isIdx(o.col)) return null;
            return { op: "setCell", row: o.row, col: o.col, value: toCellValue(o.value) };

        case "setFormula":
            if (!isIdx(o.row) || !isIdx(o.col) || typeof o.formula !== "string" || !o.formula.trim()) return null;
            return { op: "setFormula", row: o.row, col: o.col, formula: o.formula };

        case "clearFormula":
            if (!isIdx(o.row) || !isIdx(o.col)) return null;
            return { op: "clearFormula", row: o.row, col: o.col };

        case "addRow":
            return {
                op: "addRow",
                index: isIdx(o.index) ? o.index : undefined,
                cells: Array.isArray(o.cells) ? o.cells.map(toCellValue) : undefined,
            };

        case "deleteRow":
            if (!isIdx(o.index)) return null;
            return { op: "deleteRow", index: o.index };

        case "addColumn": {
            const col = o.column as Record<string, unknown> | undefined;
            if (!col || typeof col !== "object" || typeof col.name !== "string") return null;
            return {
                op: "addColumn",
                index: isIdx(o.index) ? o.index : undefined,
                column: {
                    name: col.name,
                    type: typeof col.type === "string" ? col.type : "string",
                    width: typeof col.width === "number" ? col.width : undefined,
                    formatter: typeof col.formatter === "string" ? col.formatter : undefined,
                    colorSection: typeof col.colorSection === "string" ? col.colorSection : undefined,
                },
                cells: Array.isArray(o.cells) ? o.cells.map(toCellValue) : undefined,
            };
        }

        case "deleteColumn":
            if (!isIdx(o.index)) return null;
            return { op: "deleteColumn", index: o.index };

        case "renameColumn":
            if (!isIdx(o.index) || typeof o.name !== "string" || !o.name.trim()) return null;
            return { op: "renameColumn", index: o.index, name: o.name };

        case "renameSheet":
            if (typeof o.name !== "string" || !o.name.trim()) return null;
            return { op: "renameSheet", name: o.name };

        case "setInsights":
            if (!Array.isArray(o.insights)) return null;
            return { op: "setInsights", insights: o.insights.filter((i): i is string => typeof i === "string") };

        default:
            return null;
    }
}

/**
 * Pull an ops payload out of a model response.
 *
 * Returns null when the text isn't an ops payload — including when it's a full sheet — so the
 * caller can fall back to parseLLMToSheetData.
 */
export function parseSheetOps(text: string): SheetOp[] | null {
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

    // A full sheet is not an ops payload, even if it somehow carried an "ops" key.
    if (Array.isArray(payload.columns) || Array.isArray(payload.rows)) return null;
    if (!Array.isArray(payload.ops)) return null;

    const ops = payload.ops.map(coerceOp).filter((o): o is SheetOp => o !== null);
    return ops.length ? ops : null;
}

// ─── Applying ────────────────────────────────────────────────────────────────

/** Pad/trim a row to the column count so the grid never renders a ragged row. */
function fitRow(row: CellValue[], width: number): CellValue[] {
    const out: CellValue[] = [];
    for (let i = 0; i < width; i++) out.push(row[i] ?? null);
    return out;
}

/**
 * Apply ops in order and recompute formulas.
 *
 * Ops are applied sequentially because inserts/deletes shift later indices — the prompt tells the
 * model to index each op against the state left by the ops before it. Out-of-range ops are skipped
 * rather than throwing: a partly-applied edit beats a blank grid.
 */
export function applySheetOps(base: SpreadSheetData, ops: SheetOp[]): SpreadSheetData {
    let sheetName = base.sheetName;
    const columns: SheetColumn[] = base.columns.map((c) => ({ ...c }));
    let rows: CellValue[][] = base.rows.map((r) => r.slice() as CellValue[]);
    let formulas: SheetFormula[] = (base.formulas ?? []).map((f) => ({ ...f }));
    let keyInsights = base.keyInsights;

    const dropFormulaAt = (row: number, col: number) => {
        formulas = formulas.filter((f) => !(f.row === row && f.col === col));
    };

    for (const op of ops) {
        switch (op.op) {
            case "setCell": {
                if (op.row >= rows.length || op.col >= columns.length) break;
                rows[op.row][op.col] = op.value;
                // Deliberately does NOT drop the formula at this cell.
                //
                // Models hand-compute derived cells even when told not to: a single "change this
                // mark" edit came back as "5 cells updated, 3 formulas set". If setCell removed the
                // formula, that hand-computed total would become a permanent literal — and models
                // get this arithmetic wrong (a real sheet averaged its totals column to 687.9
                // instead of 787.9). Keeping the formula lets evaluateFormulas() below overwrite
                // the guess with the correct value.
                //
                // To make a computed cell genuinely literal, the model must emit clearFormula
                // first — that is what it is for.
                break;
            }

            case "setFormula": {
                if (op.row >= rows.length || op.col >= columns.length) break;
                dropFormulaAt(op.row, op.col);
                formulas.push({ row: op.row, col: op.col, formula: op.formula });
                break;
            }

            case "clearFormula":
                dropFormulaAt(op.row, op.col);
                break;

            case "addRow": {
                const at = op.index === undefined ? rows.length : Math.min(op.index, rows.length);
                rows.splice(at, 0, fitRow(op.cells ?? [], columns.length));
                // Formulas below the insert point shift down with their rows.
                formulas = formulas.map((f) => (f.row >= at ? { ...f, row: f.row + 1 } : f));
                break;
            }

            case "deleteRow": {
                if (op.index >= rows.length) break;
                rows.splice(op.index, 1);
                formulas = formulas
                    .filter((f) => f.row !== op.index)
                    .map((f) => (f.row > op.index ? { ...f, row: f.row - 1 } : f));
                break;
            }

            case "addColumn": {
                const at = op.index === undefined ? columns.length : Math.min(op.index, columns.length);
                columns.splice(at, 0, op.column);
                rows = rows.map((r, i) => {
                    const copy = r.slice();
                    copy.splice(at, 0, op.cells?.[i] ?? null);
                    return copy;
                });
                formulas = formulas.map((f) => (f.col >= at ? { ...f, col: f.col + 1 } : f));
                break;
            }

            case "deleteColumn": {
                if (op.index >= columns.length) break;
                columns.splice(op.index, 1);
                rows = rows.map((r) => {
                    const copy = r.slice();
                    copy.splice(op.index, 1);
                    return copy;
                });
                formulas = formulas
                    .filter((f) => f.col !== op.index)
                    .map((f) => (f.col > op.index ? { ...f, col: f.col - 1 } : f));
                break;
            }

            case "renameColumn":
                if (op.index < columns.length) columns[op.index] = { ...columns[op.index], name: op.name };
                break;

            case "renameSheet":
                sheetName = op.name;
                break;

            case "setInsights":
                keyInsights = op.insights.length ? op.insights : undefined;
                break;
        }
    }

    // Keep every row aligned to the column count after structural edits.
    rows = rows.map((r) => fitRow(r, columns.length));

    // Formulas are authoritative; the model is explicitly told not to recompute totals by hand.
    return evaluateFormulas({
        ...base,
        sheetName,
        columns,
        rows,
        formulas: formulas.length ? formulas : undefined,
        keyInsights,
    });
}

/** Short human summary of an ops batch, for the chat bubble. */
export function summariseOps(ops: SheetOp[]): string {
    const counts = new Map<string, number>();
    for (const o of ops) counts.set(o.op, (counts.get(o.op) ?? 0) + 1);

    const label: Record<string, [string, string]> = {
        setCell: ["cell updated", "cells updated"],
        setFormula: ["formula set", "formulas set"],
        clearFormula: ["formula cleared", "formulas cleared"],
        addRow: ["row added", "rows added"],
        deleteRow: ["row deleted", "rows deleted"],
        addColumn: ["column added", "columns added"],
        deleteColumn: ["column deleted", "columns deleted"],
        renameColumn: ["column renamed", "columns renamed"],
        renameSheet: ["sheet renamed", "sheet renamed"],
        setInsights: ["insights updated", "insights updated"],
    };

    const parts: string[] = [];
    for (const [op, n] of counts) {
        const [one, many] = label[op] ?? [op, op];
        parts.push(`${n} ${n === 1 ? one : many}`);
    }
    return parts.join(", ");
}

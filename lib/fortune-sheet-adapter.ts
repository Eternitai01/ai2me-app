/**
 * FortuneSheet adapters
 * ---------------------
 * Pure, React-free conversions between SpreadSheetData (the AI Sheets contract, see
 * spreadjs-adapter.ts) and FortuneSheet's Sheet/celldata shape.
 *
 * Kept out of the component so the data mapping — the part that actually corrupts user data when
 * it is wrong — can be unit tested without mounting a grid or a browser.
 */

import type { Sheet, Cell } from "@fortune-sheet/core";
import type { SpreadSheetData, SheetFormula } from "@/lib/spreadjs-adapter";

/** Visible empty grid when WorkbookJSON has no content yet (Genspark-like). */
export const BLANK_CANVAS_COLS = 26;
export const BLANK_CANVAS_ROWS = 50;

function isLetterColName(name: string): boolean {
  return /^[A-Z]{1,3}$/.test(name.trim());
}

/** True when sheet uses Excel letter chrome, not AI/user header labels. */
export function isCanvasSpread(data: SpreadSheetData): boolean {
  if (data.columns.length === 0) return true;
  return data.columns.every((c) => isLetterColName(c.name ?? ""));
}

function colLetter(i: number): string {
  let n = i;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function cellNonEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  return true;
}

// ─── Color section palette ────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, { bg: string; fc: string }> = {
  blue:   { bg: "#1565C0", fc: "#FFFFFF" },
  red:    { bg: "#C62828", fc: "#FFFFFF" },
  green:  { bg: "#2E7D32", fc: "#FFFFFF" },
  orange: { bg: "#E65100", fc: "#FFFFFF" },
  purple: { bg: "#6A1B9A", fc: "#FFFFFF" },
};

const HEADER_BG = "#1E40AF";
const HEADER_FC = "#FFFFFF";
const ALT_ROW_BG = "#F0F4FF";


// ─── Adapter: SpreadSheetData → FortuneSheet Sheet[] ─────────────────────────
/**
 * @param containerWidth  Optional pixel width of the grid container. When supplied and
 *                        the total natural column widths fall short of the available area,
 *                        columns are scaled up proportionally so they fill the panel.
 */
export function toFortuneSheets(data: SpreadSheetData, containerWidth?: number): Sheet[] {
  // Canvas mode: no header row from column names — A1 is data row 0 (avoids A1→A2 shift).
  if (isCanvasSpread(data)) {
    const celldata: { r: number; c: number; v: Cell }[] = [];
    let maxColUsed = -1;

    data.rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell === null || cell === undefined) return;
        if (typeof cell === "string" && cell.trim() === "") return;
        if (ci > maxColUsed) maxColUsed = ci;
        const isNum =
          typeof cell === "number" ||
          (typeof cell === "string" && cell.trim() !== "" && !isNaN(Number(cell)));
        const numVal = isNum ? Number(cell) : undefined;
        celldata.push({
          r: ri,
          c: ci,
          v: {
            v: numVal !== undefined ? numVal : String(cell),
            m: String(cell),
            ct: { fa: "General", t: isNum ? "n" : "s" },
            bg: "#FFFFFF",
            fc: "#1F2937",
            ht: isNum ? 2 : 0,
          },
        });
      });
    });

    if (data.formulas?.length) {
      const index = new Map<string, { r: number; c: number; v: Cell }>();
      celldata.forEach((cd) => index.set(`${cd.r}_${cd.c}`, cd));
      data.formulas.forEach(({ row, col, formula }) => {
        const f = formula.startsWith("=") ? formula : `=${formula}`;
        if (col > maxColUsed) maxColUsed = col;
        const existing = index.get(`${row}_${col}`);
        if (existing) {
          existing.v.f = f;
        } else {
          const cd = {
            r: row,
            c: col,
            v: { f, ct: { fa: "General", t: "n" } } as Cell,
          };
          celldata.push(cd);
          index.set(`${row}_${col}`, cd);
        }
      });
    }

    return [
      {
        name: data.sheetName || "Sheet1",
        id: "sheet1",
        status: 1,
        order: 0,
        celldata,
        column: Math.max(BLANK_CANVAS_COLS, data.columns.length, maxColUsed + 1),
        row: Math.max(BLANK_CANVAS_ROWS, data.rows.length),
        config: {},
      },
    ];
  }

  const celldata: { r: number; c: number; v: Cell }[] = [];

  // Header row (row 0)
  data.columns.forEach((col, ci) => {
    const section = col.colorSection ? SECTION_COLORS[col.colorSection] : null;
    celldata.push({
      r: 0,
      c: ci,
      v: {
        v: col.name,
        m: col.name,
        ct: { fa: "General", t: "s" },
        bl: 1,
        bg: section ? section.bg : HEADER_BG,
        fc: section ? section.fc : HEADER_FC,
        ht: 0,
        vt: 0,
      },
    });
  });

  // Data rows (row 1+)
  //
  // colorSection deliberately does NOT apply here — the prompt defines it as a *header* tag
  // ("tag colorSection=\"blue\" on the header"). Painting whole columns with it made every sheet
  // a wall of saturated blue/purple, and it also meant `section` always won over ALT_ROW_BG, so
  // the zebra striping below was dead code that never rendered.
  data.rows.forEach((row, ri) => {
    const isAlt = ri % 2 === 1;
    row.forEach((cell, ci) => {
      if (cell === null || cell === undefined) return;
      const col = data.columns[ci];
      const isNum =
        typeof cell === "number" ||
        (typeof cell === "string" && cell.trim() !== "" && !isNaN(Number(cell)));
      const numVal = isNum ? Number(cell) : undefined;

      celldata.push({
        r: ri + 1,
        c: ci,
        v: {
          v: numVal !== undefined ? numVal : String(cell),
          m: String(cell),
          ct: { fa: col?.formatter || "General", t: isNum ? "n" : "s" },
          bg: isAlt ? ALT_ROW_BG : "#FFFFFF",
          fc: "#1F2937",
          ht: isNum ? 2 : 0,
        },
      });
    });
  });

  // Formulas — attach f to the cell that already holds the computed value.
  //
  // `m` is FortuneSheet's *display* value. The old else-branch set `m: f`, which rendered the
  // literal text "=AVERAGE(B2:B11)" in the cell instead of a number. That fired constantly,
  // because the prompt told the model to leave formula cells null and null cells are skipped
  // above — so `existing` was never found. The prompt now requires the computed value in rows[],
  // so the `existing` path is the normal one and the cell shows a number with the formula live
  // in the formula bar.
  if (data.formulas?.length) {
    // Index by "r_c" — the previous celldata.find() was a linear scan per formula, i.e.
    // O(cells x formulas) on every render.
    const index = new Map<string, { r: number; c: number; v: Cell }>();
    celldata.forEach((cd) => index.set(`${cd.r}_${cd.c}`, cd));

    data.formulas.forEach(({ row, col, formula }) => {
      const f = formula.startsWith("=") ? formula : `=${formula}`;
      const existing = index.get(`${row + 1}_${col}`);
      if (existing) {
        existing.v.f = f;
      } else {
        // Defensive: model gave a formula with no value. Render blank rather than dumping the
        // raw formula string into the cell — the formula still travels to Excel via `f`.
        const cd = {
          r: row + 1,
          c: col,
          v: { f, ct: { fa: data.columns[col]?.formatter || "General", t: "n" } } as Cell,
        };
        celldata.push(cd);
        index.set(`${row + 1}_${col}`, cd);
      }
    });
  }

  // Column widths — auto-stretch to fill container when possible.
  const ROW_HEADER_PX = 46;
  const MIN_COL_PX    = 80;
  const rawWidths = data.columns.map(c => Math.max(c.width || 120, MIN_COL_PX));
  const totalRaw  = rawWidths.reduce((a, b) => a + b, 0);
  const available = containerWidth ? containerWidth - ROW_HEADER_PX : 0;

  let finalWidths: number[];
  if (available > totalRaw && available > 0) {
    // Scale up proportionally — columns fill the panel, no empty grey space.
    const scale = available / totalRaw;
    finalWidths = rawWidths.map(w => Math.floor(w * scale));
    // Distribute rounding remainder to first column so total === available.
    const diff = available - finalWidths.reduce((a, b) => a + b, 0);
    if (finalWidths.length > 0) finalWidths[0] += diff;
  } else {
    finalWidths = rawWidths;
  }

  const colwidths: Record<number, number> = {};
  finalWidths.forEach((w, i) => { colwidths[i] = w; });

  return [
    {
      name: data.sheetName || "Sheet1",
      id: "sheet1",
      status: 1,
      order: 0,
      celldata,
      column: data.columns.length,
      row: data.rows.length + 1,
      config: { columnlen: colwidths },
    },
  ];
}

// ─── Adapter: FortuneSheet Sheet[] → SpreadSheetData ─────────────────────────
/**
 * True when two sheets carry the same user-visible content.
 *
 * Used to suppress no-op updates: FortuneSheet can fire onChange without the data actually
 * changing, and since every read produces a fresh object, emitting unconditionally would push new
 * state on each call and re-render forever.
 */
export function sameSheetContent(a: SpreadSheetData, b: SpreadSheetData): boolean {
    if (a === b) return true;
    if (a.sheetName !== b.sheetName) return false;
    if (a.columns.length !== b.columns.length) return false;
    if (a.rows.length !== b.rows.length) return false;

    for (let i = 0; i < a.columns.length; i++) {
        if (a.columns[i]?.name !== b.columns[i]?.name) return false;
    }
    for (let r = 0; r < a.rows.length; r++) {
        const ra = a.rows[r];
        const rb = b.rows[r];
        if (ra.length !== rb?.length) return false;
        for (let c = 0; c < ra.length; c++) {
            if (ra[c] !== rb[c]) return false;
        }
    }

    const fa = a.formulas ?? [];
    const fb = b.formulas ?? [];
    if (fa.length !== fb.length) return false;
    for (let i = 0; i < fa.length; i++) {
        if (fa[i].row !== fb[i].row || fa[i].col !== fb[i].col || fa[i].formula !== fb[i].formula) {
            return false;
        }
    }

    return true;
}

export function fromFortuneSheet(sheets: Sheet[], prev: SpreadSheetData): SpreadSheetData | null {
  const sheet = sheets?.[0];
  const matrix = sheet?.data;
  if (!matrix?.length) return null;

  // Canvas mode: all matrix rows are data (A1 = row 0). Letter columns only.
  if (isCanvasSpread(prev) || prev.columns.length === 0) {
    let maxC = -1;
    let maxR = -1;
    for (let r = 0; r < matrix.length; r++) {
      const line = matrix[r];
      if (!line) continue;
      for (let c = 0; c < line.length; c++) {
        const cell = line[c];
        const v = cell?.v;
        const display = cell?.m ?? cell?.v;
        if (cellNonEmptyValue(v) || cellNonEmptyValue(display) || cell?.f) {
          if (c > maxC) maxC = c;
          if (r > maxR) maxR = r;
        }
      }
    }

    const sheetName = sheet?.name || prev.sheetName || "Sheet1";
    if (maxC < 0) {
      return { sheetName, columns: [], rows: [] };
    }

    const colCount = maxC + 1;
    const columns = Array.from({ length: colCount }, (_, i) => ({
      name: colLetter(i),
    }));
    const rows: SpreadSheetData["rows"] = [];
    const formulas: SheetFormula[] = [];

    for (let r = 0; r <= maxR; r++) {
      const line = matrix[r];
      const out: (string | number | null | boolean)[] = [];
      for (let c = 0; c < colCount; c++) {
        const cell = line?.[c];
        const v = cell?.v;
        out.push(v === undefined || v === "" ? null : (v as string | number | boolean));
        if (cell?.f) {
          formulas.push({ row: r, col: c, formula: cell.f });
        }
      }
      rows.push(out);
    }

    while (rows.length && rows[rows.length - 1].every((v) => v === null)) rows.pop();

    return {
      sheetName,
      columns,
      rows,
      formulas: formulas.length ? formulas : undefined,
    };
  }

  const colCount = prev.columns.length;

  // Header row — the user may have renamed a column in place.
  const headerRow = matrix[0];
  const columns = prev.columns.map((col, ci) => {
    const cell = headerRow?.[ci];
    const name = cell?.m ?? cell?.v;
    return name === undefined || name === null || name === ""
      ? col
      : { ...col, name: String(name) };
  });

  const rows: SpreadSheetData["rows"] = [];
  const formulas: SheetFormula[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const out: (string | number | null | boolean)[] = [];
    for (let c = 0; c < colCount; c++) {
      const cell = line?.[c];
      // Prefer v (the computed/raw value). For a formula cell FortuneSheet stores the
      // evaluated result in v, so exports get the number, not the formula text.
      const v = cell?.v;
      out.push(v === undefined || v === "" ? null : (v as string | number | boolean));
      if (cell?.f) {
        formulas.push({ row: r - 1, col: c, formula: cell.f });
      }
    }
    rows.push(out);
  }

  // Drop trailing all-empty rows — FortuneSheet keeps spare canvas rows below the data.
  while (rows.length && rows[rows.length - 1].every((v) => v === null)) rows.pop();

  return {
    ...prev,
    sheetName: sheet?.name || prev.sheetName,
    columns,
    rows,
    formulas: formulas.length ? formulas : undefined,
  };
}

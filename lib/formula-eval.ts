/**
 * Formula evaluation for AI Sheets
 * --------------------------------
 * Computes the values of SpreadSheetData.formulas instead of trusting the numbers the model put
 * in rows[].
 *
 * Why this exists: the generation prompt requires the model to supply both the formula and its
 * computed value, because a null there renders blank and exports blank. But models get arithmetic
 * wrong. Observed in a real 10-student marks sheet: every per-student total and every per-subject
 * average was right, yet AVERAGE over the Total Marks column came back 687.9 instead of 787.9 —
 * a silent 100-off error in a cell a teacher would trust.
 *
 * FortuneSheet ships a formula engine but does not recalculate on load (it renders the cached
 * v/m we hand it), so the grid cannot be relied on to correct the model either.
 *
 * Scope is deliberately small: the functions the prompt actually asks for, plus arithmetic. Any
 * formula this cannot parse leaves the model's original value untouched — never worse than before.
 */

import type { SpreadSheetData } from "@/lib/spreadjs-adapter";

// ─── Cell references ─────────────────────────────────────────────────────────

/** "AA" -> 26 */
function colLettersToIndex(letters: string): number {
    let n = 0;
    for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
}

export interface CellRef {
    row: number; // index into SpreadSheetData.rows (header excluded)
    col: number;
}

/**
 * "B2" / "$B$12" -> data coords.
 *
 * Excel row 1 is the header (columns[].name), so Excel row 2 is rows[0]. Absolute markers ($) are
 * irrelevant here — nothing is being filled down, so $B$12 and B12 address the same cell.
 */
export function parseCellRef(ref: string): CellRef | null {
    const m = /^\$?([A-Za-z]+)\$?(\d+)$/.exec(ref.trim());
    if (!m) return null;
    const col = colLettersToIndex(m[1]);
    const excelRow = parseInt(m[2], 10);
    if (excelRow < 2) return null; // header row or invalid — not a data cell
    return { row: excelRow - 2, col };
}

/** "B2:B11" -> every cell in the span. */
export function parseRange(range: string): CellRef[] | null {
    const [a, b] = range.split(":");
    if (!a || !b) return null;
    const start = parseCellRef(a);
    const end = parseCellRef(b);
    if (!start || !end) return null;

    const cells: CellRef[] = [];
    for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
        for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
            cells.push({ row: r, col: c });
        }
    }
    return cells;
}

// ─── Tokenizer ───────────────────────────────────────────────────────────────

type Token =
    | { t: "num"; v: number }
    | { t: "range"; v: string }
    | { t: "ref"; v: string }
    | { t: "func"; v: string }
    | { t: "op"; v: string };

function tokenize(src: string): Token[] | null {
    const tokens: Token[] = [];
    let i = 0;

    while (i < src.length) {
        const ch = src[i];

        if (/\s/.test(ch)) { i++; continue; }

        if (/[+\-*/(),%^]/.test(ch)) { tokens.push({ t: "op", v: ch }); i++; continue; }

        if (/[0-9.]/.test(ch)) {
            const m = /^[0-9]*\.?[0-9]+/.exec(src.slice(i));
            if (!m) return null;
            tokens.push({ t: "num", v: parseFloat(m[0]) });
            i += m[0].length;
            continue;
        }

        if (/[A-Za-z$]/.test(ch)) {
            // Longest match first: range, then single ref, then function name.
            const rest = src.slice(i);
            const range = /^\$?[A-Za-z]+\$?[0-9]+:\$?[A-Za-z]+\$?[0-9]+/.exec(rest);
            if (range) { tokens.push({ t: "range", v: range[0] }); i += range[0].length; continue; }

            const ref = /^\$?[A-Za-z]+\$?[0-9]+/.exec(rest);
            if (ref) { tokens.push({ t: "ref", v: ref[0] }); i += ref[0].length; continue; }

            const fn = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest);
            if (fn) { tokens.push({ t: "func", v: fn[0].toUpperCase() }); i += fn[0].length; continue; }

            return null;
        }

        return null; // unknown character — bail rather than guess
    }

    return tokens;
}

// ─── Evaluator ───────────────────────────────────────────────────────────────

const AGGREGATES: Record<string, (nums: number[]) => number> = {
    SUM: (n) => n.reduce((a, b) => a + b, 0),
    AVERAGE: (n) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0),
    AVG: (n) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0),
    COUNT: (n) => n.length,
    MIN: (n) => (n.length ? Math.min(...n) : 0),
    MAX: (n) => (n.length ? Math.max(...n) : 0),
    PRODUCT: (n) => n.reduce((a, b) => a * b, 1),
};

class Bail extends Error {}

/**
 * Recursive-descent parser/evaluator.
 * grammar: expr := term (('+'|'-') term)* ; term := unary (('*'|'/') unary)* ; unary := '-'? power
 *          power := atom ('^' unary)? ; atom := num | ref | func '(' args ')' | '(' expr ')'
 */
class Evaluator {
    private pos = 0;
    constructor(
        private tokens: Token[],
        private resolve: (ref: CellRef) => number,
    ) {}

    private peek(): Token | undefined { return this.tokens[this.pos]; }
    private next(): Token | undefined { return this.tokens[this.pos++]; }

    private isOp(v: string): boolean {
        const t = this.peek();
        return !!t && t.t === "op" && t.v === v;
    }

    run(): number {
        const v = this.expr();
        if (this.pos !== this.tokens.length) throw new Bail("trailing tokens");
        return v;
    }

    private expr(): number {
        let left = this.term();
        for (;;) {
            if (this.isOp("+")) { this.next(); left += this.term(); }
            else if (this.isOp("-")) { this.next(); left -= this.term(); }
            else return left;
        }
    }

    private term(): number {
        let left = this.unary();
        for (;;) {
            if (this.isOp("*")) { this.next(); left *= this.unary(); }
            else if (this.isOp("/")) {
                this.next();
                const d = this.unary();
                if (d === 0) throw new Bail("division by zero");
                left /= d;
            } else return left;
        }
    }

    private unary(): number {
        if (this.isOp("-")) { this.next(); return -this.unary(); }
        if (this.isOp("+")) { this.next(); return this.unary(); }
        return this.power();
    }

    private power(): number {
        const base = this.atom();
        if (this.isOp("^")) { this.next(); return Math.pow(base, this.unary()); }
        return base;
    }

    /** Values for one argument: a range expands, anything else is a single number. */
    private argValues(): number[] {
        const t = this.peek();
        if (t?.t === "range") {
            this.next();
            const cells = parseRange(t.v);
            if (!cells) throw new Bail("bad range");
            return cells.map((c) => this.resolve(c));
        }
        return [this.expr()];
    }

    private atom(): number {
        const t = this.next();
        if (!t) throw new Bail("unexpected end");

        if (t.t === "num") {
            // Excel's trailing % operator: 50% -> 0.5
            if (this.isOp("%")) { this.next(); return t.v / 100; }
            return t.v;
        }

        if (t.t === "ref") {
            const c = parseCellRef(t.v);
            if (!c) throw new Bail("bad ref");
            return this.resolve(c);
        }

        if (t.t === "range") {
            // A bare range outside a function isn't meaningful here.
            throw new Bail("bare range");
        }

        if (t.t === "func") {
            if (!this.isOp("(")) throw new Bail("expected (");
            this.next();

            const args: number[] = [];
            if (!this.isOp(")")) {
                for (;;) {
                    args.push(...this.argValues());
                    if (this.isOp(",")) { this.next(); continue; }
                    break;
                }
            }
            if (!this.isOp(")")) throw new Bail("expected )");
            this.next();

            const fn = AGGREGATES[t.v];
            if (fn) return fn(args);
            if (t.v === "ROUND") {
                const [x, digits = 0] = args;
                const p = Math.pow(10, digits);
                return Math.round(x * p) / p;
            }
            if (t.v === "ABS") return Math.abs(args[0]);
            throw new Bail(`unsupported function ${t.v}`);
        }

        if (t.t === "op" && t.v === "(") {
            const v = this.expr();
            if (!this.isOp(")")) throw new Bail("expected )");
            this.next();
            return v;
        }

        throw new Bail("unexpected token");
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Recompute every formula cell and write the result into rows[].
 *
 * Lazily resolves dependencies, so a "% of Total" formula pointing at a TOTAL cell that is itself
 * a SUM works without any ordering. Cycles and unparseable formulas fall back to the model's
 * original value rather than throwing.
 */
export function evaluateFormulas(data: SpreadSheetData): SpreadSheetData {
    if (!data.formulas?.length) return data;

    const formulaAt = new Map<string, string>();
    for (const f of data.formulas) formulaAt.set(`${f.row}_${f.col}`, f.formula);

    const memo = new Map<string, number>();
    const inFlight = new Set<string>();

    const rawValue = (ref: CellRef): number => {
        const v = data.rows[ref.row]?.[ref.col];
        if (typeof v === "number") return v;
        if (typeof v === "boolean") return v ? 1 : 0;
        if (typeof v === "string") {
            const n = Number(v.replace(/[,\s]/g, ""));
            return Number.isFinite(n) ? n : 0;
        }
        return 0; // null/empty behaves like Excel: 0
    };

    const resolve = (ref: CellRef): number => {
        const key = `${ref.row}_${ref.col}`;
        const memoed = memo.get(key);
        if (memoed !== undefined) return memoed;

        const formula = formulaAt.get(key);
        if (!formula) return rawValue(ref);

        if (inFlight.has(key)) throw new Bail("circular reference");
        inFlight.add(key);
        try {
            const v = compute(formula);
            memo.set(key, v);
            return v;
        } finally {
            inFlight.delete(key);
        }
    };

    const compute = (formula: string): number => {
        const body = formula.startsWith("=") ? formula.slice(1) : formula;
        const tokens = tokenize(body);
        if (!tokens?.length) throw new Bail("tokenize failed");
        return new Evaluator(tokens, resolve).run();
    };

    const rows = data.rows.map((r) => r.slice());

    for (const { row, col, formula } of data.formulas) {
        if (row < 0 || row >= rows.length || col < 0 || col >= data.columns.length) continue;
        try {
            const key = `${row}_${col}`;
            inFlight.add(key);
            let v: number;
            try {
                v = compute(formula);
            } finally {
                inFlight.delete(key);
            }
            if (!Number.isFinite(v)) continue; // leave the model's value alone

            // Trim binary-float noise (0.1+0.2) without pretending to more precision than we have.
            memo.set(key, v);
            rows[row][col] = Math.round(v * 1e10) / 1e10;
        } catch {
            // Unparseable or circular — keep whatever the model supplied.
        }
    }

    return { ...data, rows };
}

/**
 * Spreadsheet Adapter
 * -------------------
 * Converts raw LLM text/JSON into a normalised SpreadSheetData structure
 * used by the FortuneSheet spreadsheet renderer (AI Sheets).
 *
 * Architecture:
 *   LLM response (string)
 *       └─► extractJSON()        → raw JSON block
 *       └─► repairJSON()         → fix LLM JSON dialects (only if strict parse fails)
 *       └─► validateAndRepair()  → sanitised SpreadSheetData
 *       └─► parseLLMToSheetData() → SpreadSheetData
 *       └─► FortuneSheetRenderer
 *
 * The generation prompt itself is NOT here — it is server-owned and gated on agent_id, in
 * api/app/services/enhanced_routing_service.py::_get_ai_sheets_instructions().
 */

import { evaluateFormulas } from "@/lib/formula-eval";

// ─── Public types ────────────────────────────────────────────────────────────

export interface SheetColumn {
    name: string;
    /** 'string' | 'number' | 'date' | 'boolean' | 'formula' */
    type?: string;
    /** optional pixel width */
    width?: number;
    /** format string, e.g. "#,##0.00" or "mm/dd/yyyy" */
    formatter?: string;
    /** color section: 'blue' | 'red' | 'green' | 'orange' | 'purple' */
    colorSection?: string;
}

export interface SheetFormula {
    /** 0-based row index */
    row: number;
    /** 0-based column index */
    col: number;
    /** formula string, e.g. "=SUM(B2:B10)" */
    formula: string;
}

export interface SpreadSheetData {
    /** Tab/sheet name */
    sheetName: string;
    columns: SheetColumn[];
    /** Each row is an array aligned to columns */
    rows: (string | number | null | boolean)[][];
    formulas?: SheetFormula[];
    /** Key insights bullet points */
    keyInsights?: string[];
}

// ─── LLM System prompt ───────────────────────────────────────────────────────
//
// MOVED SERVER-SIDE. The prompt now lives in
// api/app/services/enhanced_routing_service.py::_get_ai_sheets_instructions()
// and is gated on session_metadata.agent_id == "ai-sheets".
//
// It used to be prepended into `additional_content` from the browser, which meant it could not be
// changed without a frontend deploy and was tamperable in the bundle. Worse, session_service
// sniffed it with startswith("You are a spreadsheet") — a guard that silently died when the prompt
// was reworded to "You are a professional spreadsheet ...", demoting the schema to
// "ATTACHED DOCUMENT(S) FROM USER". Do not reintroduce a client-side prompt here.



// ─── JSON extraction ─────────────────────────────────────────────────────────

/**
 * Pull the first JSON object out of an arbitrary LLM response string.
 * Handles:
 *  - Pure JSON
 *  - JSON wrapped in ```json … ``` code fences
 *  - JSON embedded inside prose
 */
export function extractJSON(text: string): string | null {
    if (!text || typeof text !== "string") return null;

    const trimmed = text.trim();

    // Code-fenced JSON? Unwrap first, then scan the contents below — a fence can still
    // contain trailing prose after the closing brace.
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const haystack = fenceMatch?.[1] ? fenceMatch[1].trim() : trimmed;

    // Scan for the first balanced {…} block.
    //
    // This is deliberately NOT short-circuited on haystack.startsWith("{"). Returning the whole
    // string when it merely *begins* with "{" breaks on the common "JSON then a closing sentence"
    // response — JSON.parse chokes on the trailing prose and the sheet silently fails to render.
    // The scanner below handles bare, fenced, and prose-wrapped JSON uniformly.
    const braceStart = haystack.indexOf("{");
    if (braceStart === -1) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = braceStart; i < haystack.length; i++) {
        const ch = haystack[i];

        // Braces inside string literals (e.g. a Notes cell containing "{}") must not move depth.
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === "\\") escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }

        if (ch === '"') inString = true;
        else if (ch === "{") depth++;
        else if (ch === "}") {
            depth--;
            if (depth === 0) return haystack.slice(braceStart, i + 1);
        }
    }

    return null;
}

// ─── Validation & repair ─────────────────────────────────────────────────────

type RawLLMPayload = {
    sheetName?: unknown;
    columns?: unknown;
    rows?: unknown;
    formulas?: unknown;
    keyInsights?: unknown;
};

function isStringArray(arr: unknown): arr is string[] {
    return Array.isArray(arr) && arr.every((x) => typeof x === "string");
}

/**
 * Sanitise and repair a raw parsed JSON object into SpreadSheetData.
 * Returns null if the payload is unrecoverable.
 */
export function validateAndRepair(raw: unknown): SpreadSheetData | null {
    if (!raw || typeof raw !== "object") return null;

    const payload = raw as RawLLMPayload;

    // ── sheetName ──────────────────────────────────────────────────────────────
    const sheetName = typeof payload.sheetName === "string" && payload.sheetName.trim()
        ? payload.sheetName.trim()
        : "Sheet1";

    // ── columns ────────────────────────────────────────────────────────────────
    let columns: SheetColumn[] = [];

    if (Array.isArray(payload.columns)) {
        columns = payload.columns
            .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
            .map((c) => ({
                name: typeof c.name === "string" ? c.name : String(c.name ?? ""),
                type: typeof c.type === "string" ? c.type : "string",
                width: typeof c.width === "number" ? c.width : undefined,
                formatter: typeof c.formatter === "string" ? c.formatter : undefined,
                colorSection: typeof c.colorSection === "string" ? c.colorSection : undefined,
            }));
    }

    // If the model returned string[] for columns, convert it.
    if (columns.length === 0 && isStringArray(payload.columns)) {
        columns = (payload.columns as string[]).map((name) => ({ name, type: "string" }));
    }

    if (columns.length === 0) return null;

    // ── rows ───────────────────────────────────────────────────────────────────
    let rows: SpreadSheetData["rows"] = [];

    if (Array.isArray(payload.rows)) {
        rows = payload.rows
            .filter(Array.isArray)
            .map((r: unknown[]) => {
                // Pad / trim each row to match column count
                const padded: (string | number | null | boolean)[] = [];
                for (let i = 0; i < columns.length; i++) {
                    const cell = r[i];
                    if (cell === null || cell === undefined) {
                        padded.push(null);
                    } else if (typeof cell === "number" || typeof cell === "boolean") {
                        padded.push(cell);
                    } else {
                        padded.push(String(cell));
                    }
                }
                return padded;
            });
    }

    // ── formulas ───────────────────────────────────────────────────────────────
    let formulas: SheetFormula[] | undefined;

    if (Array.isArray(payload.formulas)) {
        formulas = payload.formulas
            .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
            .filter(
                (f) =>
                    typeof f.row === "number" &&
                    typeof f.col === "number" &&
                    typeof f.formula === "string"
            )
            .map((f) => ({
                row: f.row as number,
                col: f.col as number,
                formula: f.formula as string,
            }));
    }

    // ── keyInsights ────────────────────────────────────────────────────────────
    let keyInsights: string[] | undefined;
    if (Array.isArray(payload.keyInsights)) {
        keyInsights = payload.keyInsights
            .filter((k) => typeof k === "string")
            .map((k) => k as string);
        if (keyInsights.length === 0) keyInsights = undefined;
    }

    return { sheetName, columns, rows, formulas, keyInsights };
}

// ─── JSON repair ─────────────────────────────────────────────────────────────

/**
 * Repair the JSON dialects LLMs actually emit, without corrupting string contents.
 *
 * This walks the source tracking string state instead of using global regexes. The previous
 * regex pass (`/([{,]\s*)(\w+):/g`) matched *inside* string values too, so a perfectly
 * reasonable cell like  "Notes": "Digital ads, budget: high"  was rewritten to
 * "Notes": "Digital ads, "budget": high"  — turning recoverable JSON into garbage.
 *
 * Repairs applied (outside string literals only):
 *  - trailing commas before } or ]
 *  - unquoted object keys
 *  - // line comments and slash-star block comments
 * Repairs applied (inside string literals only):
 *  - raw newlines/tabs, which are illegal in JSON strings but common in multi-line Notes cells
 *
 * Comments matter because the prompt's own schema is annotated with them
 * ({"op": "setCell", ...}  // row/col are 0-based), so models echo that style back. Stripping is
 * string-aware: a URL like "https://x.y" keeps its slashes.
 */
/**
 * Pass 1: remove // and slash-star comments that sit outside string literals.
 *
 * Separate from the repairs below on purpose. Done in one pass, the trailing-comma lookahead would
 * scan the *un-stripped* source: `, // note` + newline + `}` would not look like a trailing comma,
 * the comma would be kept, and stripping the comment afterwards would leave `,}` — invalid JSON
 * produced by the very function meant to fix it.
 */
function stripJSONComments(src: string): string {
    let out = "";
    let inString = false;
    let escaped = false;

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];

        if (inString) {
            out += ch;
            if (escaped) escaped = false;
            else if (ch === "\\") escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }

        if (ch === '"') { out += ch; inString = true; continue; }

        // Unreachable inside a string, so "https://x.y" keeps its slashes.
        if (ch === "/" && src[i + 1] === "/") {
            while (i < src.length && src[i] !== "\n") i++;
            out += "\n";
            continue;
        }
        if (ch === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            i = end === -1 ? src.length : end + 1;
            continue;
        }

        out += ch;
    }

    return out;
}

export function repairJSON(input: string): string {
    const src = stripJSONComments(input);

    let out = "";
    let inString = false;
    let escaped = false;
    let lastSig = ""; // last significant (non-whitespace) char seen outside a string

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];

        if (inString) {
            if (escaped) { out += ch; escaped = false; continue; }
            if (ch === "\\") { out += ch; escaped = true; continue; }
            if (ch === '"') { out += ch; inString = false; lastSig = '"'; continue; }
            // Literal control characters are invalid inside a JSON string — escape, don't drop.
            if (ch === "\n") { out += "\\n"; continue; }
            if (ch === "\r") { out += "\\r"; continue; }
            if (ch === "\t") { out += "\\t"; continue; }
            out += ch;
            continue;
        }

        if (ch === '"') { out += ch; inString = true; lastSig = '"'; continue; }

        // Drop a comma that is immediately followed by a closing brace/bracket.
        if (ch === ",") {
            let j = i + 1;
            while (j < src.length && /\s/.test(src[j])) j++;
            if (src[j] === "}" || src[j] === "]") continue;
            out += ch;
            lastSig = ",";
            continue;
        }

        // Quote an unquoted key. Only valid where a key may legally start: after { or ,
        if ((lastSig === "{" || lastSig === ",") && /[A-Za-z_$]/.test(ch)) {
            let j = i;
            while (j < src.length && /[\w$]/.test(src[j])) j++;
            let k = j;
            while (k < src.length && /\s/.test(src[k])) k++;
            if (src[k] === ":") {
                out += `"${src.slice(i, j)}"`;
                i = j - 1;
                lastSig = "k";
                continue;
            }
        }

        out += ch;
        if (!/\s/.test(ch)) lastSig = ch;
    }

    return out;
}

// ─── Main converter ────────────────────────────────────────────────────────

/**
 * Full pipeline: LLM text → SpreadSheetData | null
 */
export function parseLLMToSheetData(text: string): SpreadSheetData | null {
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

    const data = validateAndRepair(parsed);
    if (!data) return null;

    // Recompute formula cells rather than trusting the model's arithmetic. It is reliable on
    // simple sums but not always: a real marks sheet came back with every student total correct
    // and every subject average correct, yet AVERAGE over the totals column off by exactly 100.
    return evaluateFormulas(data);
}

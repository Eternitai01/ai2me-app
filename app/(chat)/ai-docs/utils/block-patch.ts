/**
 * Block-ID patching for AI Docs edits.
 *
 * Instead of regenerating the whole document on every edit, we tag each top-level
 * block with a stable `data-bid` before sending the current document to the model.
 * The model returns a small JSON op list referencing those ids; we apply just those
 * blocks locally. Targeting is reliable because the ids are ours, not the model's
 * guess at reproducing exact HTML.
 *
 * All functions run in the browser (DOMParser) — this module is client-only.
 */

export type BlockOpType =
  | "replace"
  | "insert_after"
  | "insert_before"
  | "delete"
  | "append";

export interface BlockOp {
  op: BlockOpType;
  /** Target block id. Null/absent only for "append". */
  bid: string | null;
  /** New block HTML. Absent for "delete". */
  html?: string;
}

const VALID_OPS: BlockOpType[] = [
  "replace",
  "insert_after",
  "insert_before",
  "delete",
  "append",
];

// data-bid values we generate are simple integers; guard the selector against anything else.
const SAFE_BID = /^[A-Za-z0-9_-]+$/;

function parseIntoRoot(html: string): { doc: Document; root: HTMLElement } {
  const doc = new DOMParser().parseFromString(
    `<div id="__aidocs_root__">${html}</div>`,
    "text/html"
  );
  const root = doc.getElementById("__aidocs_root__") as HTMLElement;
  return { doc, root };
}

/**
 * Tag each top-level block of `html` with a sequential `data-bid`, returning the
 * stamped HTML. This is sent to the model AND kept client-side as the patch source,
 * so ids map 1:1 to the blocks the model can reference.
 */
export function stampBlocks(html: string): string {
  if (!html || !html.trim()) return html || "";
  const { root } = parseIntoRoot(html);
  let i = 0;
  Array.from(root.children).forEach((el) => {
    el.setAttribute("data-bid", String(++i));
  });
  return root.innerHTML;
}

/**
 * Extract a block-op array from the model's response text. Tolerates code fences
 * and surrounding whitespace. Returns null if the text isn't a valid op list
 * (caller then falls back to treating the output as a full document).
 */
export function parseBlockOps(text: string): BlockOp[] | null {
  if (!text) return null;
  let t = text.trim();
  // Strip ```json … ``` fences if the model wrapped the array.
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const ops: BlockOp[] = [];
  for (const raw of parsed) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Record<string, unknown>;
    const op = candidate.op as BlockOpType;
    if (!VALID_OPS.includes(op)) continue;
    ops.push({
      op,
      bid: candidate.bid != null ? String(candidate.bid) : null,
      html: typeof candidate.html === "string" ? candidate.html : undefined,
    });
  }
  return ops.length ? ops : null;
}

/**
 * Apply block ops to the stamped source document and return clean HTML with the
 * `data-bid` scaffolding stripped. Ops referencing unknown ids are skipped rather
 * than throwing, so a partially-valid op list still produces a usable document.
 */
export function applyBlockOps(stampedHtml: string, ops: BlockOp[]): string {
  const { root } = parseIntoRoot(stampedHtml);

  const findBlock = (bid: string | null): Element | null => {
    if (!bid || !SAFE_BID.test(bid)) return null;
    return root.querySelector(`[data-bid="${bid}"]`);
  };

  for (const { op, bid, html } of ops) {
    if (op === "append") {
      if (html) root.insertAdjacentHTML("beforeend", html);
      continue;
    }

    const el = findBlock(bid);
    if (!el) continue; // unknown/removed block — skip this op

    switch (op) {
      case "replace":
        if (html) el.outerHTML = html;
        else el.remove();
        break;
      case "insert_after":
        if (html) el.insertAdjacentHTML("afterend", html);
        break;
      case "insert_before":
        if (html) el.insertAdjacentHTML("beforebegin", html);
        break;
      case "delete":
        el.remove();
        break;
    }
  }

  // Remove the scaffolding ids before the HTML goes back into the editor / storage.
  root.querySelectorAll("[data-bid]").forEach((n) => n.removeAttribute("data-bid"));
  return root.innerHTML;
}

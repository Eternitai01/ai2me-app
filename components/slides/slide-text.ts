/**
 * Text-only editing for slide HTML.
 *
 * Slides are full HTML documents (~8KB of minified markup), so "Advanced Edit" used to hand
 * the user the whole document to hunt through for a headline. These helpers expose just the
 * document's text nodes as editable fields and write edits straight back into those same
 * nodes — markup, CSS and layout are never regenerated, only text values change.
 *
 * Two properties worth preserving if you touch this:
 *  - The walk order in extract and apply MUST match. Both walk every text node under <body>
 *    and count every one, including the ones extract hides, so `index` stays a stable handle.
 *  - Writing via nodeValue means the serializer escapes &, < and > for us. A user cannot
 *    inject markup (or a <script>) through the text editor, however hard they try.
 */

/** Tags whose text is code or metadata, never slide prose. */
const NON_PROSE_TAGS = new Set(["script", "style", "noscript", "template", "title"]);

/** Maps a tag to a human label. "Heading" reads better than "H1" for a non-technical user. */
const TAG_LABELS: Record<string, string> = {
    h1: "Heading",
    h2: "Heading",
    h3: "Subheading",
    h4: "Subheading",
    h5: "Subheading",
    h6: "Subheading",
    p: "Paragraph",
    li: "List item",
    td: "Table cell",
    th: "Table heading",
    a: "Link text",
    button: "Button",
    span: "Text",
    small: "Small text",
    strong: "Bold text",
    b: "Bold text",
    em: "Italic text",
    i: "Italic text",
    div: "Text",
};

export interface TextField {
    /** Position in the text-node walk. The stable handle used to write the edit back. */
    index: number;
    value: string;
    original: string;
    label: string;
}

function labelFor(tag: string): string {
    return TAG_LABELS[tag] ?? tag.toUpperCase();
}

/** True if the string has at least one letter or digit — filters out punctuation-only nodes. */
function hasMeaningfulContent(s: string): boolean {
    return /[\p{L}\p{N}]/u.test(s);
}

/**
 * Pull the editable text runs out of a slide document, in reading order.
 *
 * Nodes that are whitespace-only, punctuation-only, or inside script/style are skipped from
 * the returned list but still consume an index, so `apply` can find the right node later.
 */
export function extractTextFields(html: string): TextField[] {
    // Guard for SSR: this component is client-only, but DOMParser would still throw if it
    // were ever rendered on the server.
    if (typeof window === "undefined" || typeof DOMParser === "undefined") return [];
    if (!html) return [];

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc.body) return [];

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const fields: TextField[] = [];
    let index = 0;
    let node = walker.nextNode();

    while (node) {
        const i = index++;
        const tag = node.parentElement?.tagName?.toLowerCase() ?? "";
        const raw = node.nodeValue ?? "";
        const trimmed = raw.trim();

        const editable =
            !NON_PROSE_TAGS.has(tag) && trimmed.length > 0 && hasMeaningfulContent(trimmed);

        if (editable) {
            fields.push({ index: i, value: trimmed, original: trimmed, label: labelFor(tag) });
        }
        node = walker.nextNode();
    }

    return fields;
}

/**
 * Write edited field values back into the original document and re-serialize.
 *
 * Leading/trailing whitespace of each text node is preserved so inline spacing (e.g. the gap
 * between a word and a following <em>) doesn't collapse when text is edited.
 */
export function applyTextFields(html: string, fields: TextField[]): string {
    if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
    if (!html) return html;

    const changed = new Map<number, TextField>();
    for (const f of fields) {
        if (f.value !== f.original) changed.set(f.index, f);
    }
    if (changed.size === 0) return html;

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc.body || !doc.documentElement) return html;

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let index = 0;
    let node = walker.nextNode();

    while (node) {
        const field = changed.get(index++);
        if (field) {
            const raw = node.nodeValue ?? "";
            const lead = /^\s*/.exec(raw)?.[0] ?? "";
            const trail = /\s*$/.exec(raw)?.[0] ?? "";
            node.nodeValue = lead + field.value + trail;
        }
        node = walker.nextNode();
    }

    // DOMParser drops the doctype from outerHTML; put it back only if it was there to begin
    // with, so a document without one doesn't silently gain a quirks-mode change.
    const hadDoctype = /^\s*<!DOCTYPE/i.test(html);
    const serialized = doc.documentElement.outerHTML;
    return hadDoctype ? `<!DOCTYPE html>\n${serialized}` : serialized;
}

/** Count of fields the user has actually modified. Drives the "unsaved changes" affordance. */
export function countChanged(fields: TextField[]): number {
    return fields.reduce((n, f) => n + (f.value !== f.original ? 1 : 0), 0);
}

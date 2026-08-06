/**
 * AI Docs generates raw HTML for the editor. Dumping that HTML into the chat bubble
 * is unreadable, so we extract a short human-readable summary instead.
 *
 * Headed documents summarize by their h1 title + h2/h3 sections. Documents without
 * headings (letters, emails, single-table docs) fall back to a content preview plus
 * block counts, so the bubble still says something useful instead of just
 * "Created a document."
 */

export interface DocumentSummary {
  title: string | null;
  /** h2 headings, or h3 headings when there are no h2s. */
  sectionTitles: string[];
  sectionCount: number;
  /** First paragraph (or leading text) snippet — used when there are no sections. */
  previewText: string | null;
  paragraphCount: number;
  tableCount: number;
}

const PREVIEW_MAX_CHARS = 160;

/** Strip all HTML tags, collapse whitespace. */
export function stripHtml(html: string): string {
  if (!html) return "";
  const withoutTags = html.replace(/<[^>]*>/g, " ");
  return withoutTags.replace(/\s+/g, " ").trim();
}

/** First h1 in the document, if any. */
export function extractTitle(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripHtml(match[1]).trim() || null : null;
}

/** Collect the text of every heading at the given level, in document order. */
function extractHeadings(html: string, level: 2 | 3): string[] {
  const out: string[] = [];
  const re = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text) out.push(text);
  }
  return out;
}

/** Count occurrences of an opening tag (e.g. "p", "table"). */
function countTag(html: string, tag: string): number {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "gi");
  return (html.match(re) || []).length;
}

/** First paragraph's text, or the document's leading text if there are no paragraphs. */
function extractPreviewText(html: string): string | null {
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const source = pMatch ? pMatch[1] : html;
  const text = stripHtml(source);
  if (!text) return null;
  if (text.length <= PREVIEW_MAX_CHARS) return text;
  // Trim to the last word boundary within the limit so we don't cut mid-word.
  const clipped = text.slice(0, PREVIEW_MAX_CHARS);
  const lastSpace = clipped.lastIndexOf(" ");
  return (lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trimEnd() + "…";
}

/** Walk the HTML for structure (h1 title, h2/h3 sections) and content stats. */
export function extractDocumentSummary(html: string): DocumentSummary {
  const title = extractTitle(html);

  // Prefer h2 as "sections"; fall back to h3 when the document only nests to h3.
  let sectionTitles = extractHeadings(html, 2);
  if (sectionTitles.length === 0) sectionTitles = extractHeadings(html, 3);

  return {
    title,
    sectionTitles,
    sectionCount: sectionTitles.length,
    previewText: extractPreviewText(html),
    paragraphCount: countTag(html, "p"),
    tableCount: countTag(html, "table"),
  };
}

const MAX_SUMMARY_BULLETS = 12;

/** Render a DocumentSummary as a prose + bullet-list message for the chat pane. */
export function formatSummaryForChat(summary: DocumentSummary): string {
  const { title, sectionCount, sectionTitles, previewText, paragraphCount, tableCount } = summary;

  // Headed document → title + section list.
  if (sectionCount > 0) {
    const sectionWord = sectionCount === 1 ? "section" : "sections";
    const heading = title
      ? `Created a document titled "${title}" with ${sectionCount} ${sectionWord}:`
      : `Created a document with ${sectionCount} ${sectionWord}:`;

    const shown = sectionTitles.slice(0, MAX_SUMMARY_BULLETS);
    const bullets = shown.map((t) => `- ${t}`);
    const remaining = sectionCount - shown.length;
    if (remaining > 0) bullets.push(`- …and ${remaining} more`);

    return `${heading}\n\n${bullets.join("\n")}`;
  }

  // Titled but no sections.
  if (title) {
    return `Created a document titled "${title}".`;
  }

  // No headings at all → describe by content: a preview plus block counts.
  const counts: string[] = [];
  if (paragraphCount > 0) counts.push(`${paragraphCount} paragraph${paragraphCount === 1 ? "" : "s"}`);
  if (tableCount > 0) counts.push(`${tableCount} table${tableCount === 1 ? "" : "s"}`);
  const meta = counts.length ? ` (${counts.join(", ")})` : "";

  if (previewText) {
    return `Created a document${meta}:\n\n"${previewText}"`;
  }
  if (meta) {
    return `Created a document${meta}.`;
  }

  return "Created a document.";
}

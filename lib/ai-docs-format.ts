export type DocsContentStructure =
  | "document"
  | "table"
  | "list"
  | "report"
  | "proposal";

export type DocsExportFormat = "web_doc" | "word" | "markdown";

export const DEFAULT_DOCS_CONTENT_STRUCTURE: DocsContentStructure = "document";
export const DEFAULT_DOCS_EXPORT_FORMAT: DocsExportFormat = "web_doc";

/** Phase 2: set true to show Content Structure tiles above Output Format. */
export const SHOW_DOCS_CONTENT_STRUCTURE = false;

export const DOCS_STRUCTURE_OPTIONS: {
  id: DocsContentStructure;
  title: string;
  subtitle: string;
}[] = [
  { id: "document", title: "Document", subtitle: "Prose + sections" },
  { id: "table", title: "Table", subtitle: "Rows & columns" },
  { id: "list", title: "List", subtitle: "Bullets / steps" },
  { id: "report", title: "Report", subtitle: "Findings + analysis" },
  { id: "proposal", title: "Proposal", subtitle: "Pitch / SOW style" },
];

/** Display order: Word → Web Doc → Markdown; default selection remains web_doc. */
export const DOCS_EXPORT_OPTIONS: {
  id: DocsExportFormat;
  title: string;
  subtitle: string;
}[] = [
  { id: "word", title: "Word", subtitle: "Export as .docx" },
  { id: "web_doc", title: "Web Doc", subtitle: "Rich HTML editor" },
  { id: "markdown", title: "Markdown", subtitle: "Export as .md" },
];

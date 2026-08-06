"use client";

import {
  FileText,
  Table,
  List,
  BarChart3,
  Briefcase,
  Globe,
  FileType,
  Hash,
  Check,
  type LucideIcon,
} from "lucide-react";
import {
  type DocsContentStructure,
  type DocsExportFormat,
  DOCS_STRUCTURE_OPTIONS,
  DOCS_EXPORT_OPTIONS,
  SHOW_DOCS_CONTENT_STRUCTURE,
} from "@/lib/ai-docs-format";

const STRUCTURE_ICONS: Record<DocsContentStructure, LucideIcon> = {
  document: FileText,
  table: Table,
  list: List,
  report: BarChart3,
  proposal: Briefcase,
};

const EXPORT_ICONS: Record<DocsExportFormat, LucideIcon> = {
  web_doc: Globe,
  word: FileType,
  markdown: Hash,
};

interface OutputFormatSelectorProps {
  structure?: DocsContentStructure;
  exportFormat: DocsExportFormat;
  onStructureChange?: (structure: DocsContentStructure) => void;
  onExportChange: (format: DocsExportFormat) => void;
  disabled?: boolean;
}

interface FormatTileProps<T extends string> {
  id: T;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: T) => void;
}

function FormatTile<T extends string>({
  id,
  title,
  subtitle,
  icon: Icon,
  selected,
  disabled = false,
  onSelect,
}: FormatTileProps<T>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${title}: ${subtitle}`}
      disabled={disabled}
      onClick={() => onSelect(id)}
      className={`
        relative shrink-0 flex flex-col items-start gap-1 p-3 rounded-xl border min-w-[120px]
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)]
        focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chat-bg-primary)]
        disabled:cursor-not-allowed
        ${
          selected
            ? "border-[var(--chat-accent)] bg-[var(--chat-accent)]/10"
            : "border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] hover:border-[var(--chat-accent)]/50"
        }
      `}
    >
      {selected && (
        <Check className="absolute top-2 right-2 w-4 h-4 text-[var(--chat-accent)]" />
      )}
      <Icon
        className={`w-5 h-5 ${selected ? "text-[var(--chat-accent)]" : "text-[var(--chat-text-muted)]"}`}
      />
      <span className="text-sm font-medium text-[var(--chat-text-primary)]">
        {title}
      </span>
      <span className="text-xs text-[var(--chat-text-muted)]">{subtitle}</span>
    </button>
  );
}

export function OutputFormatSelector({
  structure,
  exportFormat,
  onStructureChange,
  onExportChange,
  disabled = false,
}: OutputFormatSelectorProps) {
  const showStructure =
    SHOW_DOCS_CONTENT_STRUCTURE &&
    structure != null &&
    typeof onStructureChange === "function";

  return (
    <div
      className={`mb-3 min-w-0 ${showStructure ? "space-y-4" : ""} ${disabled ? "opacity-50" : ""}`}
    >
      {showStructure && (
        <div className="space-y-2 min-w-0">
          <span
            id="docs-content-structure-label"
            className="text-xs font-semibold tracking-wider text-[var(--chat-text-muted)]"
          >
            CONTENT STRUCTURE
          </span>
          <div
            role="group"
            aria-labelledby="docs-content-structure-label"
            className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-1 px-1 touch-pan-x overscroll-x-contain"
          >
            {DOCS_STRUCTURE_OPTIONS.map((option) => (
              <FormatTile
                key={option.id}
                id={option.id}
                title={option.title}
                subtitle={option.subtitle}
                icon={STRUCTURE_ICONS[option.id]}
                selected={structure === option.id}
                disabled={disabled}
                onSelect={onStructureChange}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 min-w-0">
        <span
          id="docs-output-format-label"
          className="text-xs font-semibold tracking-wider text-[var(--chat-text-muted)]"
        >
          OUTPUT FORMAT
        </span>
        <div
          role="group"
          aria-labelledby="docs-output-format-label"
          className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-1 px-1 touch-pan-x overscroll-x-contain"
        >
          {DOCS_EXPORT_OPTIONS.map((option) => (
            <FormatTile
              key={option.id}
              id={option.id}
              title={option.title}
              subtitle={option.subtitle}
              icon={EXPORT_ICONS[option.id]}
              selected={exportFormat === option.id}
              disabled={disabled}
              onSelect={onExportChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

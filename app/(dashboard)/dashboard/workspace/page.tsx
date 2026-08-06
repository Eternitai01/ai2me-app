"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Search,
  FileText,
  LayoutTemplate,
  Table2,
  Globe,
  CheckSquare,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Copy,
  Check,
  FileDown,
  Paperclip,
  ExternalLink,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type ItemType = "all" | "document" | "slides" | "sheet" | "website" | "task" | "file";

interface WorkspaceItem {
  id: string;
  item_type: string;
  title: string;
  created_at: string | null;
  icon: string;
  label: string;
}

interface WorkspaceItemDetail extends WorkspaceItem {
  payload: Record<string, unknown>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS: { id: ItemType; label: string; icon: React.ReactNode }[] = [
  { id: "all",      label: "All",       icon: <FolderOpen   className="h-4 w-4" /> },
  { id: "document", label: "Documents", icon: <FileText      className="h-4 w-4" /> },
  { id: "slides",   label: "Slides",    icon: <LayoutTemplate className="h-4 w-4" /> },
  { id: "sheet",    label: "Sheets",    icon: <Table2        className="h-4 w-4" /> },
  { id: "website",  label: "Websites",  icon: <Globe         className="h-4 w-4" /> },
  { id: "task",     label: "Tasks",     icon: <CheckSquare   className="h-4 w-4" /> },
  { id: "file",     label: "Files",     icon: <Paperclip     className="h-4 w-4" /> },
];

const TYPE_COLORS: Record<string, string> = {
  document:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
  slides:     "bg-purple-500/15 text-purple-400 border-purple-500/20",
  sheet:      "bg-green-500/15 text-green-400 border-green-500/20",
  website:    "bg-orange-500/15 text-orange-400 border-orange-500/20",
  task:       "bg-teal-500/15 text-teal-400 border-teal-500/20",
  file_pdf:   "bg-red-500/15 text-red-400 border-red-500/20",
  file_excel: "bg-green-600/15 text-green-500 border-green-600/20",
  file_ppt:   "bg-orange-600/15 text-orange-400 border-orange-600/20",
  file_word:  "bg-blue-600/15 text-blue-400 border-blue-600/20",
  file_image: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  file:       "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

const PAGE_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    document: <FileText      className="h-5 w-5" />,
    slides:   <LayoutTemplate className="h-5 w-5" />,
    sheet:    <Table2        className="h-5 w-5" />,
    website:  <Globe         className="h-5 w-5" />,
    task:     <CheckSquare   className="h-5 w-5" />,
  };
  return <span>{icons[type] ?? <FolderOpen className="h-5 w-5" />}</span>;
}

// ─── Item Viewer ─────────────────────────────────────────────────────────────

function DocumentViewer({ payload }: { payload: Record<string, unknown> }) {
  const content = String(payload.content ?? "");
  const tags = (payload.tags as string[]) ?? [];
  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
        </div>
      )}
      <div className="rounded-lg bg-muted/40 border border-border/50 p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
        {content || <span className="italic text-muted-foreground">No content</span>}
      </div>
    </div>
  );
}

function SlidesViewer({ payload }: { payload: Record<string, unknown> }) {
  const slides = (payload.slides as Array<Record<string, string>>) ?? [];
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  return (
    <div className="space-y-3">
      {/* Slide display */}
      <div className="rounded-lg bg-muted/40 border border-border/50 p-6 min-h-[200px] flex flex-col justify-center space-y-3">
        {slide ? (
          <>
            {slide.title && <h3 className="text-xl font-bold text-center">{slide.title}</h3>}
            {slide.content && <p className="text-sm text-muted-foreground text-center leading-relaxed whitespace-pre-wrap">{slide.content}</p>}
            {slide.notes && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground italic">{slide.notes}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center italic text-sm">No slides</p>
        )}
      </div>
      {/* Navigation */}
      {slides.length > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">{current + 1} / {slides.length}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))} disabled={current === slides.length - 1}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

function SheetViewer({ payload }: { payload: Record<string, unknown> }) {
  const headers = (payload.headers as string[]) ?? [];
  const rows = (payload.rows as unknown[][]) ?? [];
  return (
    <div className="overflow-auto max-h-[60vh] rounded-lg border border-border/50">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 sticky top-0">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b border-border/50 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-3 py-4 text-center text-muted-foreground italic text-sm">No data rows</td></tr>
          ) : (
            rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-sm">{String(cell ?? "")}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function WebsiteViewer({ payload, itemId }: { payload: Record<string, unknown>; itemId: string }) {
  const sections = (payload.sections as Array<Record<string, string>>) ?? [];
  const publishedUrl = payload.published_url as string | undefined;
  const [exporting, setExporting] = useState(false);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportGithub = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/v1/connectors/github/export-website", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, make_public: true }),
      });
      if (res.status === 400) {
        // Not connected — redirect to connect
        const authRes = await fetch("/api/connectors/github/auth"); if (authRes.ok) { const { auth_url } = await authRes.json(); window.location.href = auth_url; }
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Export failed");
      }
      const data = await res.json();
      setGithubUrl(data.github_url);
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {publishedUrl && (
        <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
          <Globe className="h-4 w-4 text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-green-400 font-medium mb-0.5">Live site</p>
            <p className="text-xs text-muted-foreground truncate">{publishedUrl}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={publishedUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-semibold rounded-md transition-colors">
              <ExternalLink className="h-3 w-3" />
              Open Site
            </a>
            <button
              onClick={handleExportGithub}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
            >
              <Github className="h-3 w-3" />
              {exporting ? "Exporting…" : "Export to GitHub"}
            </button>
          </div>
        </div>
      )}
      {githubUrl && (
        <div className="flex items-center gap-3 rounded-lg bg-purple-500/10 border border-purple-500/20 px-4 py-3">
          <Github className="h-4 w-4 text-purple-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-purple-400 font-medium mb-0.5">Exported to GitHub</p>
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-purple-300 truncate block">{githubUrl}</a>
          </div>
        </div>
      )}
      {exportError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
          {exportError}
        </div>
      )}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {sections.length === 0 ? (
          <p className="italic text-muted-foreground text-sm">No sections</p>
        ) : (
          sections.map((s, i) => (
            <div key={i} className="rounded-lg bg-muted/40 border border-border/50 p-4">
              {s.heading && <h4 className="font-semibold mb-1">{s.heading}</h4>}
              {s.content && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{s.content}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TaskViewer({ payload }: { payload: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      {payload.description && (
        <div className="rounded-lg bg-muted/40 border border-border/50 p-4 text-sm whitespace-pre-wrap leading-relaxed">
          {String(payload.description)}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {payload.due_date && (
          <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Due date</p>
            <p className="text-sm font-medium">{String(payload.due_date)}</p>
          </div>
        )}
        {payload.priority && (
          <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Priority</p>
            <p className="text-sm font-medium capitalize">{String(payload.priority)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FileViewer({ item, payload }: { item: WorkspaceItemDetail; payload: Record<string, unknown> }) {
  const [dlLoading, setDlLoading] = useState(false);

  const downloadFile = async () => {
    setDlLoading(true);
    try {
      const res = await fetch(`/api/v1/workspace/${item.id}/download-url`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get download URL");
      const data = await res.json();
      const a = document.createElement("a");
      a.href = data.download_url;
      a.download = data.original_name || "file";
      a.target = "_blank";
      a.click();
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDlLoading(false);
    }
  };

  const sizeKb = payload.size_bytes ? Math.round(Number(payload.size_bytes) / 1024) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/40 border border-border/50 p-5 flex flex-col items-center gap-3 text-center">
        <Paperclip className="h-10 w-10 text-muted-foreground/60" />
        <div>
          <p className="font-medium text-sm">{String(payload.original_name || item.title)}</p>
          {sizeKb && <p className="text-xs text-muted-foreground mt-0.5">{sizeKb} KB · {String(payload.mime_type || "")}</p>}
          {payload.source && payload.source !== "agent" && (
            <p className="text-xs text-muted-foreground mt-0.5">via {String(payload.source)}</p>
          )}
        </div>
        <Button onClick={downloadFile} disabled={dlLoading} className="mt-1">
          <Download className={cn("h-4 w-4 mr-2", dlLoading && "animate-pulse")} />
          {dlLoading ? "Getting link…" : "Download File"}
        </Button>
      </div>
    </div>
  );
}

function ItemViewer({ item }: { item: WorkspaceItemDetail }) {
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const copyContent = () => {
    const text = JSON.stringify(item.payload, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(item.payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/v1/workspace/${item.id}/pdf`, { credentials: "include" });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={cn("text-xs font-medium", TYPE_COLORS[item.item_type])}>
          {item.label}
        </Badge>
        {item.created_at && (
          <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={copyContent}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPdf} disabled={pdfLoading}>
            <FileDown className={cn("h-3.5 w-3.5 mr-1", pdfLoading && "animate-pulse")} />
            {pdfLoading ? "Generating…" : "Download PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export JSON
          </Button>
        </div>
      </div>

      {/* Content */}
      {item.item_type === "document" && <DocumentViewer payload={item.payload} />}
      {item.item_type === "slides"   && <SlidesViewer   payload={item.payload} />}
      {item.item_type === "sheet"    && <SheetViewer    payload={item.payload} />}
      {item.item_type === "website"  && <WebsiteViewer  payload={item.payload} itemId={item.id} />}
      {item.item_type === "task"     && <TaskViewer     payload={item.payload} />}
      {["file","file_pdf","file_excel","file_ppt","file_word","file_image"].includes(item.item_type) && <FileViewer item={item} payload={item.payload} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<ItemType>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WorkspaceItemDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch]);

  // Fetch items
  const fetchItems = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("item_type", activeTab);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));

    try {
      const res = await fetch(`/api/v1/workspace?${params}`, {
        credentials: "include",
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Open item detail
  const openItem = async (item: WorkspaceItem) => {
    setDetailLoading(true);
    setSelectedItem({ ...item, payload: {} });
    try {
      const res = await fetch(`/api/v1/workspace/${item.id}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelectedItem(data);
    } catch {
      setSelectedItem(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 md:pl-[10px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="h-7 w-7" />
            Workspace
          </h1>
          <p className="text-muted-foreground mt-1">
            Everything your agents created — documents, slides, sheets, websites, tasks, and files.
          </p>
        </div>
        <Button variant="outlineBlack" onClick={fetchItems} disabled={loading} className="self-start sm:self-auto">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Card>
        {/* Tabs */}
        <div className="border-b border-border/50 px-4 pt-4">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-foreground bg-muted/30"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border/30 bg-muted/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {/* Loading skeletons */}
          {loading && (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-8 text-center text-sm text-destructive">{error}</div>
          )}

          {/* Empty */}
          {!loading && !error && items.length === 0 && (
            <div className="p-12 text-center">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No items yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Ask your agent to create a document, slides, sheet, or website — it'll appear here automatically.
              </p>
            </div>
          )}

          {/* Items grid */}
          {!loading && !error && items.length > 0 && (
            <div className="divide-y divide-border/40">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-accent/40 transition-colors group"
                >
                  {/* Icon */}
                  <span className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border flex-shrink-0",
                    TYPE_COLORS[item.item_type] ?? "bg-muted/40 text-muted-foreground border-border/50"
                  )}>
                    <TypeIcon type={item.item_type} />
                  </span>

                  {/* Title + type */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                  </div>

                  {/* Date */}
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {relativeTime(item.created_at)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                {total} item{total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item detail dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              {selectedItem && <TypeIcon type={selectedItem.item_type} />}
              <span className="truncate">{selectedItem?.title ?? "Loading…"}</span>
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedItem ? (
            <ItemViewer item={selectedItem} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

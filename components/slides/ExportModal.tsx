"use client";

import { useState } from "react";
import {
  X,
  FileText,
  Loader2,
  CheckCircle2,
  Download,
  ExternalLink,
  FolderOpen,
  FileImage,
} from "lucide-react";
import {
  saveToWorkspace,
  exportToPdf,
  exportToPptx,
  getWorkspaceDownloadUrl,
  formatBytes,
  type WorkspaceSaveResult,
  type Slide,
} from "./slide-export-utils";
import { toast } from "sonner";

interface ExportModalProps {
  slides: Slide[];
  sessionId: string;
  sessionTitle?: string;
  onClose: () => void;
}

type Format = "pdf" | "pptx" | "google";

const FORMAT_OPTIONS: {
  id: Format;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "pdf",
    label: "PDF",
    desc: "Universal · print-ready",
    icon: <FileText className="w-5 h-5" />,
    color: "border-red-500/40 bg-red-500/5",
  },
  {
    id: "pptx",
    label: "PPTX",
    desc: "Editable in PowerPoint",
    icon: <FileImage className="w-5 h-5" />,
    color: "border-orange-500/40 bg-orange-500/5",
  },
  {
    id: "google",
    label: "Google Slides",
    desc: "Import .pptx into Slides",
    icon: <ExternalLink className="w-5 h-5" />,
    color: "border-yellow-500/40 bg-yellow-500/5",
  },
];

type RangeMode = "all" | "custom";
type Phase = "select" | "saving" | "done";

export function ExportModal({
  slides,
  sessionId,
  sessionTitle = "presentation",
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = useState<Format>("pdf");
  const [rangeMode, setRangeMode] = useState<RangeMode>("all");
  const [customFrom, setCustomFrom] = useState(1);
  const [customTo, setCustomTo] = useState(slides.length);
  const [phase, setPhase] = useState<Phase>("select");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [saved, setSaved] = useState<WorkspaceSaveResult | null>(null);

  const totalSlides = slides.length;

  const subset =
    rangeMode === "custom"
      ? slides.filter(
          (s) => s.slide_number >= customFrom && s.slide_number <= customTo,
        )
      : slides;

  const handleExport = async () => {
    if (phase !== "select") return;
    setPhase("saving");
    setProgress(0);
    setProgressLabel("Starting…");

    const pageRange: [number, number] | undefined =
      rangeMode === "custom" ? [customFrom, customTo] : undefined;

    if (subset.length === 0) {
      toast.error("No slides in the selected range.");
      setPhase("select");
      return;
    }

    const fname = sessionTitle.replace(/[^a-z0-9\-_]/gi, "-").toLowerCase() || "presentation";

    // Google Slides = download PPTX locally (no workspace save) + open Slides
    if (format === "google") {
      try {
        setProgressLabel("Rendering slides…");
        setProgress(20);
        await exportToPptx(
          subset,
          sessionId,
          `${fname}.pptx`,
          pageRange,
          (done, total) => setProgress(20 + Math.round((done / total) * 70)),
        );
        setProgress(100);
        setTimeout(() => window.open("https://docs.google.com/presentation/u/0/", "_blank"), 1200);
        toast.success("PPTX downloaded. In Google Slides: File → Import slides.");
        setTimeout(onClose, 1500);
      } catch (err: any) {
        toast.error(err?.message ?? "Export failed.");
        setPhase("select");
      }
      return;
    }

    // PDF / PPTX → save to AI Drive (workspace)
    try {
      setProgressLabel("Rendering with Chromium…");
      setProgress(10);

      // Simulate progress during server-side render (we don't get per-slide events)
      const ticker = setInterval(() => {
        setProgress((p) => {
          if (p >= 80) { clearInterval(ticker); return p; }
          return p + Math.random() * 8;
        });
      }, 800);

      const result = await saveToWorkspace(sessionId, format === "pdf" ? "pdf" : "pptx");
      clearInterval(ticker);
      setProgress(100);
      setProgressLabel("Saved!");
      setSaved(result);
      setPhase("done");
    } catch (err: any) {
      // If save-to-workspace failed (503 = export service not up), fall back to direct download
      toast.error(err?.message ?? "Export failed. Please try again.");
      setPhase("select");
    }
  };

  const handleDownload = async () => {
    if (!saved) return;
    try {
      const url = await getWorkspaceDownloadUrl(saved.workspace_item_id);
      const a = document.createElement("a");
      a.href = url;
      a.download = saved.filename;
      a.click();
    } catch {
      toast.error("Could not generate download link.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={phase === "select" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 bg-[#18181b] border border-[#2a2a2e] rounded-2xl shadow-[0_40px_120px_rgba(0,0,0,0.9)] w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2a2a2e]">
          <div>
            <h3 className="text-base font-bold text-white">
              {phase === "done" ? "Export Successful" : "Export Presentation"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {phase === "done"
                ? "File has been saved to your AI Drive"
                : `${totalSlides} slides total`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2a2a2e] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── DONE STATE ──────────────────────────────────────────────────── */}
        {phase === "done" && saved ? (
          <div className="px-6 py-6 space-y-5">
            {/* Success icon */}
            <div className="flex justify-center">
              <CheckCircle2 className="w-14 h-14 text-green-400" strokeWidth={1.5} />
            </div>

            {/* File card */}
            <div className="flex items-center gap-4 p-4 bg-[#121215] border border-[#2a2a2e] rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-[#1e1e22] border border-[#2a2a2e] flex items-center justify-center shrink-0 text-xl">
                {saved.item_type === "file_pdf" ? "📕" : "📙"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{saved.filename}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatBytes(saved.size_bytes)}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  window.location.href = "/dashboard/workspace";
                }}
                className="h-10 flex items-center justify-center gap-2 bg-[#121215] border border-[#2a2a2e] hover:bg-[#1e1e22] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                View in AI Drive
              </button>
              <button
                onClick={handleDownload}
                className="h-10 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        ) : (
          /* ── SELECT / SAVING STATE ────────────────────────────────────── */
          <>
            <div className="px-6 py-6 space-y-6">
              {/* Format picker */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => phase === "select" && setFormat(opt.id)}
                      className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all ${
                        format === opt.id
                          ? `${opt.color} border-opacity-100 ring-1 ring-white/10`
                          : "border-[#2a2a2e] bg-[#121215] hover:bg-[#1e1e22]"
                      } ${phase !== "select" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className="text-white">{opt.icon}</span>
                      <span className="text-sm font-bold text-white">{opt.label}</span>
                      <span className="text-[10px] text-gray-500 text-center leading-relaxed">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Page range */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                  Page Range
                </label>
                <div className="space-y-2">
                  {(["all", "custom"] as RangeMode[]).map((mode) => (
                    <label key={mode} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          rangeMode === mode
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-600 group-hover:border-gray-400"
                        }`}
                      >
                        {rangeMode === mode && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <input
                        type="radio"
                        className="sr-only"
                        checked={rangeMode === mode}
                        onChange={() => phase === "select" && setRangeMode(mode)}
                      />
                      <span className="text-sm text-gray-200">
                        {mode === "all" ? `All Pages (1–${totalSlides})` : "Custom Range"}
                      </span>
                    </label>
                  ))}

                  {rangeMode === "custom" && (
                    <div className="flex items-center gap-2 pl-7 mt-2">
                      <input
                        type="number"
                        min={1}
                        max={totalSlides}
                        value={customFrom}
                        onChange={(e) =>
                          setCustomFrom(Math.max(1, Math.min(Number(e.target.value), customTo)))
                        }
                        className="w-16 px-2 py-1.5 text-sm bg-[#121215] border border-[#2a2a2e] rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-gray-500 text-sm">to</span>
                      <input
                        type="number"
                        min={customFrom}
                        max={totalSlides}
                        value={customTo}
                        onChange={(e) =>
                          setCustomTo(
                            Math.max(customFrom, Math.min(Number(e.target.value), totalSlides)),
                          )
                        }
                        className="w-16 px-2 py-1.5 text-sm bg-[#121215] border border-[#2a2a2e] rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-gray-500">
                        ({Math.max(0, customTo - customFrom + 1)} slides)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              {/* Progress */}
              <div
                className={`mb-4 p-3.5 rounded-xl bg-[#121215] border border-[#2a2a2e] transition-opacity duration-150 ${
                  phase === "saving" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-300 font-medium">
                    {progressLabel || "Rendering…"}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-[#2a2a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={phase !== "select"}
                className="w-full h-10 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
              >
                {phase === "saving" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {format === "google" ? "Preparing…" : "Saving to AI Drive…"}
                  </>
                ) : (
                  <>
                    {format === "google" ? (
                      <ExternalLink className="w-4 h-4" />
                    ) : (
                      <FolderOpen className="w-4 h-4" />
                    )}
                    {format === "google" ? "Export to Google Slides" : "Save to AI Drive"}
                  </>
                )}
              </button>

              {format !== "google" && phase === "select" && (
                <p className="text-center text-[10px] text-gray-500 mt-2">
                  Renders server-side · saves to your Workspace · pixel-perfect
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

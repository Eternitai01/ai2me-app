"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { Code2, MessageSquare, ImageIcon, Video, FolderOpen, ArrowRight, Plus, Clock } from "lucide-react";
import { ChatSession, ProjectSummary } from "@/app/api/chatHistory";

// ─── SVG icons ────────────────────────────────────────────────────────────────

const SheetIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);
const AIDocsIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const AISlidesIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AgentMeta = { icon: any; label: string; color: string; bg: string };

function getAgentMeta(agentId?: string | null): AgentMeta {
  switch (agentId) {
    case "ai-builder":  return { icon: Code2,        label: "Builder", color: "#06b6d4", bg: "rgba(6,182,212,0.12)" };
    case "web-builder": return { icon: Code2,        label: "Web",     color: "#06b6d4", bg: "rgba(6,182,212,0.12)" };
    case "ai-sheets":   return { icon: SheetIcon,    label: "Sheets",  color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
    case "ai-docs":     return { icon: AIDocsIcon,   label: "Docs",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
    case "ai-slides":   return { icon: AISlidesIcon, label: "Slides",  color: "#f97316", bg: "rgba(249,115,22,0.12)" };
    case "ai-image":    return { icon: ImageIcon,    label: "Image",   color: "#f472b6", bg: "rgba(244,114,182,0.12)" };
    case "ai-video":    return { icon: Video,        label: "Video",   color: "#38bdf8", bg: "rgba(56,189,248,0.12)" };
    default:            return { icon: MessageSquare,label: "Chat",    color: "#6366f1", bg: "rgba(99,102,241,0.12)" };
  }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/`([^`]+)`/g, '$1')        // code
    .replace(/#+\s*/g, '')              // headers
    .trim();
}

function formatTime(d: string): string {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1)   return "Just now";
  if (diff < 60)  return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  if (diff < 10080) return `${Math.floor(diff/1440)}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "mine" | "recent" | "shared";

// ─── Project card ─────────────────────────────────────────────────────────────

function VisualPreview({ session, meta }: { session: ChatSession; meta: AgentMeta }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [previewType, setPreviewType] = useState<string>("none");
  const [previewContent, setPreviewContent] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session.session_id || !session.agent_id) return;
    if (["ai-image", "ai-video", "ai-chat", "chat"].includes(session.agent_id)) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setStatus("loading");
      fetch(`/api/preview/${session.session_id}?agentId=${session.agent_id}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.type && d.type !== "none" && (d.content || d.url)) {
            setPreviewType(d.type);
            setPreviewContent(d.content || d.url || "");
            setStatus("done");
          } else {
            setStatus("error");
          }
        })
        .catch(() => setStatus("error"));
    }, { threshold: 0.1 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [session.session_id, session.agent_id]);

  // ── Web Builder / Slides / Docs: scaled HTML iframe ───────────────────
  if (status === "done" && previewType === "html" && previewContent) {
    return (
      <div ref={containerRef} style={{ position: "relative", height: "100px", borderRadius: "8px", overflow: "hidden", background: "#111" }}>
        <iframe
          srcDoc={previewContent}
          title="preview"
          style={{
            position: "absolute", top: 0, left: 0,
            width: "400%", height: "400%",
            transform: "scale(0.25)", transformOrigin: "top left",
            border: "none", pointerEvents: "none",
          }}
          sandbox="allow-scripts allow-same-origin"
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.5) 100%)" }} />
      </div>
    );
  }

  // ── Sheets: mini table grid ─────────────────────────────────────────
  if (status === "done" && previewType === "sheet" && previewContent) {
    let sheetData: any = null;
    try { sheetData = JSON.parse(previewContent); } catch { }
    if (sheetData?.columns && sheetData?.rows) {
      const cols: any[] = sheetData.columns.slice(0, 5);
      const rows: any[][] = sheetData.rows.slice(0, 7);
      return (
        <div ref={containerRef} style={{ height: "100px", borderRadius: "8px", overflow: "hidden", background: "#0d1f0f" }}>
          <div style={{ transform: "scale(0.55)", transformOrigin: "top left", width: "182%", height: "182%", padding: "2px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", color: "#fff" }}>
              <thead>
                <tr style={{ background: "rgba(34,197,94,0.3)" }}>
                  {cols.map((c: any, i: number) => (
                    <th key={i} style={{ padding: "3px 5px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid rgba(34,197,94,0.2)", whiteSpace: "nowrap", maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || String(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any[], ri: number) => (
                  <tr key={ri} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {cols.map((_: any, ci: number) => (
                      <td key={ci} style={{ padding: "2px 5px", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap", maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis" }}>{String(row[ci] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────
  const isLoadingPreview = status === "loading";

  // ── Fallback gradient ──────────────────────────────────────────────────
  const gradients: Record<string, string> = {
    "ai-builder": "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))",
    "ai-slides":  "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))",
    "ai-sheets":  "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))",
    "ai-docs":    "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))",
    "ai-image":   "linear-gradient(135deg, rgba(244,114,182,0.15), rgba(244,114,182,0.05))",
    "ai-video":   "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.05))",
  };
  const bg = gradients[session.agent_id ?? ""] ?? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))";
  const Icon = meta.icon;
  return (
    <div ref={containerRef} style={{
      height: "100px", borderRadius: "8px", overflow: "hidden",
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {isLoadingPreview
        ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: meta.color, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        : <Icon style={{ width: 28, height: 28, color: meta.color, opacity: 0.4 }} />
      }
    </div>
  );
}

function ProjectCard({ session, onClick }: { session: ChatSession; onClick: () => void }) {
  const meta = getAgentMeta(session.agent_id);
  const Icon = meta.icon;
  return (
    <div
      onClick={onClick}
      className="group flex flex-col gap-2 p-3 rounded-2xl border border-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
    >
      {/* Visual preview */}
      <VisualPreview session={session} meta={meta} />

      {/* Agent badge + time */}
      <div className="flex items-center justify-between mt-1">
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: meta.bg, color: meta.color }}
        >
          <Icon className="w-3 h-3" />
          {meta.label}
        </div>
        <span className="text-[11px] text-white/40">{formatTime(session.updated_at)}</span>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-white/80 truncate group-hover:text-white transition-colors leading-tight">
        {stripMarkdown(session.title)}
      </p>
    </div>
  );
}

// ─── New project card ─────────────────────────────────────────────────────────

function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-white/15 hover:border-white/30 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 min-h-[120px]"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
        <Plus className="w-4 h-4 text-white/60" />
      </div>
      <span className="text-xs text-white/40 font-medium">New project</span>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-white/15 text-white shadow-sm"
          : "text-white/50 hover:text-white/80 hover:bg-white/8"
      }`}
      style={{ background: active ? undefined : "none", border: "none", cursor: "pointer" }}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  sessions: ChatSession[];
  projects: ProjectSummary[];
  isLoading: boolean;
  onSelectSession: (id: string, agentId?: string | null) => void;
  onSelectProject: (id: string) => void;
  onNewChat: () => void;
  router: any;
}

export function ProjectsSection({ sessions, projects, isLoading, onSelectSession, onSelectProject, onNewChat, router }: Props) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("recent");

  // Build "My projects" = Web Builder projects
  const myProjects = projects.slice(0, 8);

  // Build "Recently viewed" = all sessions sorted by updated_at
  const recentSessions = sessions.slice(0, 8);

  // Build "My projects" items with preview_url
  const mineItems: ChatSession[] = myProjects.map(p => ({
    session_id: p.session_id,
    title: p.title || p.project_id,
    preview: "",
    preview_url: p.preview_url ?? null,
    updated_at: p.updated_at,
    created_at: p.updated_at,
    agent_id: p.agent_id || "ai-builder",
    message_count: 0,
  }));

  const displayItems = activeTab === "mine" ? mineItems : activeTab === "recent" ? recentSessions : [];
  const isEmpty = displayItems.length === 0;

  return (
    <div className="w-full max-w-[900px] mt-4 mb-12 px-2 sm:px-0">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
          <TabButton label={t("landing.my_projects", "My projects")}     active={activeTab === "mine"}   onClick={() => setActiveTab("mine")} />
          <TabButton label={t("landing.recently_viewed", "Recently viewed")} active={activeTab === "recent"} onClick={() => setActiveTab("recent")} />
          <TabButton label={t("landing.shared_with_me", "Shared with me")}  active={activeTab === "shared"} onClick={() => setActiveTab("shared")} />
        </div>

        {/* Browse all */}
        <button
          onClick={() => router.push("/account")}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          Browse all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        /* Skeleton */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      ) : activeTab === "shared" ? (
        /* Shared — coming soon */
        <div
          className="flex flex-col items-center justify-center py-12 rounded-2xl border border-white/10"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <p className="text-sm font-medium text-white/50">Collaboration coming soon</p>
          <p className="text-xs text-white/30 mt-1">You'll be able to share and collaborate on projects here</p>
        </div>
      ) : isEmpty ? (
        /* Empty state */
        <div
          className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-white/10 cursor-pointer hover:border-white/20 transition-all"
          style={{ background: "rgba(255,255,255,0.02)" }}
          onClick={onNewChat}
        >
          <div className="w-10 h-10 rounded-2xl bg-white/8 flex items-center justify-center mb-3">
            <Plus className="w-5 h-5 text-white/50" />
          </div>
          <p className="text-sm font-medium text-white/50">
            {activeTab === "mine" ? "No projects yet" : "No recent chats"}
          </p>
          <p className="text-xs text-white/30 mt-1">Start a conversation to get going</p>
        </div>
      ) : (
        /* Cards grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayItems.map(session => (
            <ProjectCard
              key={session.session_id}
              session={session}
              onClick={() => {
                if (activeTab === "mine") {
                  onSelectProject(session.session_id);
                } else {
                  onSelectSession(session.session_id, session.agent_id);
                }
              }}
            />
          ))}
          <NewProjectCard onClick={onNewChat} />
        </div>
      )}
    </div>
  );
}

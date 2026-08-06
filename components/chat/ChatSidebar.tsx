"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Plug,
  FolderOpen,
  Star,
  UserCircle,
  Users,
  Plus,
  X,
  Trash2,
  Pencil,
  MoreHorizontal,
  Code2,
  AlertTriangle,
  MessageSquare,
  ImageIcon,
  Rocket,
  ChevronDown,
  PanelLeftClose,
  Zap,
  ArrowRight,
  Clock,
} from "lucide-react";
import { ChatSession, ProjectSummary } from "@/app/api/chatHistory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  projects: ProjectSummary[];
  showProjects?: boolean;
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string, agentId?: string | null) => void;
  onSelectProject: (sessionId: string) => void;
  onNewChat: () => void;
  onBoardroomClick?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  isLoading?: boolean;
  className?: string;
  user?: { full_name?: string; email?: string } | null;
}

type FilterMode = "all" | "starred" | "mine" | "shared";

const STARRED_KEY = "ai2me_starred_sessions";

// ─── SVG icons ────────────────────────────────────────────────────────────────

const SheetIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const AIChatIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-4-7.5" /><path d="M8 20l-4 2 1-4" />
    <path d="M8 15l2-6 2 6" /><line x1="9" y1="13" x2="11" y2="13" /><line x1="14" y1="9" x2="14" y2="15" />
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

function getAgentIcon(agentId?: string | null) {
  switch (agentId) {
    case "ai-builder":  return Code2;
    case "ai-sheets":   return SheetIcon;
    case "ai-docs":     return AIDocsIcon;
    case "ai-slides":   return AISlidesIcon;
    case "ai-image":    return ImageIcon;
    case "ai-chat":
    case "chat":        return AIChatIcon;
    default:            return MessageSquare;
  }
}

function getAgentLabel(agentId?: string | null): string {
  switch (agentId) {
    case "ai-builder":  return "Builder";
    case "ai-sheets":   return "Sheets";
    case "ai-docs":     return "Docs";
    case "ai-slides":   return "Slides";
    case "ai-image":    return "Image";
    case "ai-chat":
    case "chat":        return "Chat";
    default:            return "Chat";
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now  = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  const diffH   = Math.floor(diffMin / 60);
  const diffD   = Math.floor(diffH / 24);
  if (diffMin < 1)  return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24)   return `${diffH}h ago`;
  if (diffD < 7)    return `${diffD}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function loadStarred(): Set<string> {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveStarred(ids: Set<string>) {
  try { localStorage.setItem(STARRED_KEY, JSON.stringify([...ids])); } catch {}
}

// ─── Command Palette ──────────────────────────────────────────────────────────

function CommandPalette({ sessions, onSelect, onClose }: {
  sessions: ChatSession[];
  onSelect: (s: ChatSession) => void;
  onClose: () => void;
}) {
  const [query, setQuery]       = useState("");
  const [cursor, setCursor]     = useState(0);
  const inputRef                = useRef<HTMLInputElement>(null);
  const listRef                 = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? sessions.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        (s.preview ?? "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12)
    : sessions.slice(0, 12);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  useEffect(() => { setCursor(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown")  { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter")      { e.preventDefault(); if (filtered[cursor]) onSelect(filtered[cursor]); }
    if (e.key === "Escape")     { onClose(); }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`) as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-full max-w-xl mx-4 rounded-2xl shadow-2xl overflow-hidden border border-[var(--chat-border)]"
        style={{ background: "var(--chat-bg-secondary)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--chat-border)]">
          <Search className="w-4 h-4 text-[var(--chat-text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search chats, projects..."
            className="flex-1 bg-transparent text-[var(--chat-text-primary)] placeholder:text-[var(--chat-text-muted)] text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="text-[10px] text-[var(--chat-text-muted)] bg-[var(--chat-bg-tertiary)] px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-[var(--chat-text-muted)]">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No results for "{query}"</p>
            </div>
          ) : (
            filtered.map((s, idx) => {
              const Icon = getAgentIcon(s.agent_id);
              const isActive = idx === cursor;
              return (
                <div
                  key={s.session_id}
                  data-idx={idx}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isActive ? "bg-[var(--chat-accent)]/10" : "hover:bg-[var(--chat-sidebar-hover)]"}`}
                  onClick={() => onSelect(s)}
                  onMouseEnter={() => setCursor(idx)}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? "bg-[var(--chat-accent)]/20" : "bg-[var(--chat-bg-tertiary)]"}`}>
                    <Icon className="w-3.5 h-3.5 text-[var(--chat-text-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--chat-text-primary)] truncate">{s.title}</p>
                    {s.preview && <p className="text-xs text-[var(--chat-text-muted)] truncate">{s.preview}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[var(--chat-text-muted)]">{getAgentLabel(s.agent_id)}</span>
                    <span className="text-[10px] text-[var(--chat-text-muted)]">{formatTime(s.updated_at)}</span>
                    {isActive && <ArrowRight className="w-3 h-3 text-[var(--chat-accent)]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--chat-border)]">
          {[["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="text-[10px] text-[var(--chat-text-muted)] bg-[var(--chat-bg-tertiary)] px-1.5 py-0.5 rounded font-mono">{key}</kbd>
              <span className="text-[10px] text-[var(--chat-text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, shortcut, onClick, active = false, count }: {
  icon: any; label: string; shortcut?: string; onClick: () => void; active?: boolean; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        active
          ? "bg-[var(--chat-sidebar-active)] text-[var(--chat-text-primary)] font-medium"
          : "text-[var(--chat-text-secondary)] hover:bg-[var(--chat-sidebar-hover)] hover:text-[var(--chat-text-primary)]"
      }`}
      style={{ background: "none", border: "none", cursor: "pointer" }}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-70" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <kbd className="text-[10px] text-[var(--chat-text-muted)] bg-[var(--chat-bg-tertiary)] px-1.5 py-0.5 rounded font-mono">{shortcut}</kbd>}
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-medium text-[var(--chat-text-muted)] bg-[var(--chat-bg-tertiary)] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{count}</span>
      )}
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--chat-text-muted)]">{label}</p>;
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function ChatSidebar({
  isOpen, onClose, sessions, projects, showProjects = true,
  selectedSessionId, onSelectSession, onSelectProject,
  onNewChat, onBoardroomClick, onDeleteSession, onRenameSession,
  isLoading = false, className = "", user,
}: ChatSidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [filterMode, setFilterMode]         = useState<FilterMode>("all");
  const [starredIds, setStarredIds]         = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen]       = useState(false);
  const [hoveredId, setHoveredId]           = useState<string | null>(null);
  const [tooltipId, setTooltipId]           = useState<string | null>(null);
  const tooltipTimerRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockSelectRef                      = useRef(false); // blocks selectSession briefly after delete confirm
  const [activeMenuId, setActiveMenuId]     = useState<string | null>(null);
  const [renamingId, setRenamingId]         = useState<string | null>(null);
  const [renameDraft, setRenameDraft]       = useState("");

  const userName = user?.full_name || user?.email?.split("@")[0] || "My AgentOS Studio";
  const headerLabel = "My AgentOS Studio";

  // Load starred from localStorage on mount
  useEffect(() => { setStarredIds(loadStarred()); }, []);

  // ⌘K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Star toggle ────────────────────────────────────────────────────────────
  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveStarred(next);
      return next;
    });
  };

  // ── Rename helpers ─────────────────────────────────────────────────────────
  const startRename  = (id: string, title: string) => { setActiveMenuId(null); setRenamingId(id); setRenameDraft(title); };
  const cancelRename = () => { setRenamingId(null); setRenameDraft(""); };
  const submitRename = async () => {
    if (!renamingId || !onRenameSession) { cancelRename(); return; }
    const t = renameDraft.trim();
    if (t) await onRenameSession(renamingId, t);
    cancelRename();
  };

  // ── Navigate ───────────────────────────────────────────────────────────────
  const go = (path: string) => { router.push(path); if (window.innerWidth < 1024) onClose(); };
  const selectSession = (id: string, agentId?: string | null) => {
    if (agentId === "website") { router.push(`/web/${id}`); if (window.innerWidth < 1024) onClose(); return; }
    onSelectSession(id, agentId);
    if (window.innerWidth < 1024) onClose();
  };
  const selectProject = (id: string) => { onSelectProject(id); if (window.innerWidth < 1024) onClose(); };

  // ── Filtered sessions by mode ──────────────────────────────────────────────
  const visibleSessions = (() => {
    switch (filterMode) {
      case "starred": return sessions.filter(s => starredIds.has(s.session_id));
      case "mine":    return sessions; // all sessions belong to current user
      case "shared":  return [];       // not implemented yet
      default:        return sessions;
    }
  })();

  // ── Command palette select ─────────────────────────────────────────────────
  const onPaletteSelect = (s: ChatSession) => {
    setPaletteOpen(false);
    selectSession(s.session_id, s.agent_id);
  };

  // ── Section label for recents header ──────────────────────────────────────
  const recentsLabel = (() => {
    switch (filterMode) {
      case "starred": return `Starred (${starredIds.size})`;
      case "mine":    return "Created by me";
      case "shared":  return "Shared with me";
      default:        return "Recents";
    }
  })();

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop overlay — visible on all screen sizes when sidebar is open */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}

      {/* Command Palette */}
      {paletteOpen && (
        <CommandPalette
          sessions={sessions}
          onSelect={onPaletteSelect}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      <aside className={`
        chat-sidebar-container no-auth-intercept
        fixed top-0 bottom-16 lg:bottom-0 left-0 z-[135]
        w-[240px] lg:w-[280px]
        bg-[var(--chat-sidebar-bg)]
        border-r border-[var(--chat-border)]
        flex flex-col
        transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${className}
      `}>

        {/* ── Header: workspace + close ── */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--chat-border)] lg:pl-[86px]">
          <button
            onClick={() => go("/landing")}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--chat-sidebar-hover)] transition-colors flex-1 min-w-0"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--chat-accent)] to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-[var(--chat-text-primary)] truncate">My AgentOS Studio</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--chat-text-muted)] shrink-0" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-sidebar-hover)] transition-colors ml-1">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-1 lg:pl-[82px]">

          {/* Nav section */}
          <div className="space-y-0.5 mt-1">
            <NavItem icon={LayoutDashboard} label="Home"       onClick={() => { setFilterMode("all"); go("/landing"); }}            active={pathname === "/landing"} />
            <NavItem icon={Search}          label="Search"          shortcut="⌘K" onClick={() => setPaletteOpen(true)} />
            <NavItem icon={Plug}            label="Connectors"      onClick={() => { setFilterMode("all"); go("/connectors"); }} active={pathname?.includes("connectors")} />
            <NavItem icon={Rocket}          label="Agent Launchpad" onClick={() => window.open("https://agentos247.com", "_blank")} />
          </div>

          {/* Projects section */}
          <SectionHeader label="Projects" />
          <div className="space-y-0.5">
            <NavItem
              icon={FolderOpen} label="All Projects"
              active={filterMode === "all"}
              onClick={() => { setFilterMode("all"); go("/landing"); }}
            />
            <NavItem
              icon={Star} label="Starred"
              active={filterMode === "starred"}
              count={starredIds.size}
              onClick={() => setFilterMode("starred")}
            />
            <NavItem
              icon={UserCircle} label="Created by me"
              active={filterMode === "mine"}
              onClick={() => setFilterMode("mine")}
            />
            <NavItem
              icon={Users} label="Shared with me"
              active={filterMode === "shared"}
              onClick={() => setFilterMode("shared")}
            />
          </div>

          {/* Recents section */}
          <div className="flex items-center justify-between pr-1">
            <SectionHeader label={recentsLabel} />
            {filterMode === "all" && (
              <button onClick={onNewChat} className="mt-3 p-1 rounded-md text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-sidebar-hover)] transition-colors" title="New chat">
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sessions list */}
          {isLoading ? (
            <div className="space-y-1 px-1">{[...Array(5)].map((_, i) => <div key={i} className="h-7 rounded-md bg-[var(--chat-bg-tertiary)] chat-shimmer" />)}</div>
          ) : filterMode === "shared" ? (
            /* Shared with me — not built yet */
            <div className="px-3 py-6 flex flex-col items-center text-center gap-2">
              <Users className="w-8 h-8 text-[var(--chat-text-muted)] opacity-30" />
              <p className="text-xs text-[var(--chat-text-secondary)] font-medium">Sharing coming soon</p>
              <p className="text-[11px] text-[var(--chat-text-muted)]">Collaborate with teammates on shared projects</p>
            </div>
          ) : visibleSessions.length === 0 ? (
            <div className="px-3 py-6 flex flex-col items-center text-center gap-2">
              {filterMode === "starred"
                ? <><Star className="w-8 h-8 text-[var(--chat-text-muted)] opacity-30" /><p className="text-xs text-[var(--chat-text-secondary)] font-medium">No starred chats</p><p className="text-[11px] text-[var(--chat-text-muted)]">Click ☆ on any chat to star it</p></>
                : <><MessageSquare className="w-8 h-8 text-[var(--chat-text-muted)] opacity-30" /><p className="text-xs text-[var(--chat-text-secondary)] font-medium">No chats yet</p></>
              }
            </div>
          ) : (
            <div className="space-y-0.5 pb-2">
              {visibleSessions.slice(0, 30).map(session => {
                const Icon      = getAgentIcon(session.agent_id);
                const isActive  = selectedSessionId === session.session_id;
                const isHovered = hoveredId === session.session_id;
                const menuOpen  = activeMenuId === session.session_id;
                const renaming  = renamingId === session.session_id;
                const starred   = starredIds.has(session.session_id);

                return (
                  <div
                    key={session.session_id}
                    className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? "bg-[var(--chat-sidebar-active)] text-[var(--chat-text-primary)]"
                        : "hover:bg-[var(--chat-sidebar-hover)] text-[var(--chat-text-secondary)]"
                    }`}
                    onClick={() => { if (deleteConfirmId || blockSelectRef.current) return; selectSession(session.session_id, session.agent_id); }}
                    onMouseEnter={() => {
                      setHoveredId(session.session_id);
                      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
                      tooltipTimerRef.current = setTimeout(() => setTooltipId(session.session_id), 1000);
                    }}
                    onMouseLeave={() => {
                      setHoveredId(null);
                      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
                      setTooltipId(null);
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    {renaming ? (
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={e => setRenameDraft(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => {
                          if (e.key === "Enter")  { e.preventDefault(); submitRename(); }
                          if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
                        }}
                        onBlur={cancelRename}
                        className="flex-1 min-w-0 bg-transparent border-b border-[var(--chat-accent)] text-xs text-[var(--chat-text-primary)] outline-none"
                      />
                    ) : (
                      <span className={`flex-1 min-w-0 text-xs truncate ${isActive ? "text-[var(--chat-text-primary)] font-medium" : ""}`}>
                        {session.title}
                        {tooltipId === session.session_id && (
                          <span className="absolute left-8 top-full mt-1 z-50 max-w-xs px-2 py-1 text-xs text-white bg-gray-900 border border-gray-700 rounded-lg shadow-lg whitespace-normal break-words pointer-events-none">
                            {session.title}
                          </span>
                        )}
                      </span>
                    )}

                    {/* Star indicator (always show if starred) */}
                    {starred && !isHovered && !renaming && (
                      <Star className="w-3 h-3 shrink-0 text-yellow-400 fill-yellow-400 opacity-80" />
                    )}

                    {/* Hover actions — hover-gated on desktop, always visible on mobile */}
                    {!renaming && (
                      <div className={`flex items-center gap-0.5 shrink-0 lg:transition-opacity ${(isHovered || isActive || menuOpen) ? "lg:opacity-100" : "lg:opacity-0 lg:pointer-events-none"}`} onClick={e => e.stopPropagation()}>
                        {/* Star toggle */}
                        <button
                          onClick={e => toggleStar(session.session_id, e)}
                          className={`p-1 rounded transition-all ${starred ? "text-yellow-400" : "text-[var(--chat-text-muted)] hover:text-yellow-400"}`}
                          title={starred ? "Unstar" : "Star"}
                        >
                          <Star className={`w-3 h-3 ${starred ? "fill-yellow-400" : ""}`} />
                        </button>
                        {/* Delete */}
                        {onDeleteSession && (
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteConfirmId(session.session_id); }}
                            className="p-1 rounded text-[var(--chat-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {/* Rename */}
                        {onRenameSession && (
                          <div className="relative">
                            <button
                              onClick={e => { e.stopPropagation(); setActiveMenuId(menuOpen ? null : session.session_id); }}
                              className={`p-1 rounded transition-all ${menuOpen ? "bg-[var(--chat-bg-hover)] text-[var(--chat-text-primary)]" : "text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)]"}`}
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                            {menuOpen && (
                              <>
                                <div className="fixed inset-0 z-[70]" onClick={e => { e.stopPropagation(); setActiveMenuId(null); }} />
                                <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] rounded-xl shadow-xl z-[80] overflow-hidden py-1">
                                  <button
                                    onClick={e => { e.stopPropagation(); startRename(session.session_id, session.title); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)] transition-colors"
                                  >
                                    <Pencil className="w-3 h-3" /> Rename
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Projects list (Web Builder projects) */}
          {showProjects && filterMode === "all" && projects.length > 0 && (
            <>
              <SectionHeader label="Builder Projects" />
              <div className="space-y-0.5 pb-2">
                {projects.map(project => {
                  const isActive = selectedSessionId === project.session_id;
                  return (
                    <div
                      key={project.project_id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                        isActive
                          ? "bg-[var(--chat-sidebar-active)] text-[var(--chat-text-primary)]"
                          : "hover:bg-[var(--chat-sidebar-hover)] text-[var(--chat-text-secondary)]"
                      }`}
                      onClick={() => selectProject(project.session_id)}
                    >
                      <Code2 className="w-3.5 h-3.5 shrink-0 opacity-50" />
                      <span className="flex-1 min-w-0 text-xs truncate">{project.title || project.project_id}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

        {/* ── Bottom: upgrade CTA ── */}
        <div className="p-3 border-t border-[var(--chat-border)] lg:pl-[83px]">
          <button
            onClick={() => go("/dashboard/subscription")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--chat-sidebar-hover)] transition-all group"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[var(--chat-accent)] to-purple-600 shrink-0">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-[var(--chat-text-primary)]">Upgrade plan</p>
              <p className="text-[10px] text-[var(--chat-text-muted)] truncate">Unlock more features</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--chat-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

      </aside>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirmId(null); }} />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-500/10 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--chat-text-primary)]">Delete project?</p>
                  <p className="text-xs text-[var(--chat-text-muted)] mt-1">This action cannot be undone. The project and all its files will be permanently deleted.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--chat-border)] text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const idToDelete = deleteConfirmId;
                    setDeleteConfirmId(null);
                    // Defer until modal is fully unmounted so no click falls through to sidebar items
                    setTimeout(() => { if (onDeleteSession) onDeleteSession(idToDelete); }, 0);
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

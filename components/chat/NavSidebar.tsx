"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Home,
  Code2,
  LayoutGrid,
  MessageSquare,
  ImageIcon,
  Video,
  Search,
  Plug,
  Rocket,
  PanelLeft,
  Zap,
} from "lucide-react";
import { UserMenu } from "./UserMenu";

// ─── SVG icons ────────────────────────────────────────────────────────────────

const AIChatIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-4-7.5" /><path d="M8 20l-4 2 1-4" />
    <path d="M8 15l2-6 2 6" /><line x1="9" y1="13" x2="11" y2="13" /><line x1="14" y1="9" x2="14" y2="15" />
  </svg>
);

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

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-full ml-3 z-[200] whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] shadow-xl pointer-events-none">
          <span className="text-xs font-medium text-[var(--chat-text-primary)]">{label}</span>
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--chat-border)]" />
        </div>
      )}
    </div>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────

function NavIcon({ icon: Icon, label, onClick, active = false, highlight }: {
  icon: any;
  label: string;
  onClick: () => void;
  active?: boolean;
  highlight?: string;
}) {
  return (
    <Tip label={label}>
      <button
        onClick={onClick}
        className={`
          relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer
          ${active
            ? "bg-[var(--chat-primary-sidebar-item-active)] text-[var(--chat-accent)]"
            : "text-[var(--chat-primary-sidebar-text-muted)] hover:bg-[var(--chat-primary-sidebar-item-hover)] hover:text-[var(--chat-text-primary)]"
          }
        `}
        style={{ background: active ? undefined : "none", border: "none" }}
      >
        <Icon className="w-5 h-5" />
      </button>
    </Tip>
  );
}

function Divider() {
  return <div className="w-8 h-px bg-[var(--chat-primary-sidebar-border)] opacity-50 my-1" />;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Agent {
  name: string;
  icon: any;
  color: string;
  iconColor?: string;
  badge?: string;
  dot?: boolean;
  description?: string[];
}

export interface AgentSection {
  group: string;
  items: Agent[];
}

export const QUICK_AGENTS: Agent[] = [
  { name: "Web Builder", icon: Code2,      color: "rgba(14,116,144,0.15)",  iconColor: "#06b6d4", description: ["Expert coding assistant for all major languages", "Help with debugging, refactoring, and logic"] },
  { name: "App Builder", icon: Code2,      color: "rgba(99,102,241,0.15)",   iconColor: "#6366f1", description: ["Build and deploy full-stack AI-powered apps", "Live preview, code editor, one-click deploy"] },
  { name: "AI Chat",    icon: AIChatIcon,  color: "rgba(55,48,163,0.15)",   iconColor: "#6366f1", description: ["Free chat with top-tier AI models", "Auto-mixes best models for your task"] },
  { name: "AI Sheets",  icon: SheetIcon,   color: "rgba(34,197,94,0.15)",   iconColor: "#22c55e", description: ["Powerful AI spreadsheet with formulas and charts"] },
  { name: "AI Docs",    icon: AIDocsIcon,  color: "rgba(59,130,246,0.15)",  iconColor: "#3b82f6", description: ["Instant professional document generation"] },
  { name: "AI Slides",  icon: AISlidesIcon,color: "rgba(249,115,22,0.15)",  iconColor: "#f97316", description: ["Create professional presentations in seconds"] },
  { name: "AI Image",   icon: ImageIcon,   color: "rgba(244,114,182,0.15)", iconColor: "#f472b6", description: ["Generate stunning visual artwork from text"] },
  { name: "AI Video",   icon: Video,       color: "rgba(56,189,248,0.15)",  iconColor: "#38bdf8", description: ["Transform scripts or prompts into dynamic video"] },
];

export const MENU_AGENTS: AgentSection[] = [
  { group: "Agent Customization", items: [{ name: "Custom", icon: LayoutGrid, color: "#94a3b8" }] },
  { group: "Agents", items: [
    { name: "Web Builder", icon: Code2,       color: "#06b6d4" },
    { name: "App Builder", icon: Code2,       color: "#6366f1" },
    { name: "AI Chat",    icon: AIChatIcon,  color: "#6366f1" },
    { name: "AI Sheets",  icon: SheetIcon,   color: "#22c55e" },
    { name: "AI Docs",    icon: AIDocsIcon,  color: "#3b82f6" },
    { name: "AI Slides",  icon: AISlidesIcon,color: "#f97316" },
    { name: "AI Image",   icon: ImageIcon,   color: "#818cf8" },
    { name: "AI Video",   icon: Video,       color: "#38bdf8" },
  ]},
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface NavSidebarProps {
  user: any;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  handleSignOut: () => void;
  router: any;
  handleNewChat: () => void;
  handleAgentAction: (agentName: string) => void;
  menuAgents?: AgentSection[];
  onOpenSidebar?: () => void;
  onOpenSearch?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavSidebar({
  user,
  userMenuOpen,
  setUserMenuOpen,
  handleSignOut,
  router,
  handleNewChat,
  handleAgentAction,
  menuAgents,
  onOpenSidebar,
  onOpenSearch,
}: NavSidebarProps) {
  const pathname = usePathname();
  const [agentsMenuOpen, setAgentsMenuOpen] = useState(false);
  const activeAgents = (Array.isArray(menuAgents) && menuAgents.length > 0) ? menuAgents : MENU_AGENTS;

  const openSidebar   = () => onOpenSidebar?.();
  const openSearch    = () => { onOpenSearch?.(); openSidebar(); };
  const go            = (path: string) => router.push(path);

  return (
    <aside className="
      fixed bottom-0 left-0 right-0 h-16
      lg:h-auto lg:bottom-0 lg:top-0 lg:right-auto lg:w-20
      bg-[var(--chat-primary-sidebar-bg)]
      flex flex-row lg:flex-col
      items-center
      justify-between lg:justify-start
      lg:py-4
      px-4 lg:px-0
      border-t lg:border-t-0 lg:border-r border-[var(--chat-primary-sidebar-border)]
      z-[140]
      transition-colors duration-200
    ">

      {/* ── Desktop: full icon rail ── */}
      <div className="hidden lg:flex flex-col items-center w-full h-full gap-0.5 px-2">

        {/* Open sidebar toggle */}
        <div className="mb-3 mt-1 w-full flex justify-center">
          <Tip label="Open menu">
            <button
              onClick={openSidebar}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--chat-primary-sidebar-text-muted)] hover:bg-[var(--chat-primary-sidebar-item-hover)] hover:text-[var(--chat-text-primary)] transition-all"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          </Tip>
        </div>

        {/* New chat */}
        <div className="relative w-full flex justify-center">
          <Tip label="New chat">
            <button
              onClick={() => setAgentsMenuOpen(!agentsMenuOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                agentsMenuOpen
                  ? "bg-[var(--chat-primary-sidebar-item-active)] text-[var(--chat-accent)]"
                  : "text-[var(--chat-primary-sidebar-text-muted)] hover:bg-[var(--chat-primary-sidebar-item-hover)] hover:text-[var(--chat-text-primary)]"
              }`}
              style={{ background: agentsMenuOpen ? undefined : "none", border: "none", cursor: "pointer" }}
            >
              <Plus className="w-5 h-5" />
            </button>
          </Tip>

          {agentsMenuOpen && (
            <>
              <div className="fixed inset-0 z-[65]" onClick={() => setAgentsMenuOpen(false)} />
              <div className="absolute top-0 left-14 w-[380px] max-h-[85vh] overflow-y-auto bg-[var(--chat-bg-tertiary)] border border-[var(--chat-border)] rounded-2xl shadow-2xl p-5 z-[70] scrollbar-hide">
                {activeAgents.map((section, sIdx) => (
                  <div key={sIdx} className={sIdx > 0 ? "mt-6" : ""}>
                    <h3 className="text-[var(--chat-text-primary)] font-bold text-sm mb-4 px-1">{section.group}</h3>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-6">
                      {section.items.map((agent, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => { setAgentsMenuOpen(false); handleAgentAction(agent.name); }}
                          className="flex flex-col items-center gap-2 group/item cursor-pointer"
                          style={{ background: "none", border: "none" }}
                        >
                          <agent.icon className="w-7 h-7" style={{ color: agent.color }} />
                          <span className="text-[11px] text-[var(--chat-text-muted)] group-hover/item:text-[var(--chat-text-primary)] transition-colors text-center font-medium">{agent.name}</span>
                          {agent.badge && (
                            <div className="bg-yellow-400 px-1.5 py-0.5 rounded-full -mt-1">
                              <span className="text-[8px] font-black text-black uppercase">{agent.badge}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <Divider />

        {/* Nav group */}
        <NavIcon icon={Home}           label="Home"      onClick={() => go("/landing")}                   active={pathname === "/landing"} />
        <NavIcon icon={Search}         label="Search  ⌘K"      onClick={openSearch} />
        <NavIcon icon={Plug}           label="Connectors"      onClick={() => go("/connectors")}      active={pathname?.includes("connectors")} />
        <NavIcon icon={Rocket}         label="Agent Launchpad" onClick={() => window.open("https://agentos247.com", "_blank")} />


        {/* Spacer */}
        <div className="flex-1" />

        {/* Upgrade */}
        <Tip label="Upgrade plan">
          <button
            onClick={() => go("/dashboard/subscription")}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--chat-primary-sidebar-text-muted)] hover:bg-[var(--chat-primary-sidebar-item-hover)] hover:text-[var(--chat-accent)] transition-all mb-1"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Zap className="w-5 h-5" />
          </button>
        </Tip>

        {/* User menu */}
        <div className="mb-2">
          <UserMenu
            user={user}
            isOpen={userMenuOpen}
            setIsOpen={setUserMenuOpen}
            handleSignOut={handleSignOut}
            router={router}
            dropdownPosition="bottom-0 left-full ml-3"
          />
        </div>
      </div>

      {/* ── Mobile: bottom tab bar (keep simple) ── */}
      <div className="flex lg:hidden flex-row items-center justify-around w-full">
        {/* New */}
        <div className="relative">
          <button
            onClick={() => setAgentsMenuOpen(!agentsMenuOpen)}
            className={`flex flex-col items-center gap-1 group cursor-pointer`}
            style={{ background: "none", border: "none" }}
          >
            <div className={`p-2 rounded-xl transition-colors ${agentsMenuOpen ? "bg-[var(--chat-primary-sidebar-item-active)]" : "group-hover:bg-[var(--chat-primary-sidebar-item-hover)]"}`}>
              <Plus className={`w-5 h-5 ${agentsMenuOpen ? "text-[var(--chat-accent)]" : "text-[var(--chat-primary-sidebar-text-muted)]"}`} />
            </div>
            <span className="text-[9px] text-[var(--chat-primary-sidebar-text-muted)] font-medium">New</span>
          </button>
          {agentsMenuOpen && (
            <>
              <div className="fixed inset-0 z-[65]" onClick={() => setAgentsMenuOpen(false)} />
              <div className="fixed bottom-20 left-4 right-4 max-h-[65vh] overflow-y-auto bg-[var(--chat-bg-tertiary)] border border-[var(--chat-border)] rounded-2xl shadow-2xl p-5 z-[70] scrollbar-hide">
                {activeAgents.map((section, sIdx) => (
                  <div key={sIdx} className={sIdx > 0 ? "mt-6" : ""}>
                    <h3 className="text-[var(--chat-text-primary)] font-bold text-sm mb-4">{section.group}</h3>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-5">
                      {section.items.map((agent, aIdx) => (
                        <button key={aIdx} onClick={() => { setAgentsMenuOpen(false); handleAgentAction(agent.name); }}
                          className="flex flex-col items-center gap-1.5" style={{ background: "none", border: "none", cursor: "pointer" }}>
                          <agent.icon className="w-6 h-6" style={{ color: agent.color }} />
                          <span className="text-[10px] text-[var(--chat-text-muted)] text-center">{agent.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Home */}
        <button onClick={() => go("/landing")} className="flex flex-col items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div className={`p-2 rounded-xl ${pathname === "/landing" ? "bg-[var(--chat-primary-sidebar-item-active)]" : ""}`}>
            <Home className={`w-5 h-5 ${pathname === "/landing" ? "text-[var(--chat-accent)]" : "text-[var(--chat-primary-sidebar-text-muted)]"}`} />
          </div>
          <span className="text-[9px] text-[var(--chat-primary-sidebar-text-muted)] font-medium">Home</span>
        </button>

        {/* Search */}
        <button onClick={openSearch} className="flex flex-col items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div className="p-2 rounded-xl hover:bg-[var(--chat-primary-sidebar-item-hover)]">
            <Search className="w-5 h-5 text-[var(--chat-primary-sidebar-text-muted)]" />
          </div>
          <span className="text-[9px] text-[var(--chat-primary-sidebar-text-muted)] font-medium">Search</span>
        </button>

        {/* Open sidebar */}
        <button onClick={openSidebar} className="flex flex-col items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <div className="p-2 rounded-xl hover:bg-[var(--chat-primary-sidebar-item-hover)]">
            <PanelLeft className="w-5 h-5 text-[var(--chat-primary-sidebar-text-muted)]" />
          </div>
          <span className="text-[9px] text-[var(--chat-primary-sidebar-text-muted)] font-medium">Menu</span>
        </button>

        {/* User */}
        <UserMenu
          user={user}
          isOpen={userMenuOpen}
          setIsOpen={setUserMenuOpen}
          handleSignOut={handleSignOut}
          router={router}
          dropdownPosition="bottom-20 right-0"
        />
      </div>
    </aside>
  );
}

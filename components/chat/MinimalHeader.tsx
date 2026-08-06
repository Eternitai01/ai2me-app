"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, Settings, FolderOpen, Copy, Check, Pencil, SquarePen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface MinimalHeaderProps {
    sidebarOpen: boolean;
    onOpenSidebar: () => void;
    hideSidebarToggle?: boolean;
    projectTitle?: string;
    projectSubtitle?: string;
    sessionId?: string;
    onRenameProject?: (newTitle: string) => void;
    /** When set, shows a New Chat control that opens a fresh workspace (caller decides: new tab vs same tab). */
    onNewChatInNewTab?: () => void;
}

export function MinimalHeader({ sidebarOpen, onOpenSidebar, hideSidebarToggle, projectTitle, projectSubtitle, sessionId, onRenameProject, onNewChatInNewTab }: MinimalHeaderProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [renameDraft, setRenameDraft] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!sessionId) return;
        navigator.clipboard.writeText(sessionId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    const startRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        setRenameDraft(projectTitle || "");
        setRenaming(true);
        setTimeout(() => renameInputRef.current?.select(), 50);
    };

    const submitRename = () => {
        const trimmed = renameDraft.trim();
        if (trimmed && trimmed !== projectTitle && onRenameProject) {
            onRenameProject(trimmed);
        }
        setRenaming(false);
    };

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    return (
        <header className="flex-shrink-0 flex items-center justify-between px-3 py-0 border-b border-[var(--chat-border)] bg-[var(--chat-bg-primary)] h-11 relative z-20">
            {/* Left: sidebar toggle + small icon + project name */}
            <div className="flex items-center gap-2 min-w-0">
                {!hideSidebarToggle && (
                    <button
                        onClick={sidebarOpen ? () => {} : onOpenSidebar}
                        className="p-1 rounded-lg hover:bg-[var(--chat-bg-hover)] transition-colors duration-200 flex-shrink-0"
                        title="Menu"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/ai2me-logo-icon.png" alt="ai2me" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />
                    </button>
                )}
{/* agentos-logo hidden */}
                {projectTitle && (
                    <div className="flex items-center gap-1 min-w-0" ref={menuRef}>
                        <span className="text-[var(--chat-border)] text-sm flex-shrink-0">/</span>

                        {/* Inline rename input */}
                        {renaming ? (
                            <input
                                ref={renameInputRef}
                                value={renameDraft}
                                onChange={e => setRenameDraft(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") { e.preventDefault(); submitRename(); }
                                    if (e.key === "Escape") { e.preventDefault(); setRenaming(false); }
                                }}
                                onBlur={submitRename}
                                className="text-xs font-medium bg-[var(--chat-bg-hover)] border border-[var(--chat-accent)] rounded px-2 py-0.5 text-[var(--chat-text-primary)] outline-none max-w-[200px]"
                            />
                        ) : (
                            <button
                                onClick={() => setMenuOpen(v => !v)}
                                className="flex items-center gap-1 min-w-0 px-1.5 py-1 rounded-md hover:bg-[var(--chat-bg-hover)] transition-colors"
                            >
                                <div className="min-w-0 text-left">
                                    <p className="text-xs font-medium text-[var(--chat-text-primary)] truncate max-w-[200px] leading-tight">{projectTitle}</p>
                                    {projectSubtitle && (
                                        <p className="text-[10px] text-[var(--chat-text-muted)] leading-tight">{projectSubtitle}</p>
                                    )}
                                </div>
                                <ChevronDown className={`w-3 h-3 text-[var(--chat-text-muted)] flex-shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                            </button>
                        )}

                        {/* Copy ID button */}
                        {sessionId && !renaming && (
                            <button
                                onClick={handleCopyId}
                                title={`Copy project ID: ${sessionId}`}
                                className="p-1 rounded hover:bg-[var(--chat-bg-hover)] text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] transition-all flex-shrink-0"
                            >
                                {copied
                                    ? <Check className="w-3 h-3 text-green-500" />
                                    : <Copy className="w-3 h-3" />}
                            </button>
                        )}

                        {/* Rename button */}
                        {onRenameProject && !renaming && (
                            <button
                                onClick={startRename}
                                title="Rename project"
                                className="p-1 rounded hover:bg-[var(--chat-bg-hover)] text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] transition-all flex-shrink-0"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                        )}

                        {/* Dropdown menu */}
                        {menuOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] rounded-xl shadow-xl py-1 text-sm">
                                <button onClick={startRename}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--chat-bg-hover)] text-[var(--chat-text-primary)] transition-colors">
                                    <Pencil className="w-4 h-4 text-[var(--chat-text-muted)]" />
                                    Rename project
                                </button>
                                <button onClick={() => { router.push("/landing"); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--chat-bg-hover)] text-[var(--chat-text-primary)] transition-colors">
                                    <LayoutDashboard className="w-4 h-4 text-[var(--chat-text-muted)]" />
                                    Go to Dashboard
                                </button>
                                <button onClick={() => { router.push("/connectors"); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--chat-bg-hover)] text-[var(--chat-text-primary)] transition-colors">
                                    <Settings className="w-4 h-4 text-[var(--chat-text-muted)]" />
                                    Settings
                                </button>
                                <button onClick={() => { router.push("/dashboard/workspace"); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--chat-bg-hover)] text-[var(--chat-text-primary)] transition-colors">
                                    <FolderOpen className="w-4 h-4 text-[var(--chat-text-muted)]" />
                                    View in Workspace
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {onNewChatInNewTab && (
                    <button
                        type="button"
                        onClick={onNewChatInNewTab}
                        className="p-1.5 rounded-lg hover:bg-[var(--chat-bg-hover)] text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] transition-colors"
                        title="New Chat"
                        aria-label="New Chat"
                    >
                        <SquarePen className="w-4 h-4" />
                    </button>
                )}
                <ThemeToggle />
            </div>
        </header>
    );
}

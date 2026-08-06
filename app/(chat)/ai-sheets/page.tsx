"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import "@/styles/chat-theme.css";
import "@/styles/chat-provider-themes.css";

import {
    ChatInput,
    ChatMessages,
    ChatSidebar,
    NavSidebar,

    MinimalHeader,
    MENU_AGENTS,
    getModelApiId,
    getProviderFromModelId,
    type Message,
} from "@/components/chat";
import { ResizableChatPreviewLayout } from "@/components/chat/ResizableChatPreviewLayout";
import { AI_SHEETS_PANEL_LAYOUT_KEY } from "@/lib/panel-layout";

import { X } from "lucide-react";

import chatHistoryService, {
    ChatSession,
    ProjectSummary,
} from "@/app/api/chatHistory";
import { usePlaygroundAccess } from "@/hooks/use-playground-access";
import { useAuth } from "@/context/AuthContext";
import { useProviderTheme } from "@/hooks/use-provider-theme";

// Adapter
import {
    parseLLMToSheetData,
    type SpreadSheetData,
} from "@/lib/spreadjs-adapter";
import { parseSheetOps, applySheetOps, summariseOps } from "@/lib/sheet-ops";
import type { WorkbookJSON } from "@/lib/workbook-types";
import { blankSheetsCanvas, isPristineBlankWorkbook } from "@/lib/workbook-types";
import {
    parseWorkbookFile,
    WorkbookImportError,
} from "@/lib/workbook-import";
import {
    activeSheetToSpreadSheetData,
    replaceActiveSheet,
    spreadToWorkbook,
} from "@/lib/workbook-adapters";
import {
    ensureSheetsSession,
    EnsureSheetsSessionError,
} from "@/lib/ensure-sheets-session";
import {
    parseWorkbookOps,
    applyWorkbookOps,
    summariseWorkbookOps,
} from "@/lib/workbook-ops";
import {
    DEFAULT_CLARIFY_INTRO,
    formatClarificationQaBlock,
    normalizeClarifyResponse,
    type ClarifyAnswer,
    type ClarifyQuestion,
    type ClarifyResponse,
} from "@/lib/clarify";
import { openWorkspaceInNewTab } from "@/lib/open-workspace-new-tab";

// Fortune Sheet renderer — full Excel UI (SSR-safe dynamic import)
const SpreadsheetRenderer = dynamic(
    () => import("@/components/chat/FortuneSheetRenderer"),
    { ssr: false }
);

const SheetIcon = (props: any) => (
    <svg
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);

// API types
type StartResponse = {
    session_id: string;
    ai_response?: string;
    query_id?: string;
    status?: string;
    ai_provider?: {
        provider_name?: string;
        model?: string;
        model_name?: string;
    };
    provider_name?: string;
    model?: string;
    provider?: string;
    detail?: string;
};

type ContinueResponse = {
    session_id: string;
    answer?: string;
    query_id?: string;
    status?: string;
    ai_provider?: {
        provider_name?: string;
        model?: string;
        model_name?: string;
    };
    provider_name?: string;
    model?: string;
    provider?: string;
    detail?: string;
};

// Page component

export default function AISheetsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, signOut, isAuthenticated } = useAuth();
    const {
        canAccessPlayground,
        isLoading: accessLoading,
        refreshAccess,
    } = usePlaygroundAccess();

    // UI
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
    const [isLg, setIsLg] = useState(false);

    // Chat
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Model
    const [selectedModelId, setSelectedModelId] = useState<string>("claude-sonnet-4-6");
    const initialQueryHandledRef = useRef<string>("");
    /** Set immediately when callStart gets a session_id back — prevents URL effect from clearing it before sessionId state commits */
    const activeSessionRef = useRef<string>("");
    const { isTransitioning } = useProviderTheme(
        getProviderFromModelId(selectedModelId)
    );

    // Sheet state (adapter output) + multi-sheet workbook (Open Files / Phase 1+)
    // Always seed a blank in-memory canvas (Genspark-like); no session until first persist.
    const [sheetData, setSheetData] = useState<SpreadSheetData | null>(() =>
        activeSheetToSpreadSheetData(blankSheetsCanvas())
    );
    const [workbook, setWorkbook] = useState<WorkbookJSON | null>(() =>
        blankSheetsCanvas()
    );
    /** DB concurrency version for LWW autosave (Phase 2). */
    const [workbookVersion, setWorkbookVersion] = useState(0);
    const workbookVersionRef = useRef(0);
    workbookVersionRef.current = workbookVersion;
    const workbookDirtyRef = useRef(false);
    const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /**
     * Always-current sheet, for code that must not close over a stale value: the poll loop can be
     * running for minutes, and callContinue needs to send the grid as it is at request time
     * (including cells the user typed themselves).
     */
    const sheetDataRef = useRef<SpreadSheetData | null>(null);
    sheetDataRef.current = sheetData;
    const workbookRef = useRef<WorkbookJSON | null>(null);
    workbookRef.current = workbook;

    /** Commit AI/single-sheet updates while preserving other workbook tabs when present. */
    const flushWorkbookAutosaveRef = useRef<() => Promise<void>>(async () => {});

    const commitSheet = useCallback((sheet: SpreadSheetData | null) => {
        if (!sheet) {
            const seed = blankSheetsCanvas();
            setWorkbook(seed);
            setSheetData(activeSheetToSpreadSheetData(seed));
            workbookDirtyRef.current = false;
            return;
        }
        setSheetData(sheet);
        setWorkbook((prev) => {
            if (prev && prev.sheets.length > 0) {
                return replaceActiveSheet(prev, sheet);
            }
            return spreadToWorkbook(sheet);
        });
        // Persist patched workbook after NL ops / full active-sheet replace
        workbookDirtyRef.current = true;
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
            void flushWorkbookAutosaveRef.current();
        }, 400);
    }, []);
    /** Set when user explicitly clicks New Chat so URL effect clears state instead of re-adding session_id */
    const newChatRequestedRef = useRef(false);
    /**
     * Bumped by resetSheetsWorkspace so in-flight pollForSheet loops bail out
     * instead of re-applying sheet/chat state after a blank-workspace reset.
     */
    const workspaceGenerationRef = useRef(0);
    /** Prompt held while the clarify stepper is open (submit/skip then generate). */
    const pendingClarifyRef = useRef<{
        question: string;
        modelIdOverride?: string;
        additionalContent?: string | Record<string, unknown>;
        attachments?: { name: string; type?: string; url?: string }[];
        userMsgId: string;
        loadingMsgId: string;
        questions: ClarifyQuestion[];
        intro?: string | null;
    } | null>(null);

    // History
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [hasLoadedSessionIndex, setHasLoadedSessionIndex] = useState(false);

    /**
     * Clear session/workbook/chat/loading/poll-related workspace state only.
     * Does NOT touch preferences (selectedModelId, theme, sidebar open, session list).
     */
    const resetSheetsWorkspace = useCallback(() => {
        workspaceGenerationRef.current += 1;
        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
            autosaveTimerRef.current = null;
        }
        workbookDirtyRef.current = false;
        activeSessionRef.current = "";
        pendingClarifyRef.current = null;
        setSessionId("");
        setMessages([]);
        const seed = blankSheetsCanvas();
        setWorkbook(seed);
        setSheetData(activeSheetToSpreadSheetData(seed));
        setWorkbookVersion(0);
        setIsLoading(false);
        setIsLoadingHistory(false);
        setIsMobilePreviewOpen(false);
    }, []);

    // Playground access
    useEffect(() => {
        const checkAccess = async () => {
            const hasAccess = await refreshAccess();
            if (!hasAccess) router.push("/dashboard/credits");
        };
        checkAccess();
    }, [router, refreshAccess]);

    // Desktop (lg+) layout — breakpoint kept outside panel hooks
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const update = () => setIsLg(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Load sessions
    const loadChatSessions = useCallback(async () => {
        setIsLoadingSessions(true);
        try {
            const response = await chatHistoryService.getChatSessions();
            setChatSessions(response.sessions);
        } catch (error) {
            console.error("Failed to load chat sessions:", error);
        } finally {
            setIsLoadingSessions(false);
        }
    }, []);

    const loadProjects = useCallback(async () => {
        try {
            const response = await chatHistoryService.getProjects();
            setProjects(response.projects);
        } catch (error) {
            console.error("Failed to load projects:", error);
        }
    }, []);

    const mergedSessions = useMemo(() => {
        const seen = new Set(chatSessions.map((s) => s.session_id));
        const projectSessions: ChatSession[] = projects
            .filter((p) => !seen.has(p.session_id))
            .map((p) => ({
                session_id: p.session_id,
                title: p.title || p.project_id || "Web Builder",
                preview: p.project_id,
                created_at: p.created_at,
                updated_at: p.updated_at,
                message_count: 0,
                // Projects are always AI Developer sessions
                agent_id: "ai-builder",
            }));
        return [...chatSessions, ...projectSessions].sort(
            (a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }, [chatSessions, projects]);

    // Stable ref for mergedSessions — prevents URL effect from re-running on every sidebar refresh
    const mergedSessionsRef = useRef(mergedSessions);
    mergedSessionsRef.current = mergedSessions;

    // Load history
    const loadChatHistory = useCallback(async (sessionIdToLoad: string) => {
        setIsLoadingHistory(true);
        try {
            const history = await chatHistoryService.getChatHistory(sessionIdToLoad);
            if (!history) {
                toast.error("Session not found.");
                setIsLoadingHistory(false);
                return;
            }
            const loadedMessages: Message[] = history.messages.map((msg) => ({
                id: msg.id,
                type: msg.type === "outgoing" ? "user" : "assistant",
                content: msg.text,
                timestamp: msg.timestamp,
                attachments: msg.attachments as any,
                providerName: msg.ai_metadata?.provider,
                model: msg.ai_metadata?.model,
            }));

            // Rebuild the sheet by replaying the session forwards.
            //
            // Since edits come back as ops patches, the newest answer is usually NOT a full sheet —
            // so the old "walk backwards to the last parseable sheet" would restore the sheet as it
            // was BEFORE every edit. Replay instead: each full sheet resets the base, each ops patch
            // applies on top, oldest to newest.
            //
            // Note this rebuilds from the model's answers only. Cells the user typed by hand are not
            // in the transcript and are still lost on reload — that needs the `sheets` table
            // (AI_SHEETS.md §9), not this.
            let restoredSheet: SpreadSheetData | null = null;

            const displayMessages = loadedMessages.map((msg) => {
                if (msg.type !== "assistant" || !msg.content?.trim()) return msg;

                const ops = restoredSheet ? parseSheetOps(msg.content) : null;
                if (ops && restoredSheet) {
                    restoredSheet = applySheetOps(restoredSheet, ops);
                    return {
                        ...msg,
                        content: `✅ **${restoredSheet.sheetName}** — ${summariseOps(ops)}. See the preview on the right.`,
                    };
                }

                const parsed = parseLLMToSheetData(msg.content);
                if (parsed) {
                    restoredSheet = parsed;
                    return {
                        ...msg,
                        content: `✅ **${parsed.sheetName}** — ${parsed.rows.length} rows × ${parsed.columns.length} columns. See the preview on the right.`,
                    };
                }

                // Looks like JSON but didn't parse — show a neutral note rather than raw JSON.
                const trimmed = msg.content.trim();
                if (trimmed.startsWith("{") || trimmed.startsWith("```")) {
                    return { ...msg, content: "✅ Spreadsheet generated. Re-run the prompt to regenerate the preview." };
                }
                return msg;
            });

            // Restore GenSpark-style Q/A card after the first user turn when present
            const clarification = history.last_clarification;
            if (
                clarification &&
                Array.isArray(clarification.questions) &&
                clarification.questions.length > 0 &&
                Array.isArray(clarification.answers)
            ) {
                const clarifyMsg: Message = {
                    id: `${sessionIdToLoad}-clarify`,
                    type: "assistant",
                    content: "",
                    clarify: {
                        intro: clarification.intro || DEFAULT_CLARIFY_INTRO,
                        questions: clarification.questions as ClarifyQuestion[],
                        answers: clarification.answers as ClarifyAnswer[],
                        status: "submitted",
                        submitLabel: "Build spreadsheet",
                    },
                };
                const firstUserIdx = displayMessages.findIndex((m) => m.type === "user");
                if (firstUserIdx >= 0) {
                    displayMessages.splice(firstUserIdx + 1, 0, clarifyMsg);
                } else {
                    displayMessages.unshift(clarifyMsg);
                }
            }

            setMessages(displayMessages);
            setSessionId(sessionIdToLoad);

            // Prefer persisted workbook over replaying answer JSON (Phase 2).
            let loadedWorkbook = false;
            try {
                const res = await fetch(
                    `/api/ai/sheets/workbooks/${encodeURIComponent(sessionIdToLoad)}`,
                    { credentials: "include", cache: "no-store" }
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data?.workbook?.sheets?.length) {
                        setWorkbook(data.workbook as WorkbookJSON);
                        setSheetData(
                            activeSheetToSpreadSheetData(data.workbook as WorkbookJSON)
                        );
                        setWorkbookVersion(Number(data.version) || 1);
                        workbookDirtyRef.current = false;
                        loadedWorkbook = true;
                    }
                }
            } catch (e) {
                console.warn("Workbook load skipped:", e);
            }

            // Spec: no saved workbook → keep blank in-memory seed (do not replay transcript into grid).
            if (!loadedWorkbook) {
                const seed = blankSheetsCanvas();
                setWorkbook(seed);
                setSheetData(activeSheetToSpreadSheetData(seed));
                setWorkbookVersion(0);
                workbookDirtyRef.current = false;
            }
        } catch (error) {
            console.error("Failed to load chat history:", error);
            toast.error("Failed to load chat history");
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    // Mount
        // Mount — wait for auth before fetching sessions
    useEffect(() => {
        if (!isAuthenticated) return;
        let isActive = true;
        const init = async () => {
            await Promise.all([loadChatSessions(), loadProjects()]);
            if (isActive) setHasLoadedSessionIndex(true);
        };
        init();
        return () => {
            isActive = false;
        };
    }, [isAuthenticated, loadChatSessions, loadProjects]);

    // URL session handling
    useEffect(() => {
        const urlSessionId = searchParams.get("session_id");
        const isNewRequest = searchParams.get("new");

        // ?new=timestamp — force blank workspace
        if (isNewRequest) {
            resetSheetsWorkspace();
            router.replace("/ai-sheets", { scroll: false });
            return;
        }

        // If no session_id in URL
        if (!urlSessionId) {
            // User explicitly clicked New Chat: clear state and do not re-add session_id
            if (newChatRequestedRef.current) {
                newChatRequestedRef.current = false;
                resetSheetsWorkspace();
                return;
            }
            // We have a live session with content (e.g. right after start): sync URL so sheet/chat don't disappear
            // Blank canvas seed alone is not "content" — do not force session_id onto a fresh workspace.
            if (
                sessionId &&
                (messages.length > 0 ||
                    (workbook && !isPristineBlankWorkbook(workbook)))
            ) {
                router.replace(`/ai-sheets?session_id=${sessionId}`, { scroll: false });
                return;
            }
            if (sessionId) {
                resetSheetsWorkspace();
            }
            return;
        }

        if (!hasLoadedSessionIndex) return;

        const sessionExists = mergedSessionsRef.current.some(
            (s) => s.session_id === urlSessionId
        );
        const isCurrentActiveSession = urlSessionId === sessionId || urlSessionId === activeSessionRef.current;

        if (!sessionExists && !isCurrentActiveSession) {
            resetSheetsWorkspace();
            router.replace("/ai-sheets");
            return;
        }

        if (urlSessionId !== sessionId) {
            loadChatHistory(urlSessionId);
        }
    }, [searchParams, sessionId, messages.length, sheetData, workbook, loadChatHistory, router, hasLoadedSessionIndex, resetSheetsWorkspace]);

    // Session / navigation handlers
    const handleNewChat = () => {
        newChatRequestedRef.current = true;
        resetSheetsWorkspace();
        router.replace("/ai-sheets");
    };

    /** Open a blank AI Sheets workspace in a new tab; leave this tab untouched. */
    const handleNewChatInNewTab = () => {
        openWorkspaceInNewTab("/ai-sheets");
    };

    const handleSelectSession = (sessionIdToLoad: string, agentId?: string | null) => {
        if (agentId === "ai-builder") {
            router.push(`/project/${sessionIdToLoad}?agent_id=ai-builder`);
            return;
        }

        if (agentId === "ai-sheets") {
            router.replace(`/ai-sheets?session_id=${sessionIdToLoad}`);
            loadChatHistory(sessionIdToLoad);
            return;
        }

        if (agentId === "ai-docs") {
            router.push(`/ai-docs?session_id=${sessionIdToLoad}`);
            return;
        }

        if (agentId === "ai-slides") {
            router.push(`/ai-slides?session_id=${sessionIdToLoad}`);
            return;
        }

        if (agentId === "ai-chat" || agentId === "chat") {
            router.push(`/ai-chat?session_id=${sessionIdToLoad}`);
            return;
        }

        // Fallback to main chat for any other/unknown agents
        const agentParam = agentId ? `&agent_id=${agentId}` : "";
        router.push(`/chat?session_id=${sessionIdToLoad}${agentParam}`);
    };

    const handleOpenProject = (projectSessionId: string) => {
        router.push(`/project/${projectSessionId}`);
    };

    const handleDeleteSession = async (sessionIdToDelete: string) => {
        try {
            const success = await chatHistoryService.deleteChatSession(sessionIdToDelete);
            if (success) {
                setChatSessions((prev) =>
                    prev.filter((s) => s.session_id !== sessionIdToDelete)
                );
                setProjects((prev) =>
                    prev.filter((p) => p.session_id !== sessionIdToDelete)
                );
                if (sessionId === sessionIdToDelete) handleNewChat();
                toast.success("Chat deleted");
            } else {
                toast.error("Failed to delete chat");
            }
        } catch {
            toast.error("Failed to delete chat");
        }
    };

    const handleRenameSession = async (sessionIdToRename: string, newTitle: string) => {
        try {
            const updated = await chatHistoryService.renameChatSession(sessionIdToRename, newTitle);
            if (!updated?.title) {
                toast.error("Failed to rename chat");
                return;
            }
            setChatSessions((prev) =>
                prev.map((s) =>
                    s.session_id === sessionIdToRename ? { ...s, title: updated.title } : s
                )
            );
            setProjects((prev) =>
                prev.map((p) =>
                    p.session_id === sessionIdToRename ? { ...p, title: updated.title } : p
                )
            );
            toast.success("Chat renamed");
        } catch {
            toast.error("Failed to rename chat");
        }
    };

    const handleSignOut = async () => {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        localStorage.removeItem("chat-theme");
        await signOut();
        router.push("/");
    };

    const handleAgentAction = (agentName: string) => {
        if (agentName === "Web Builder") {
            router.push("/project/new");
            return;
        }
        if (agentName === "App Builder") {
            router.push("/ai-builder");
            return;
        }
        if (agentName === "AI Chat") {
            router.push("/ai-chat");
            return;
        }
        if (agentName === "AI Sheets") {
            router.push("/ai-sheets?new=" + Date.now());
            return;
        }
        if (agentName === "AI Docs") {
            router.push("/ai-docs");
            return;
        }
        if (agentName === "AI Slides") {
            router.push("/ai-slides");
            return;
        }
        if (agentName === "AI Image") {
            router.push("/chat/media?mode=image");
            return;
        }
        if (agentName === "AI Video") {
            router.push("/chat/media?mode=video");
            return;
        }
        handleNewChat();
    };

    // User edited the grid — keep workbook in sync and schedule LWW autosave.
    // First persist without a session: ensureSheetsSession then PUT (Hybrid Option B).
    const flushWorkbookAutosave = useCallback(async () => {
        const wb = workbookRef.current;
        if (!wb || !workbookDirtyRef.current) return;

        const gen = workspaceGenerationRef.current;
        let sid = sessionId || activeSessionRef.current;

        try {
            if (!sid) {
                if (isPristineBlankWorkbook(wb)) {
                    workbookDirtyRef.current = false;
                    return;
                }
                const created = await ensureSheetsSession(null);
                if (gen !== workspaceGenerationRef.current) return;
                sid = created.session_id;
                activeSessionRef.current = sid;
                setSessionId(sid);
                router.replace(`/ai-sheets?session_id=${sid}`, { scroll: false });
                void loadChatSessions();
            }

            const res = await fetch(
                `/api/ai/sheets/workbooks/${encodeURIComponent(sid)}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        workbook: wb,
                        version: workbookVersionRef.current,
                    }),
                }
            );
            if (gen !== workspaceGenerationRef.current) return;
            if (!res.ok) {
                console.warn("Workbook autosave failed", res.status);
                return;
            }
            const data = await res.json();
            setWorkbookVersion(Number(data.version) || workbookVersionRef.current + 1);
            workbookDirtyRef.current = false;
            if (data.conflict) {
                toast.message(
                    "Spreadsheet saved (another tab may have overwritten intermediate edits)"
                );
            }
        } catch (e) {
            if (e instanceof EnsureSheetsSessionError) {
                console.warn("Sheets session create failed", e.message);
                toast.error(e.message || "Could not create spreadsheet session");
                return;
            }
            console.warn("Workbook autosave error", e);
        }
    }, [sessionId, router, loadChatSessions]);

    flushWorkbookAutosaveRef.current = flushWorkbookAutosave;

    const handleDataChange = useCallback((next: SpreadSheetData) => {
        setSheetData(next);
        setWorkbook((prev) =>
            prev && prev.sheets.length > 0
                ? replaceActiveSheet(prev, next)
                : spreadToWorkbook(next)
        );
        workbookDirtyRef.current = true;
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
            void flushWorkbookAutosave();
        }, 1500);
    }, [flushWorkbookAutosave]);

    const handleWorkbookChange = useCallback((next: WorkbookJSON) => {
        setWorkbook(next);
        setSheetData(activeSheetToSpreadSheetData(next));
        workbookDirtyRef.current = true;
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
            void flushWorkbookAutosave();
        }, 1500);
    }, [flushWorkbookAutosave]);

    const handleOpenFiles = useCallback(
        async (file: File) => {
            const current = workbookRef.current;
            if (current && !isPristineBlankWorkbook(current)) {
                const ok = window.confirm(
                    "Replace the current spreadsheet with this file?"
                );
                if (!ok) return;
            }

            const previousWorkbook = workbookRef.current;
            const previousSheet = sheetDataRef.current;
            const previousVersion = workbookVersionRef.current;

            try {
                // Instant client preview
                const preview = await parseWorkbookFile(file);
                setWorkbook(preview);
                setSheetData(activeSheetToSpreadSheetData(preview));

                const form = new FormData();
                form.append("file", file);
                const existingSid = sessionId || activeSessionRef.current;
                if (existingSid) form.append("session_id", existingSid);

                const res = await fetch("/api/ai/sheets/import", {
                    method: "POST",
                    credentials: "include",
                    body: form,
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setWorkbook(previousWorkbook);
                    setSheetData(previousSheet);
                    setWorkbookVersion(previousVersion);
                    throw new Error(
                        (data as { detail?: string })?.detail ||
                            "Server rejected the spreadsheet"
                    );
                }

                const sid = String(data.session_id || existingSid || "");
                if (sid && sid !== sessionId) {
                    activeSessionRef.current = sid;
                    setSessionId(sid);
                    router.replace(`/ai-sheets?session_id=${sid}`, { scroll: false });
                    void loadChatSessions();
                }

                // Authoritative server workbook replaces preview
                setWorkbook(data.workbook as WorkbookJSON);
                setSheetData(
                    activeSheetToSpreadSheetData(data.workbook as WorkbookJSON)
                );
                setWorkbookVersion(Number(data.version) || 1);
                workbookDirtyRef.current = false;

                const wb = data.workbook as WorkbookJSON;
                const warnings =
                    wb?.importMeta?.warnings ??
                    (Array.isArray(data.import_warnings)
                        ? data.import_warnings
                        : []);
                const sheetCount = wb?.sheets?.length ?? 0;
                const codes = [
                    ...new Set(
                        warnings.map((w: { code?: string }) => w.code || "WARNING")
                    ),
                ];
                const base = `Loaded ${sheetCount} sheet${sheetCount === 1 ? "" : "s"}`;
                if (codes.length) {
                    toast.message(`${base} · ${codes.join(", ")}`, {
                        description: `${codes.length} import note${
                            codes.length === 1 ? "" : "s"
                        } (formatting may be approximate)`,
                    });
                } else {
                    toast.success(base);
                }
            } catch (err) {
                const message =
                    err instanceof WorkbookImportError
                        ? err.message
                        : err instanceof Error
                          ? err.message
                          : "Failed to open file";
                toast.error(message);
            }
        },
        [sessionId, router, loadChatSessions]
    );

    // Flush dirty workbook on hide / unload
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === "hidden") {
                void flushWorkbookAutosave();
            }
        };
        const onUnload = () => {
            // best-effort; async may not complete
            void flushWorkbookAutosave();
        };
        document.addEventListener("visibilitychange", onVis);
        window.addEventListener("beforeunload", onUnload);
        return () => {
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener("beforeunload", onUnload);
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        };
    }, [flushWorkbookAutosave]);

    /**
     * Interpret a model response.
     *
     * Two shapes are possible, matching the two modes in the server prompt:
     *  - an ops patch  {"ops":[...]}  — the normal case for a follow-up edit
     *  - a full sheet                 — first generation, or a change sweeping enough that the
     *                                   model chose to replace everything
     *
     * Ops are tried first and only when a sheet already exists to patch. parseSheetOps returns
     * null for a full sheet, so the fallback is unambiguous.
     */
    const interpretSheetResponse = useCallback(
        (
            text: string
        ): {
            sheet: SpreadSheetData | null;
            workbook: WorkbookJSON | null;
            summary: string | null;
        } => {
            if (!text?.trim()) return { sheet: null, workbook: null, summary: null };

            const wbBase = workbookRef.current;
            // Prefer workbook-ops (sheet targeting + future structure ops) when a workbook exists.
            if (wbBase) {
                const wbOps = parseWorkbookOps(text);
                if (wbOps) {
                    const { workbook: next, applied } = applyWorkbookOps(wbBase, wbOps);
                    const sheet = activeSheetToSpreadSheetData(next);
                    return {
                        sheet,
                        workbook: next,
                        summary: `✅ **${sheet?.sheetName ?? "Sheet"}** — ${summariseWorkbookOps(applied)}. See the preview on the right.`,
                    };
                }
            }

            const base = sheetDataRef.current;
            if (base) {
                const ops = parseSheetOps(text);
                if (ops) {
                    const next = applySheetOps(base, ops);
                    return {
                        sheet: next,
                        workbook: null,
                        summary: `✅ **${next.sheetName}** — ${summariseOps(ops)}. See the preview on the right.`,
                    };
                }
            }

            const full = parseLLMToSheetData(text);
            if (full) {
                return {
                    sheet: full,
                    workbook: null,
                    summary: `✅ **${full.sheetName}** — ${full.rows.length} rows × ${full.columns.length} columns. See the preview on the right.`,
                };
            }

            return { sheet: null, workbook: null, summary: null };
        },
        []
    );

    const applyInterpretResult = useCallback(
        (result: {
            sheet: SpreadSheetData | null;
            workbook: WorkbookJSON | null;
        }) => {
            if (result.workbook) {
                setWorkbook(result.workbook);
                setSheetData(activeSheetToSpreadSheetData(result.workbook));
                workbookDirtyRef.current = true;
                if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
                autosaveTimerRef.current = setTimeout(() => {
                    void flushWorkbookAutosaveRef.current();
                }, 400);
                return;
            }
            if (result.sheet) commitSheet(result.sheet);
        },
        [commitSheet]
    );

    // Polling: wait for background AI response and process it
    const pollForSheet = useCallback(async (sid: string, loadingMsgId: string, queryId?: string) => {
        const MAX_POLL_ATTEMPTS = 180; // 180 × 2s = 6 min
        const pollInterval = 2000;
        const gen = workspaceGenerationRef.current;

        // Fast path: poll /api/ai/query/{queryId} when we have a query_id
        if (queryId) {
            let attempts = 0;
            while (attempts < MAX_POLL_ATTEMPTS) {
                await new Promise((r) => setTimeout(r, pollInterval));
                if (workspaceGenerationRef.current !== gen) return;
                attempts++;
                try {
                    const pollRes = await fetch(`/api/ai/query/${queryId}`, { credentials: "include", cache: "no-cache" });
                    if (!pollRes.ok) continue;
                    const pollData = await pollRes.json();
                    if (pollData.status === "completed") {
                        if (workspaceGenerationRef.current !== gen) return;
                        const aiContent = pollData.answer;
                        const interpreted = interpretSheetResponse(aiContent ?? "");
                        const friendlyContent =
                            interpreted.summary ?? (aiContent || "✅ Spreadsheet generated.");
                        applyInterpretResult(interpreted);
                        setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
                            ...m,
                            content: friendlyContent,
                            isLoading: false,
                        } : m));
                        setIsLoading(false);
                        setTimeout(() => { loadChatSessions(); loadProjects(); }, 500);
                        return;
                    }
                    if (pollData.status === "failed") {
                        throw new Error(pollData.answer || "Generation failed");
                    }
                } catch (pollErr) {
                    console.error("Sheet query poll error:", pollErr);
                    // transient error — keep trying
                }
            }
            if (workspaceGenerationRef.current !== gen) return;
            // Timed out
            setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
                ...m,
                content: "The spreadsheet is taking longer than expected. Please try again.",
                isLoading: false,
                isError: true
            } : m));
            setIsLoading(false);
            return;
        }

        // Slow path fallback: poll chat history (used when no query_id returned)
        let attempts = 0;
        let initialIncomingCount = -1;

        const poll = async () => {
            if (workspaceGenerationRef.current !== gen) return;
            if (attempts >= MAX_POLL_ATTEMPTS) {
                setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
                    ...m,
                    content: "The spreadsheet is taking longer than expected. Please try again.",
                    isLoading: false,
                    isError: true
                } : m));
                setIsLoading(false);
                return;
            }

            try {
                const history = await chatHistoryService.getChatHistory(sid);
                if (workspaceGenerationRef.current !== gen) return;
                if (history && history.messages.length > 0) {
                    const assistantMsgs = history.messages.filter(m => m.type === "incoming");
                    if (initialIncomingCount === -1) initialIncomingCount = assistantMsgs.length;
                    const lastMsg = assistantMsgs[assistantMsgs.length - 1];
                    if (lastMsg && lastMsg.text && assistantMsgs.length > initialIncomingCount) {
                        const interpreted = interpretSheetResponse(lastMsg.text);
                        const friendlyContent = interpreted.summary ?? lastMsg.text;
                        applyInterpretResult(interpreted);
                        setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
                            ...m,
                            content: friendlyContent,
                            isLoading: false,
                            providerName: lastMsg.ai_metadata?.provider,
                            model: lastMsg.ai_metadata?.model
                        } : m));
                        setIsLoading(false);
                        setTimeout(() => { loadChatSessions(); loadProjects(); }, 500);
                        return;
                    }
                }
            } catch (e) {
                console.error("Sheet polling error:", e);
            }

            attempts++;
            setTimeout(poll, pollInterval);
        };

        poll();
    }, [loadChatSessions, loadProjects, interpretSheetResponse, applyInterpretResult]);

    // API: start new session
    const callStart = useCallback(
        async (
            question: string,
            modelIdOverride?: string,
            additionalContent?: string | Record<string, unknown>,
            attachments?: { name: string; type?: string; url?: string }[],
            options?: {
                clarificationQaText?: string;
                clarificationPayload?: Record<string, unknown>;
                existingUserMsgId?: string;
                existingLoadingMsgId?: string;
            }
        ) => {
            const userMessageId = options?.existingUserMsgId || crypto.randomUUID();
            const loadingMessageId = options?.existingLoadingMsgId || crypto.randomUUID();

            if (!options?.existingLoadingMsgId) {
                setMessages((prev) => [
                    ...prev,
                    { id: userMessageId, type: "user", content: question, attachments: attachments?.length ? attachments : undefined },
                    { id: loadingMessageId, type: "assistant", content: "", isLoading: true },
                ]);
            } else {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === loadingMessageId
                            ? { ...m, content: "", isLoading: true, clarify: undefined }
                            : m
                    )
                );
            }
            setIsLoading(true);

            try {
                const effectiveModelId = modelIdOverride || selectedModelId;
                const preferredProvider = getProviderFromModelId(effectiveModelId);
                const preferredModel = getModelApiId(effectiveModelId);
                const isAuto = effectiveModelId === "auto";
                // Route through amazon-bedrock by default (company-wide policy).
                // Only fall through to the raw provider name when the user has
                // explicitly selected a non-AI2me/non-auto provider.
                const resolvedPreferredProvider =
                    preferredProvider === "AI2me" || preferredProvider === "auto"
                        ? "amazon-bedrock"
                        : preferredProvider;
                const resolvedPreferredModel = isAuto
                    ? "us.anthropic.claude-sonnet-4-6-20251001-v1:0"
                    : preferredModel === "auto"
                        ? ""
                        : preferredModel;

                const response = await fetch("/api/ai/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        question,
                        connector_ids: [],
                        // additional_content carries the user's own uploads only. The spreadsheet
                        // system prompt is server-owned and gated on agent_id — see
                        // EnhancedRoutingService._get_ai_sheets_instructions().
                        additional_content: additionalContent,
                        session_metadata: { agent_id: "ai-sheets" },
                        // Same workbook context as Continue — import-then-first-prompt must
                        // reach CURRENT SHEET via the single background Bedrock path.
                        current_sheet:
                            (workbookRef.current
                                ? activeSheetToSpreadSheetData(workbookRef.current)
                                : null) ??
                            sheetDataRef.current ??
                            undefined,
                        workbook_sheet_names: workbookRef.current?.sheets.map(
                            (s) => s.name
                        ),
                        preferences: {
                            cost_sensitivity: "medium",
                            quality_priority: "balanced",
                            response_time: "",
                            preferred_provider: resolvedPreferredProvider,
                            preferred_model: resolvedPreferredModel,
                        },
                        attachments,
                        instant_response: true,
                        clarification_qa_text: options?.clarificationQaText || undefined,
                        clarification_payload: options?.clarificationPayload || undefined,
                    }),
                });

                const data: StartResponse & { detail?: string } = await response.json();
                if (!response.ok) throw new Error(data.detail || "Failed to start session");

                // Pin session immediately in ref so URL effect doesn't clear state before React commits setSessionId
                activeSessionRef.current = data.session_id;
                setSessionId(data.session_id);
                // Keep URL in sync so the session effect doesn't clear state (sheet + messages)
                router.replace(`/ai-sheets?session_id=${data.session_id}`, { scroll: false });

                const aiContent = data.ai_response;

                if (aiContent) {
                    // Got immediate response — a full sheet, or an ops patch for an edit
                    const interpreted = interpretSheetResponse(aiContent);
                    if (interpreted.sheet || interpreted.workbook) {
                        const friendlyContent = interpreted.summary!;
                        applyInterpretResult(interpreted);
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === loadingMessageId
                                    ? {
                                        ...msg,
                                        content: friendlyContent,
                                        providerName: data.ai_provider?.provider_name || data.provider_name || data.provider || "",
                                        model: data.ai_provider?.model_name || data.ai_provider?.model || data.model || "",
                                    }
                                    : msg
                            )
                        );
                        setIsLoading(false);
                        await loadChatSessions();
                        await loadProjects();
                    } else {
                        // Parse failed (truncated/malformed JSON) — poll for result
                        pollForSheet(data.session_id, loadingMessageId, data.query_id);
                    }
                } else if ((data.status === "pending" || data.status === "processing") && data.query_id) {
                    // Async processing — poll via query endpoint
                    pollForSheet(data.session_id, loadingMessageId, data.query_id);
                } else {
                    // No immediate response — poll via history fallback
                    pollForSheet(data.session_id, loadingMessageId);
                }
            } catch (e: unknown) {
                const err = e as Error;
                toast.error(err.message || "Failed to send message");
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === loadingMessageId
                            ? {
                                id: loadingMessageId,
                                type: "assistant" as const,
                                content: (err as any).message?.includes?.("redit") ? "⚠️ You've run out of credits. Please top up to continue." : ((err as any).message && (err as any).message !== "Failed to send message" ? (err as any).message : "Unable to generate a response. Please try again."),
                                isError: true,
                            }
                            : msg
                    )
                );
                setIsLoading(false);
            }
        },
        [selectedModelId, loadChatSessions, loadProjects, pollForSheet, interpretSheetResponse, applyInterpretResult]
    );

    // API: continue existing session
    const callContinue = useCallback(
        async (
            question: string,
            modelIdOverride?: string,
            additionalContent?: string | Record<string, unknown>,
            attachments?: { name: string; type?: string; url?: string }[],
            options?: {
                clarificationQaText?: string;
                clarificationPayload?: Record<string, unknown>;
                existingUserMsgId?: string;
                existingLoadingMsgId?: string;
            }
        ) => {
            const effectiveSessionId = sessionId || activeSessionRef.current;
            if (!effectiveSessionId) {
                await callStart(question, modelIdOverride, additionalContent, attachments, options);
                return;
            }

            const userMessageId = options?.existingUserMsgId || crypto.randomUUID();
            const loadingMessageId = options?.existingLoadingMsgId || crypto.randomUUID();

            if (!options?.existingLoadingMsgId) {
                setMessages((prev) => [
                    ...prev,
                    { id: userMessageId, type: "user", content: question, attachments: attachments?.length ? attachments : undefined },
                    { id: loadingMessageId, type: "assistant", content: "", isLoading: true },
                ]);
            } else {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === loadingMessageId
                            ? { ...m, content: "", isLoading: true, clarify: undefined }
                            : m
                    )
                );
            }
            setIsLoading(true);

            try {
                const effectiveModelId = modelIdOverride || selectedModelId;
                const preferredProvider = getProviderFromModelId(effectiveModelId);
                const preferredModel = getModelApiId(effectiveModelId);
                const isAuto = effectiveModelId === "auto";
                // Route through amazon-bedrock by default (company-wide policy).
                // Only fall through to the raw provider name when the user has
                // explicitly selected a non-AI2me/non-auto provider.
                const resolvedPreferredProvider =
                    preferredProvider === "AI2me" || preferredProvider === "auto"
                        ? "amazon-bedrock"
                        : preferredProvider;
                const resolvedPreferredModel = isAuto
                    ? "us.anthropic.claude-sonnet-4-6-20251001-v1:0"
                    : preferredModel === "auto"
                        ? ""
                        : preferredModel;

                const response = await fetch("/api/ai/continue", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        session_id: effectiveSessionId,
                        question,
                        // See callStart: prompt is server-owned, gated on agent_id. Resend the
                        // marker so a session started before this change still routes correctly.
                        additional_content: additionalContent,
                        session_metadata: { agent_id: "ai-sheets" },
                        // The live grid, so the model edits what the user is actually looking at.
                        // Without this the server falls back to replaying the model's own previous
                        // answer, which silently reverts any cell the user typed by hand. Its
                        // presence also switches the prompt into ops mode — one edit becomes one
                        // op instead of a full regeneration. Mirrors AI Docs' current_document_html.
                        // Active sheet from WorkbookJSON when present — drives ops-mode edits.
                        current_sheet:
                            (workbookRef.current
                                ? activeSheetToSpreadSheetData(workbookRef.current)
                                : null) ??
                            sheetDataRef.current ??
                            undefined,
                        workbook_sheet_names: workbookRef.current?.sheets.map(
                            (s) => s.name
                        ),
                        preferences: {
                            cost_sensitivity: "medium",
                            quality_priority: "balanced",
                            response_time: "",
                            preferred_provider: resolvedPreferredProvider,
                            preferred_model: resolvedPreferredModel,
                        },
                        attachments,
                        instant_response: true,
                        clarification_qa_text: options?.clarificationQaText || undefined,
                        clarification_payload: options?.clarificationPayload || undefined,
                    }),
                });

                const data: ContinueResponse & { detail?: string } = await response.json();
                if (!response.ok) throw new Error(data.detail || "Failed to continue session");

                if (!sessionId && effectiveSessionId) {
                    setSessionId(effectiveSessionId);
                }

                const aiContent = data.answer;

                if (aiContent) {
                    const interpreted = interpretSheetResponse(aiContent);
                    if (interpreted.sheet || interpreted.workbook) {
                        const friendlyContent = interpreted.summary!;
                        applyInterpretResult(interpreted);
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === loadingMessageId
                                    ? {
                                        ...msg,
                                        content: friendlyContent,
                                        providerName: data.ai_provider?.provider_name || data.provider_name || data.provider || "",
                                        model: data.ai_provider?.model_name || data.ai_provider?.model || data.model || "",
                                    }
                                    : msg
                            )
                        );
                        setIsLoading(false);
                    } else {
                        // Parse failed — poll for result
                        pollForSheet(effectiveSessionId, loadingMessageId, data.query_id);
                    }
                } else if ((data.status === "pending" || data.status === "processing") && data.query_id) {
                    // Async processing — poll via query endpoint
                    pollForSheet(effectiveSessionId, loadingMessageId, data.query_id);
                } else {
                    // No immediate response — poll via history fallback
                    pollForSheet(effectiveSessionId, loadingMessageId);
                }
            } catch (e: unknown) {
                const err = e as Error;
                toast.error(err.message || "Failed to send message");
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === loadingMessageId
                            ? {
                                id: loadingMessageId,
                                type: "assistant" as const,
                                content: (err as any).message?.includes?.("redit") ? "⚠️ You've run out of credits. Please top up to continue." : ((err as any).message && (err as any).message !== "Failed to send message" ? (err as any).message : "Unable to generate a response. Please try again."),
                                isError: true,
                            }
                            : msg
                    )
                );
                setIsLoading(false);
            }
        },
        [callStart, selectedModelId, sessionId, pollForSheet, interpretSheetResponse, applyInterpretResult]
    );

    const runGenerateAfterClarify = useCallback(
        async (
            pending: NonNullable<typeof pendingClarifyRef.current>,
            clarificationQaText?: string,
            clarificationPayload?: Record<string, unknown>
        ) => {
            const opts = {
                clarificationQaText,
                clarificationPayload,
                existingUserMsgId: pending.userMsgId,
                existingLoadingMsgId: pending.loadingMsgId,
            };
            if (sessionId || activeSessionRef.current) {
                await callContinue(
                    pending.question,
                    pending.modelIdOverride,
                    pending.additionalContent,
                    pending.attachments,
                    opts
                );
            } else {
                await callStart(
                    pending.question,
                    pending.modelIdOverride,
                    pending.additionalContent,
                    pending.attachments,
                    opts
                );
            }
        },
        [callContinue, callStart, sessionId]
    );

    const handleClarifySubmit = useCallback(
        async (messageId: string, answers: ClarifyAnswer[]) => {
            const pending = pendingClarifyRef.current;
            if (!pending || pending.loadingMsgId !== messageId) return;
            const qaText = formatClarificationQaBlock(pending.questions, answers);
            const payload = {
                intro: pending.intro || DEFAULT_CLARIFY_INTRO,
                questions: pending.questions,
                answers,
                status: "submitted" as const,
            };
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId
                        ? {
                              ...m,
                              content: "",
                              isLoading: false,
                              clarify: {
                                  intro: payload.intro,
                                  questions: payload.questions,
                                  answers,
                                  status: "submitted",
                              },
                          }
                        : m
                )
            );
            // New loading bubble for generation after Q/A is locked in
            const genLoadingId = crypto.randomUUID();
            setMessages((prev) => [
                ...prev,
                { id: genLoadingId, type: "assistant", content: "", isLoading: true },
            ]);
            pendingClarifyRef.current = {
                ...pending,
                loadingMsgId: genLoadingId,
            };
            await runGenerateAfterClarify(pendingClarifyRef.current, qaText, payload);
            pendingClarifyRef.current = null;
        },
        [runGenerateAfterClarify]
    );

    const handleClarifySkip = useCallback(
        async (messageId: string) => {
            const pending = pendingClarifyRef.current;
            if (!pending || pending.loadingMsgId !== messageId) return;
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId
                        ? {
                              ...m,
                              content: "Using defaults…",
                              isLoading: false,
                              clarify: undefined,
                          }
                        : m
                )
            );
            const genLoadingId = crypto.randomUUID();
            setMessages((prev) => [
                ...prev,
                { id: genLoadingId, type: "assistant", content: "", isLoading: true },
            ]);
            pendingClarifyRef.current = { ...pending, loadingMsgId: genLoadingId };
            await runGenerateAfterClarify(pendingClarifyRef.current);
            pendingClarifyRef.current = null;
        },
        [runGenerateAfterClarify]
    );

    const handleSendMessage = useCallback(
        async (message: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string; url?: string }[], modelIdOverride?: string) => {
            const userMsgId = crypto.randomUUID();
            const loadingMsgId = crypto.randomUUID();
            const isFollowUp = Boolean(sessionId || activeSessionRef.current);

            setMessages((prev) => [
                ...prev,
                {
                    id: userMsgId,
                    type: "user",
                    content: message,
                    attachments: attachments?.length ? attachments : undefined,
                },
                {
                    id: loadingMsgId,
                    type: "assistant",
                    content: "",
                    isLoading: true,
                    generationStatus: "Preparing a few questions…",
                },
            ]);
            setIsLoading(true);

            let clarify: ClarifyResponse | null = null;
            try {
                const sheet = sheetDataRef.current;
                const summary = sheet
                    ? `${sheet.sheetName || "Sheet"}: ${sheet.rows?.length || 0} rows × ${sheet.columns?.length || 0} columns`
                    : null;
                const res = await fetch("/api/ai/clarify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        question: message,
                        agent_id: "ai-sheets",
                        session_id: sessionId || activeSessionRef.current || null,
                        is_follow_up: isFollowUp,
                        current_context_summary: summary,
                    }),
                });
                if (res.ok) {
                    const raw = await res.json();
                    clarify = normalizeClarifyResponse(raw);
                }
            } catch (e) {
                console.warn("sheets clarify failed; falling back to generate", e);
            }

            if (clarify && !clarify.sufficient && clarify.questions.length > 0) {
                pendingClarifyRef.current = {
                    question: message,
                    modelIdOverride,
                    additionalContent,
                    attachments,
                    userMsgId,
                    loadingMsgId,
                    questions: clarify.questions,
                    intro: clarify.intro,
                };
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === loadingMsgId
                            ? {
                                  ...m,
                                  content: "",
                                  isLoading: false,
                                  generationStatus: undefined,
                                  clarify: {
                                      intro: clarify!.intro || DEFAULT_CLARIFY_INTRO,
                                      questions: clarify!.questions,
                                      status: "active",
                                      submitLabel: "Build spreadsheet",
                                  },
                              }
                            : m
                    )
                );
                setIsLoading(false);
                return;
            }

            // sufficient / failure → generate immediately (reuse messages already appended)
            await (isFollowUp ? callContinue : callStart)(
                message,
                modelIdOverride,
                additionalContent,
                attachments,
                {
                    existingUserMsgId: userMsgId,
                    existingLoadingMsgId: loadingMsgId,
                }
            );
        },
        [callContinue, callStart, sessionId]
    );

    // Handle initial message from URL query param
    useEffect(() => {
        const initialMessage = (searchParams.get("message") || "").trim();
        if (!initialMessage) return;
        const urlSessionId = searchParams.get("session_id");
        if (urlSessionId || sessionId || isLoading) return;

        const messageKey = initialMessage;
        if (initialQueryHandledRef.current === messageKey) return;
        initialQueryHandledRef.current = messageKey;

        (async () => {
            await handleSendMessage(initialMessage);
        })();
    }, [searchParams, sessionId, isLoading, handleSendMessage]);

    // Access guard
    if (accessLoading) {
        return (
            <div className="min-h-screen bg-[var(--chat-bg-primary)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[var(--chat-text-secondary)] text-sm">Loading…</p>
                </div>
            </div>
        );
    }

    if (!canAccessPlayground) return null;

    // Render
    return (
        <div className="h-screen flex bg-[var(--chat-bg-primary)] overflow-hidden">
            {/* Icon sidebar */}
            <NavSidebar
                user={user}
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
                handleSignOut={handleSignOut}
                router={router}
                handleNewChat={handleNewChat}
                handleAgentAction={handleAgentAction}
                menuAgents={MENU_AGENTS}
                // Without these the rail's "Open menu" and search buttons are dead: NavSidebar
                // calls them as `onOpenSidebar?.()`, so an unpassed prop silently no-ops rather
                // than erroring. See /chat, which passes both.
                onOpenSidebar={() => setSidebarOpen(true)}
                onOpenSearch={() => setSidebarOpen(true)}
            />

            {/* Chat history sidebar */}
            <ChatSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                sessions={mergedSessions}
                projects={projects}
                showProjects={false}
                selectedSessionId={sessionId}
                onSelectSession={handleSelectSession}
                onSelectProject={handleOpenProject}
                onNewChat={handleNewChat}
                onBoardroomClick={() => router.push("/landing?view=boardroom")}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                isLoading={isLoadingSessions}
            />

            {/* Main content */}
            <div className="lg:pl-20 flex flex-col flex-1 min-w-0 h-full transition-all duration-300 ease-in-out">
                <div
                    className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-80" : "ml-0"
                        }`}
                >
                    <MinimalHeader
                        sidebarOpen={sidebarOpen}
                        onOpenSidebar={() => setSidebarOpen(true)}
                        onNewChatInNewTab={handleNewChatInNewTab}
                    />

                    {/* Two-column layout */}
                    {isLg ? (
                        <ResizableChatPreviewLayout
                            storageKey={AI_SHEETS_PANEL_LAYOUT_KEY}
                            enabled
                            chatHeader={
                                <header className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: "rgba(34, 197, 94, 0.15)",
                                                    border: "1px solid rgba(34,197,94,0.3)",
                                                }}
                                            >
                                                <SheetIcon className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
                                                AI Sheets
                                            </span>
                                        </div>
                                        <div className="text-xs text-[var(--chat-text-muted)] truncate mt-0.5">
                                            {user?.full_name
                                                ? `Chatting as ${user.full_name}`
                                                : "Describe a spreadsheet to generate"}
                                        </div>
                                    </div>
                                </header>
                            }
                            chat={
                                isLoadingHistory && messages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
                                            <p className="text-[var(--chat-text-secondary)] text-sm">
                                                Loading conversation…
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`flex-1 flex flex-col min-h-0 h-full ${isTransitioning ? "opacity-95" : ""}`}
                                    >
                                        {messages.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 pb-20 pt-2">
                                                <div
                                                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                                    style={{
                                                        background: "rgba(34, 197, 94, 0.1)",
                                                        border: "1px solid rgba(34,197,94,0.2)",
                                                    }}
                                                >
                                                    <SheetIcon
                                                        className="w-8 h-8"
                                                        style={{ color: "#22C55E" }}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[var(--chat-text-primary)] font-semibold text-base mb-1.5">
                                                        AI Sheets
                                                    </p>
                                                    <p className="text-[var(--chat-text-muted)] text-sm max-w-[260px] leading-relaxed">
                                                        Describe the spreadsheet you need. The AI returns
                                                        structured data rendered in the spreadsheet —
                                                        with formulas, formatting, and CSV export.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 overflow-y-auto chat-scrollbar min-h-0">
                                                <div className="max-w-4xl mx-auto pb-4 px-2">
                                                    <ChatMessages
                                                        messages={messages}
                                                        onClarifySubmit={handleClarifySubmit}
                                                        onClarifySkip={handleClarifySkip}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                            composer={
                                <ChatInput
                                    onSend={handleSendMessage}
                                    isLoading={
                                        isLoading ||
                                        messages.some((m) => m.clarify?.status === "active")
                                    }
                                    animatePlaceholder={false}
                                    placeholder="Describe the spreadsheet you want to create"
                                />
                            }
                            preview={
                                <div className="flex-1 min-h-0 overflow-hidden h-full">
                                    <SpreadsheetRenderer
                                        data={sheetData}
                                        workbook={workbook}
                                        onDataChange={handleDataChange}
                                        onWorkbookChange={handleWorkbookChange}
                                        onOpenFiles={handleOpenFiles}
                                        isGenerating={isLoading}
                                        className="h-full"
                                    />
                                </div>
                            }
                        />
                    ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">

                        {/* ── LEFT: Chat panel ──────────────────────────────────────── */}
                        <div className="w-full border-b border-[var(--chat-border)] flex flex-col min-h-[50vh] bg-[var(--chat-bg-primary)]">

                            {/* Chat header */}
                            <header className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: "rgba(34, 197, 94, 0.15)",
                                                border: "1px solid rgba(34,197,94,0.3)",
                                            }}
                                        >
                                            <SheetIcon className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
                                            AI Sheets
                                        </span>
                                    </div>
                                    <div className="text-xs text-[var(--chat-text-muted)] truncate mt-0.5">
                                        {user?.full_name
                                            ? `Chatting as ${user.full_name}`
                                            : "Describe a spreadsheet to generate"}
                                    </div>
                                </div>
                            </header>

                            {/* Messages */}
                            {isLoadingHistory && messages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-8 h-8 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
                                        <p className="text-[var(--chat-text-secondary)] text-sm">
                                            Loading conversation…
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`flex-1 flex flex-col min-h-0 ${isTransitioning ? "opacity-95" : ""
                                        }`}
                                >
                                    {messages.length === 0 ? (
                                        /* Welcome state */
                                        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 pb-20 pt-2">
                                            <div
                                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                                style={{
                                                    background: "rgba(34, 197, 94, 0.1)",
                                                    border: "1px solid rgba(34,197,94,0.2)",
                                                }}
                                            >
                                                <SheetIcon
                                                    className="w-8 h-8"
                                                    style={{ color: "#22C55E" }}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[var(--chat-text-primary)] font-semibold text-base mb-1.5">
                                                    AI Sheets
                                                </p>
                                                <p className="text-[var(--chat-text-muted)] text-sm max-w-[260px] leading-relaxed">
                                                    Describe the spreadsheet you need. The AI returns
                                                    structured data rendered in the spreadsheet —
                                                    with formulas, formatting, and CSV export.
                                                </p>
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto chat-scrollbar">
                                            <div className="max-w-4xl mx-auto pb-4 px-2">
                                                <ChatMessages
                                                    messages={messages}
                                                    onClarifySubmit={handleClarifySubmit}
                                                    onClarifySkip={handleClarifySkip}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Input */}
                            <div className="fixed bottom-16 left-0 right-0 p-4 border-t border-[var(--chat-border)] bg-[var(--chat-bg-primary)] z-10">
                                {/* Mobile preview trigger */}
                                <div className="mb-3">
                                    <button
                                        onClick={() => setIsMobilePreviewOpen(true)}
                                        className="w-full flex items-center justify-between p-3 bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] rounded-xl hover:bg-[var(--chat-bg-hover)] transition-all text-left"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-[var(--chat-text-primary)]">
                                                Spreadsheet Preview
                                            </div>
                                            <div className="text-[10px] text-[var(--chat-text-muted)]">
                                                {sheetData
                                                    ? `${sheetData.rows.length} rows · ${sheetData.columns.length} cols`
                                                    : "No data yet"}
                                            </div>
                                        </div>
                                        <SheetIcon
                                            className="w-4 h-4 text-[var(--chat-text-muted)]"
                                        />
                                    </button>
                                </div>
                                <ChatInput
                                    onSend={handleSendMessage}
                                    isLoading={
                                        isLoading ||
                                        messages.some((m) => m.clarify?.status === "active")
                                    }
                                    animatePlaceholder={false}
                                    placeholder="Describe the spreadsheet you want to create"
                                />
                            </div>
                        </div>

                        <div
                            className={`
                ${isMobilePreviewOpen
                                    ? "fixed inset-0 z-[100] flex animate-in slide-in-from-bottom duration-300"
                                    : "hidden"
                                }
                flex-1 min-w-0 bg-[var(--chat-bg-primary)] flex-col min-h-0
              `}
                        >
                            {/* Spreadsheet component area */}
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <SpreadsheetRenderer
                                    data={sheetData}
                                    workbook={workbook}
                                    onDataChange={handleDataChange}
                                    onWorkbookChange={handleWorkbookChange}
                                    onOpenFiles={handleOpenFiles}
                                    isGenerating={isLoading}
                                    className="h-full"
                                />
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
}

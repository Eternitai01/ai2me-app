"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import "@/styles/chat-theme.css";
import "@/styles/chat-provider-themes.css";

import {
    ChatInput,
    ChatMessages,
    ChatSidebar,
    NavSidebar,

    MinimalHeader,
    MENU_AGENTS,
    ModelSelector,
    OutputFormatSelector,
    getModelApiId,
    getProviderFromModelId,
    type Message,
} from "@/components/chat";
import { ResizableChatPreviewLayout } from "@/components/chat/ResizableChatPreviewLayout";
import { AI_DOCS_PANEL_LAYOUT_KEY } from "@/lib/panel-layout";
import { TiptapEditor } from "@/components/editor/TiptapEditor";

import { X, Info } from "lucide-react";
const AIDocsIcon = (props: any) => (
    <svg
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

import chatHistoryService, {
    ChatSession,
    ProjectSummary,
} from "@/app/api/chatHistory";
import { usePlaygroundAccess } from "@/hooks/use-playground-access";
import { useAuth } from "@/context/AuthContext";
import { useProviderTheme } from "@/hooks/use-provider-theme";
import { extractDocumentSummary, formatSummaryForChat } from "./utils/summary-extractor";
import { stampBlocks, parseBlockOps, applyBlockOps } from "./utils/block-patch";
import { marked } from "marked";
import {
    DEFAULT_CLARIFY_INTRO,
    formatClarificationQaBlock,
    normalizeClarifyResponse,
    type ClarifyAnswer,
    type ClarifyQuestion,
    type ClarifyResponse,
} from "@/lib/clarify";
import { openWorkspaceInNewTab } from "@/lib/open-workspace-new-tab";
import {
    DEFAULT_DOCS_CONTENT_STRUCTURE,
    DEFAULT_DOCS_EXPORT_FORMAT,
    type DocsExportFormat,
} from "@/lib/ai-docs-format";

// SSE event payloads (see docs/AI_SHARED_PLUMBING.md §5, AI_DOCS.md §5)
type ConnectedEvent = { conversationId?: string; queryId?: string };
type ChunkEvent = { content?: string; conversationId?: string; queryId?: string };
type DoneEvent = { conversationId?: string; queryId?: string; provider?: string; model?: string };
type StreamErrorEvent = { message?: string; available_credits?: number; required_credits?: number };

/**
 * Persist the editor's current HTML so a reloaded session restores the user's
 * document (manual edits + last generation), not just the model's raw answer
 * (see AI_DOCS.md §7). Fire-and-forget — a failed save must never disrupt editing.
 */
async function persistDocumentHtml(sessionId: string, html: string): Promise<void> {
    if (!sessionId) return;
    try {
        await fetch(`/api/ai/docs/${sessionId}/document`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ document_html: html }),
        });
    } catch (e) {
        console.warn("Failed to persist document", e);
    }
}

export default function AIDocsPage() {
    const router = useRouter();
    const pathname = usePathname();
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
    const [editorJson, setEditorJson] = useState<any>(null);
    const [editorHtml, setEditorHtml] = useState<string>("");
    /** Live document HTML as it streams in, token by token */
    const [latestDocumentHtml, setLatestDocumentHtml] = useState<string>("");
    const streamAbortRef = useRef<AbortController | null>(null);
    // React key for the Tiptap editor. Decoupled from sessionId ON PURPOSE: a fresh session
    // gets its server id mid-stream (the `connected` event), and keying off sessionId would
    // remount the editor right then — flashing and dropping the in-progress document. This key
    // only changes on an explicit workspace switch (new chat, or loading a different session).
    const [editorKey, setEditorKey] = useState<string>("new");

    // Chat
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    // Mirror of sessionId. TiptapEditor's onUpdate closure is created once and would
    // otherwise capture a stale sessionId; reading the ref always yields the current id.
    const sessionIdRef = useRef<string>("");
    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    // Model
    const [selectedModelId, setSelectedModelId] = useState<string>("claude-sonnet-4-6");
    // Sticky for this page session (survives New Chat / session switches).
    // Not restored from conversation history; changing it does not regenerate the doc.
    const [docsExportFormat, setDocsExportFormat] = useState<DocsExportFormat>(
        DEFAULT_DOCS_EXPORT_FORMAT
    );
    const initialQueryHandledRef = useRef<string>("");
    /** Set when user explicitly clicks New chat (+ icon) so URL effect clears state instead of re-applying session_id */
    const newChatClickRef = useRef(false);
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
    const editorHtmlRef = useRef("");
    const renderedDocumentHtmlRef = useRef("");
    const { isTransitioning } = useProviderTheme(
        getProviderFromModelId(selectedModelId)
    );

    // History
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [hasLoadedSessionIndex, setHasLoadedSessionIndex] = useState(false);

    /**
     * Clear session/document/chat/loading/stream-related workspace state only.
     * Does NOT touch preferences (selectedModelId, docsExportFormat, theme, sidebar, session list).
     */
    const resetDocsWorkspace = useCallback(() => {
        if (streamAbortRef.current) {
            streamAbortRef.current.abort();
            streamAbortRef.current = null;
        }
        pendingClarifyRef.current = null;
        setSessionId("");
        setMessages([]);
        setEditorJson(null);
        setEditorHtml("");
        setLatestDocumentHtml("");
        setEditorKey(`new-${Date.now()}`);
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
                // Projects are always Web Builder sessions
                agent_id: "ai-builder",
            }));
        return [...chatSessions, ...projectSessions].sort(
            (a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }, [chatSessions, projects]);

    // Load history
    const loadChatHistory = useCallback(async (sessionIdToLoad: string) => {
        setIsLoadingHistory(true);
        try {
            const history = await chatHistoryService.getChatHistory(sessionIdToLoad);
            if (!history) {
                toast.error("Session not found.");
                return;
            }
            const loadedMessages: Message[] = history.messages.map((msg) => {
                const isAssistant = msg.type !== "outgoing";
                // Persisted answers are the model's raw HTML for AI Docs — re-derive the
                // chat summary so a reloaded session shows prose, not a wall of tags.
                // Fall back to Markdown->HTML conversion for older answers that weren't HTML.
                const hasContent = isAssistant && !!msg.text?.trim();
                let displayContent = msg.text;
                let rawHtml: string | undefined = undefined;
                if (hasContent) {
                    // An edit turn was stored as a block-op list, not a standalone document.
                    // Show a friendly summary and keep it out of the editor's rawHtml fallback
                    // (the actual document is restored from history.document_html below).
                    const ops = parseBlockOps(msg.text!);
                    if (ops) {
                        displayContent = `Updated the document (${ops.length} change${ops.length === 1 ? "" : "s"}).`;
                    } else {
                        const documentHtml = toDocumentHtml(msg.text);
                        rawHtml = documentHtml;
                        try {
                            displayContent = formatSummaryForChat(extractDocumentSummary(documentHtml));
                        } catch {
                            displayContent = documentHtml;
                        }
                    }
                }
                return {
                    id: msg.id,
                    type: isAssistant ? "assistant" : "user",
                    content: displayContent,
                    rawHtml,
                    timestamp: msg.timestamp,
                    attachments: msg.attachments as any,
                    providerName: msg.ai_metadata?.provider,
                    model: msg.ai_metadata?.model,
                } as Message;
            });
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
                        submitLabel: "Build document",
                    },
                };
                const firstUserIdx = loadedMessages.findIndex((m) => m.type === "user");
                if (firstUserIdx >= 0) {
                    loadedMessages.splice(firstUserIdx + 1, 0, clarifyMsg);
                } else {
                    loadedMessages.unshift(clarifyMsg);
                }
            }
            setMessages(loadedMessages);
            setSessionId(sessionIdToLoad);
            // Loading a different session is a real workspace switch — remount the editor
            // cleanly for it (keyed by session id, not the mid-stream `connected` assignment).
            setEditorKey(sessionIdToLoad);
            // Keep sticky docsExportFormat; never restore format from conversation history.
            // Restore the persisted document if the user previously edited it; otherwise
            // clear the live buffer so the editor falls back to the last message's HTML.
            const savedDoc = history.document_html?.trim();
            setLatestDocumentHtml(savedDoc || "");
        } catch (error) {
            console.error("Failed to load chat history:", error);
            toast.error("Failed to load chat history");
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

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

    // URL session handling (mirrors ai-chat: respect + New chat click, then sync from URL)
    useEffect(() => {
        // ?new=timestamp — force blank workspace
        const isNewRequest = searchParams.get("new");
        if (isNewRequest) {
            resetDocsWorkspace();
            router.replace("/ai-docs", { scroll: false });
            return;
        }

        // User just clicked New chat: force clear and ignore stale URL params
        if (newChatClickRef.current) {
            newChatClickRef.current = false;
            resetDocsWorkspace();
            return;
        }

        const urlSessionId = searchParams.get("session_id");

        // If no session_id in URL, ensure we're in a clean state
        if (!urlSessionId) {
            // Right after callStart, we have a sessionId but URL hasn't updated yet.
            // Sync URL instead of clearing state if we have messages.
            if (sessionId && messages.length > 0) {
                router.replace(`/ai-docs?session_id=${sessionId}`, { scroll: false });
                return;
            }

            if (sessionId) {
                resetDocsWorkspace();
            }
            return;
        }

        if (!hasLoadedSessionIndex) return;

        const sessionExists = mergedSessions.some(
            (s) => s.session_id === urlSessionId
        );
        const isCurrentActiveSession = urlSessionId === sessionId;

        if (!sessionExists && !isCurrentActiveSession) {
            resetDocsWorkspace();
            router.replace("/ai-docs");
            return;
        }

        if (urlSessionId !== sessionId) {
            loadChatHistory(urlSessionId);
        }
    }, [searchParams, sessionId, messages.length, loadChatHistory, mergedSessions, router, hasLoadedSessionIndex, resetDocsWorkspace]);

    // Session / navigation handlers (same pattern as ai-chat: ref + clear state + replace URL)
    const handleNewChat = () => {
        newChatClickRef.current = true;
        resetDocsWorkspace();
        const target = pathname && pathname.startsWith("/ai-docs") ? pathname : "/ai-docs";
        if (typeof window !== "undefined") {
            window.history.replaceState(null, "", target);
        }
        router.replace(target);
        router.refresh();
    };

    const handleNewChatInNewTab = () => {
        openWorkspaceInNewTab("/ai-docs");
    };

    const handleSelectSession = (sessionIdToLoad: string, agentId?: string | null) => {
        if (agentId === "ai-builder") {
            router.push(`/project/${sessionIdToLoad}?agent_id=ai-builder`);
            return;
        }

        if (agentId === "ai-sheets") {
            router.push(`/ai-sheets?session_id=${sessionIdToLoad}`);
            return;
        }

        if (agentId === "ai-docs") {
            router.replace(`/ai-docs?session_id=${sessionIdToLoad}`);
            loadChatHistory(sessionIdToLoad);
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
            router.push("/ai-sheets");
            return;
        }
        if (agentName === "AI Docs") {
            router.push("/ai-docs?new=" + Date.now());
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

    // AI Docs: the model is instructed to make the FIRST character "<" for HTML; a Markdown
    // reply starts with "#" or plain text. Key off the leading character, NOT "contains < and >
    // anywhere" — otherwise a Markdown document that merely happens to include angle brackets
    // (comparison operators like "latency < 200ms", code fences, diagrams) is mistaken for HTML
    // partway through the stream, so toDocumentHtml stops converting and the editor suddenly
    // shows raw Markdown. Leading-char detection stays stable from the first token to the last.
    const looksLikeDocumentHtml = useCallback((value?: string | null) => {
        if (!value) return false;
        return value.trim().startsWith("<");
    }, []);

    // Some models (e.g. Bedrock Claude Sonnet) don't reliably follow the
    // "HTML only" instruction and reply in Markdown instead. Rather than leave
    // the editor blank, convert Markdown -> HTML so the document always renders.
    const toDocumentHtml = useCallback((value?: string | null): string => {
        if (!value) return "";
        if (looksLikeDocumentHtml(value)) return value;
        try {
            const result = marked.parse(value, { async: false });
            return typeof result === "string" ? result : value;
        } catch {
            return value;
        }
    }, [looksLikeDocumentHtml]);

    // Prefer the live stream; fall back to the last good message's rawHtml.
    // The !isError filter matters: without it, a failed turn wipes a good document off the screen.
    const renderedDocumentHtml = useMemo(() => {
        if (latestDocumentHtml) return toDocumentHtml(latestDocumentHtml);

        const latestAssistantHtml = [...messages]
            .reverse()
            .find((m) => m.type === "assistant" && !m.isLoading && !m.isError && m.rawHtml)
            ?.rawHtml;

        return latestAssistantHtml || "";
    }, [messages, latestDocumentHtml, toDocumentHtml]);

    editorHtmlRef.current = editorHtml;
    renderedDocumentHtmlRef.current = renderedDocumentHtml;

    const handleEditorChange = (json: any) => {
        setEditorJson(json);
    };

    const handleAutoSave = async (_json: any, html: string) => {
        setEditorHtml(html);
        // Persist manual edits so they survive a reload. Debounced upstream in TiptapEditor.
        // Read the ref (not the closed-over sessionId) so a late edit still targets the right session.
        const currentSessionId = sessionIdRef.current;
        if (currentSessionId) {
            void persistDocumentHtml(currentSessionId, html);
        }
    };

    /**
     * Hand-rolled SSE reader (not a generic hook — the event vocabulary here is
     * AI Docs specific: connected/chunk/done/stream_error). Streams the model's
     * HTML straight into the editor, then on `done` splits the result into a
     * prose summary (chat bubble) + raw HTML (editor), per AI_DOCS.md §7.
     */
    const streamDocsResponse = useCallback(
        async (
            endpoint: string,
            body: Record<string, unknown>,
            loadingMessageId: string,
            // Present for edits: the stamped (data-bid) current document to patch against.
            // When set, the model may reply with a block-op list instead of full HTML.
            editContextHtml?: string,
        ) => {
            // A new send always supersedes any still-running stream
            streamAbortRef.current?.abort();
            const controller = new AbortController();
            streamAbortRef.current = controller;

            let streamedHtml = "";
            let doneReceived = false;
            let providerName = "";
            let modelName = "";
            // For a continue this is known upfront; for a start it's filled in by the `connected` event.
            let activeSessionId = typeof body.session_id === "string" ? (body.session_id as string) : "";

            // Streaming emits many tokens/sec. Pushing each into the editor re-sanitizes and
            // rebuilds the entire Tiptap document every token — O(n²) that janks large docs.
            // Coalesce editor updates to at most one per interval; the trailing timer plus the
            // explicit flush on done/close guarantee the final content always lands.
            const STREAM_RENDER_INTERVAL_MS = 120;
            let lastRenderAt = 0;
            let pendingRenderTimer: ReturnType<typeof setTimeout> | null = null;

            // "html" streams live into the editor (fresh docs, or full rewrites). "ops" accumulates
            // a block-op list silently and applies it on `done`. Only edits may be "ops"; a fresh
            // document (no editContextHtml) always renders as HTML.
            // Held in an object: the mode is mutated inside the nested applyEvent closure, and a
            // plain `let` would be narrowed by control-flow analysis so outer `=== "ops"` checks
            // look impossible to the type checker.
            const streamState: { mode: "unknown" | "html" | "ops" } = {
                mode: editContextHtml ? "unknown" : "html",
            };

            const flushRender = () => {
                pendingRenderTimer = null;
                if (controller.signal.aborted) return; // superseded by a newer send
                lastRenderAt = Date.now();
                setLatestDocumentHtml(streamedHtml);
            };

            // Throttled (leading + trailing): render now if the interval has elapsed, else queue one.
            const scheduleRender = () => {
                if (pendingRenderTimer) return; // a trailing render is already queued
                const elapsed = Date.now() - lastRenderAt;
                if (elapsed >= STREAM_RENDER_INTERVAL_MS) flushRender();
                else pendingRenderTimer = setTimeout(flushRender, STREAM_RENDER_INTERVAL_MS - elapsed);
            };

            // Force the final/complete document to render immediately (bypasses the throttle).
            const flushRenderNow = () => {
                if (pendingRenderTimer) {
                    clearTimeout(pendingRenderTimer);
                    pendingRenderTimer = null;
                }
                if (controller.signal.aborted) return;
                lastRenderAt = Date.now();
                setLatestDocumentHtml(streamedHtml);
            };

            const finalizeAssistantMessage = (html: string, summaryOverride?: string) => {
                if (!html || !html.trim()) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === loadingMessageId
                                ? { ...msg, content: "No response received", rawHtml: undefined, providerName, model: modelName, isLoading: false, isError: false }
                                : msg
                        )
                    );
                    return;
                }

                // Fall back to Markdown->HTML conversion if the model didn't return raw HTML
                const documentHtml = toDocumentHtml(html);
                let displayContent: string;
                if (summaryOverride) {
                    displayContent = summaryOverride;
                } else {
                    try {
                        displayContent = formatSummaryForChat(extractDocumentSummary(documentHtml));
                    } catch {
                        displayContent = documentHtml;
                    }
                }

                // Sync the editor-context mirror to the finalized document so the NEXT edit
                // sends this version (not a stale value) as its patch source. Manual edits
                // update editorHtml via autosave; programmatic setContent does not, so we must.
                setEditorHtml(documentHtml);

                // Keep the persisted document in sync with the freshly generated one, so a
                // reload restores this answer (and later manual edits overwrite it in place).
                if (activeSessionId && documentHtml.trim()) {
                    void persistDocumentHtml(activeSessionId, documentHtml);
                }

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === loadingMessageId
                            ? {
                                ...msg,
                                content: displayContent,
                                rawHtml: documentHtml,
                                providerName,
                                model: modelName,
                                isLoading: false,
                                isError: false,
                            }
                            : msg
                    )
                );
            };

            // Turn the loading bubble into an error without wiping the current document.
            const finalizeAsError = (message: string) => {
                toast.error(message);
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === loadingMessageId
                            ? { ...msg, content: message, isError: true, isLoading: false }
                            : msg
                    )
                );
            };

            // Edit path: parse the block-op list and patch the stamped source document.
            // Falls back gracefully to a full-document replacement, or to an error that
            // leaves the existing document untouched.
            const handleOpsDone = () => {
                const ops = editContextHtml ? parseBlockOps(streamedHtml) : null;
                if (ops && editContextHtml) {
                    let finalHtml: string;
                    try {
                        finalHtml = applyBlockOps(editContextHtml, ops);
                    } catch {
                        finalizeAsError("Couldn't apply the edit. Please try again.");
                        return;
                    }
                    // Push the patched document into the editor and persist it.
                    if (!controller.signal.aborted) setLatestDocumentHtml(finalHtml);
                    const summary = `Updated the document (${ops.length} change${ops.length === 1 ? "" : "s"}).`;
                    finalizeAssistantMessage(finalHtml, summary);
                    return;
                }

                // Not a valid op list — the model may have returned a full document after all.
                if (looksLikeDocumentHtml(streamedHtml)) {
                    flushRenderNow();
                    finalizeAssistantMessage(streamedHtml);
                    return;
                }

                finalizeAsError("Couldn't apply the edit. Please try again.");
            };

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(body),
                    signal: controller.signal,
                });

                if (!response.ok || !response.body) {
                    let detail = "Failed to generate document";
                    try {
                        const errJson = await response.json();
                        detail = errJson?.detail || detail;
                    } catch {
                        // ignore — non-JSON error body
                    }
                    throw new Error(detail);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let buffer = "";
                let eventName = "message";
                let dataLines: string[] = [];

                const applyEvent = (name: string, eventData: any) => {
                    if (name === "connected") {
                        const evt = eventData as ConnectedEvent;
                        if (evt.conversationId) {
                            activeSessionId = evt.conversationId;
                            setSessionId(evt.conversationId);
                            router.replace(`/ai-docs?session_id=${evt.conversationId}`, { scroll: false });
                        }
                        return;
                    }
                    if (name === "chunk") {
                        const piece = typeof (eventData as ChunkEvent).content === "string" ? (eventData as ChunkEvent).content! : "";
                        if (!piece) return;
                        streamedHtml += piece;
                        // Decide once, from the first non-whitespace char, whether this is a live
                        // HTML document or a block-op list to apply on done.
                        if (streamState.mode === "unknown") {
                            const firstChar = streamedHtml.replace(/^\s+/, "").charAt(0);
                            if (firstChar === "<") streamState.mode = "html";
                            else if (firstChar === "[" || firstChar === "{" || firstChar === "`") streamState.mode = "ops";
                        }
                        // Only stream HTML into the editor; ops accumulate silently until `done`.
                        if (streamState.mode === "html") scheduleRender();
                        return;
                    }
                    if (name === "done") {
                        doneReceived = true;
                        const evt = eventData as DoneEvent;
                        providerName = evt.provider || providerName;
                        modelName = evt.model || modelName;
                        if (streamState.mode === "ops") {
                            handleOpsDone(); // parse the op list and patch the document
                        } else {
                            flushRenderNow(); // ensure the complete document is on screen before we finalize
                            finalizeAssistantMessage(streamedHtml);
                        }
                        return;
                    }
                    if (name === "stream_error") {
                        const evt = eventData as StreamErrorEvent;
                        throw new Error(evt.message || "Failed to generate document");
                    }
                };

                const flushEvent = () => {
                    if (dataLines.length === 0) {
                        eventName = "message";
                        return;
                    }
                    const raw = dataLines.join("\n");
                    dataLines = [];
                    let payload: any = {};
                    try {
                        payload = JSON.parse(raw);
                    } catch {
                        payload = {};
                    }
                    const name = eventName;
                    eventName = "message";
                    applyEvent(name, payload);
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || ""; // keep the partial trailing line for the next read()

                    for (const line of lines) {
                        if (line.startsWith(":")) continue; // heartbeat comment
                        if (line.startsWith("event:")) { eventName = line.slice(6).trim(); continue; }
                        if (line.startsWith("data:")) { dataLines.push(line.slice(5).trim()); continue; }
                        if (line.trim() === "") flushEvent(); // blank line = end of frame
                    }
                }
                flushEvent();

                if (!doneReceived) {
                    // Connection ended before `done` — keep whatever content arrived rather than losing it
                    if (streamState.mode === "ops") {
                        handleOpsDone(); // may fall back / error if the op list is incomplete
                    } else if (streamedHtml) {
                        flushRenderNow(); // any throttled tail render must land before we finalize
                        finalizeAssistantMessage(streamedHtml);
                    } else throw new Error("No response received");
                }

                await loadChatSessions();
                await loadProjects();
            } catch (e: unknown) {
                if ((e as Error)?.name === "AbortError") return; // superseded by a newer send, not a real failure
                const err = e as Error;
                toast.error(err.message || "Failed to send message");
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === loadingMessageId
                            ? {
                                ...msg,
                                content: err.message?.includes?.("redit")
                                    ? "⚠️ You've run out of credits. Please top up to continue."
                                    : (err.message && err.message !== "Failed to send message" ? err.message : "Unable to generate a response. Please try again."),
                                isError: true,
                                isLoading: false,
                            }
                            : msg
                    )
                );
            } finally {
                // Drop any queued trailing render so it can't fire after the stream is over.
                if (pendingRenderTimer) {
                    clearTimeout(pendingRenderTimer);
                    pendingRenderTimer = null;
                }
                setIsLoading(false);
                if (streamAbortRef.current === controller) streamAbortRef.current = null;
            }
        },
        [router, looksLikeDocumentHtml, loadChatSessions, loadProjects]
    );

    // API: start new session — the create-vs-edit document prompt lives server-side,
    // gated on agent_id == "ai-docs" (see enhanced_routing_service._get_ai_docs_instructions)
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

            const effectiveModelId = modelIdOverride || selectedModelId;
            const preferredProvider = getProviderFromModelId(effectiveModelId);
            const preferredModel = getModelApiId(effectiveModelId);
            const isAuto = effectiveModelId === "auto";
            // When user selects AUTO LLM (ai2me/auto), route explicitly to Bedrock Claude Sonnet
            const resolvedPreferredProvider =
                preferredProvider === "AI2me" || preferredProvider === "auto"
                    ? "aws_bedrock"
                    : preferredProvider;
            const resolvedPreferredModel = isAuto
                ? "eu.anthropic.claude-sonnet-4-6"
                : preferredModel === "auto"
                    ? ""
                    : preferredModel;

            await streamDocsResponse(
                "/api/ai/docs/start/stream",
                {
                    question,
                    connector_ids: [],
                    additional_content: additionalContent,
                    session_metadata: { agent_id: "ai-docs" },
                    preferences: {
                        cost_sensitivity: "medium",
                        quality_priority: "balanced",
                        response_time: "",
                        preferred_provider: resolvedPreferredProvider,
                        preferred_model: resolvedPreferredModel,
                    },
                    attachments,
                    instant_response: false,
                    clarification_qa_text: options?.clarificationQaText || undefined,
                    clarification_payload: options?.clarificationPayload || undefined,
                    docs_content_structure: DEFAULT_DOCS_CONTENT_STRUCTURE,
                    docs_export_format: docsExportFormat,
                },
                loadingMessageId
            );
        },
        [selectedModelId, streamDocsResponse, docsExportFormat]
    );

    // API: continue existing session — sends the editor's current HTML so the model
    // edits it in place instead of overwriting the user's manual changes (AI_DOCS.md §8)
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
            if (!sessionId) {
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

            const effectiveModelId = modelIdOverride || selectedModelId;
            const preferredProvider = getProviderFromModelId(effectiveModelId);
            const preferredModel = getModelApiId(effectiveModelId);
            const isAuto = effectiveModelId === "auto";
            // When user selects AUTO LLM (ai2me/auto), route explicitly to Bedrock Claude Sonnet
            const resolvedPreferredProvider =
                preferredProvider === "AI2me" || preferredProvider === "auto"
                    ? "aws_bedrock"
                    : preferredProvider;
            const resolvedPreferredModel = isAuto
                ? "eu.anthropic.claude-sonnet-4-6"
                : preferredModel === "auto"
                    ? ""
                    : preferredModel;

            const contextDocumentHtml = editorHtml.trim() || renderedDocumentHtml;
            // Stamp top-level blocks with data-bid so the model can return a scoped block-op
            // list instead of the whole document. The same stamped HTML is the patch source.
            const stampedContext = contextDocumentHtml ? stampBlocks(contextDocumentHtml) : "";

            await streamDocsResponse(
                "/api/ai/docs/continue/stream",
                {
                    session_id: sessionId,
                    question,
                    additional_content: additionalContent,
                    current_document_html: stampedContext || undefined,
                    preferences: {
                        cost_sensitivity: "medium",
                        quality_priority: "balanced",
                        response_time: "",
                        preferred_provider: resolvedPreferredProvider,
                        preferred_model: resolvedPreferredModel,
                    },
                    attachments,
                    instant_response: false,
                    clarification_qa_text: options?.clarificationQaText || undefined,
                    clarification_payload: options?.clarificationPayload || undefined,
                    docs_content_structure: DEFAULT_DOCS_CONTENT_STRUCTURE,
                    docs_export_format: docsExportFormat,
                },
                loadingMessageId,
                stampedContext || undefined,
            );
        },
        [callStart, selectedModelId, sessionId, streamDocsResponse, editorHtml, renderedDocumentHtml, docsExportFormat]
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
            if (sessionId) {
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
                                  submitLabel: "Build document",
                              },
                          }
                        : m
                )
            );
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
        async (message: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string; url?: string }[]) => {
            const userMsgId = crypto.randomUUID();
            const loadingMsgId = crypto.randomUUID();
            const isFollowUp = Boolean(sessionId);

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
                const html = (editorHtmlRef.current || renderedDocumentHtmlRef.current || "").trim();
                let summary: string | null = null;
                if (html) {
                    try {
                        summary = formatSummaryForChat(extractDocumentSummary(html)).slice(0, 1500);
                    } catch {
                        summary = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800);
                    }
                }
                const res = await fetch("/api/ai/clarify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        question: message,
                        agent_id: "ai-docs",
                        session_id: sessionId || null,
                        is_follow_up: isFollowUp,
                        current_context_summary: summary,
                    }),
                });
                if (res.ok) {
                    const raw = await res.json();
                    clarify = normalizeClarifyResponse(raw);
                }
            } catch (e) {
                console.warn("docs clarify failed; falling back to generate", e);
            }

            if (clarify && !clarify.sufficient && clarify.questions.length > 0) {
                pendingClarifyRef.current = {
                    question: message,
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
                                      submitLabel: "Build document",
                                  },
                              }
                            : m
                    )
                );
                setIsLoading(false);
                return;
            }

            await (isFollowUp ? callContinue : callStart)(
                message,
                undefined,
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
                            storageKey={AI_DOCS_PANEL_LAYOUT_KEY}
                            enabled
                            chatHeader={
                                <header className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: "rgba(59, 130, 246, 0.15)",
                                                    border: "1px solid rgba(59,130,246,0.3)",
                                                }}
                                            >
                                                <AIDocsIcon className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
                                                AI Docs
                                            </span>
                                        </div>
                                        <div className="text-xs text-[var(--chat-text-muted)] truncate mt-0.5">
                                            {user?.full_name
                                                ? `Chatting as ${user.full_name}`
                                                : "Describe a document to generate"}
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
                                            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 pb-20 pt-2 overflow-y-auto">
                                                <div
                                                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                                    style={{
                                                        background: "rgba(59, 130, 246, 0.1)",
                                                        border: "1px solid rgba(59,130,246,0.2)",
                                                    }}
                                                >
                                                    <AIDocsIcon className="w-8 h-8" style={{ color: "#3B82F6" }} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[var(--chat-text-primary)] font-semibold text-base mb-1.5">
                                                        AI Docs
                                                    </p>
                                                    <p className="text-[var(--chat-text-muted)] text-sm max-w-[260px] leading-relaxed">
                                                        Describe the document you need. The AI returns
                                                        structured HTML rendered directly in the editor.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 text-xs text-[var(--chat-text-muted)] w-full max-w-[260px]">
                                                    {[
                                                        "Write a project proposal for a new AI tool",
                                                        "Draft a technical specification document",
                                                        "Create a user manual for a mobile app",
                                                        "Generate a blog post about web design",
                                                    ].map((hint) => (
                                                        <button
                                                            key={hint}
                                                            onClick={() => handleSendMessage(hint)}
                                                            className="px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] text-left hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)] transition-colors"
                                                        >
                                                            {hint}
                                                        </button>
                                                    ))}
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
                                <>
                                    <OutputFormatSelector
                                        exportFormat={docsExportFormat}
                                        onExportChange={setDocsExportFormat}
                                        disabled={isLoading}
                                    />
                                    <ChatInput
                                        onSend={handleSendMessage}
                                        isLoading={isLoading}
                                        animatePlaceholder={false}
                                        placeholder="Describe the document you want to create...."
                                        modelSelector={
                                            <ModelSelector
                                                selectedModelId={selectedModelId}
                                                onModelChange={(modelId) => setSelectedModelId(modelId)}
                                                autoOnly={false}
                                            />
                                        }
                                    />
                                </>
                            }
                            preview={
                                <div className="flex-1 flex flex-col min-h-0 h-full bg-[var(--chat-bg-secondary)]">
                                    <header className="h-14 border-b border-[var(--chat-border)] bg-[var(--chat-bg-primary)] flex items-center justify-between px-6 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[var(--chat-bg-tertiary)] rounded-lg border border-[var(--chat-border)]">
                                                <AIDocsIcon className="w-4 h-4 text-[var(--chat-text-primary)]" />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-bold text-[var(--chat-text-primary)] tracking-tight" />
                                                <p className="text-[10px] text-[var(--chat-text-muted)] font-medium uppercase tracking-wider">
                                                    Rich Text Editor
                                                </p>
                                            </div>
                                        </div>
                                    </header>
                                    <div className="flex-1 overflow-hidden min-h-0">
                                        <TiptapEditor
                                            key={editorKey}
                                            content={renderedDocumentHtml}
                                            onChange={handleEditorChange}
                                            onAutoSave={handleAutoSave}
                                            exportFormat={docsExportFormat}
                                        />
                                    </div>
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
                                                background: "rgba(59, 130, 246, 0.15)",
                                                border: "1px solid rgba(59,130,246,0.3)",
                                            }}
                                        >
                                            <AIDocsIcon className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
                                            AI Docs
                                        </span>
                                    </div>
                                    <div className="text-xs text-[var(--chat-text-muted)] truncate mt-0.5">
                                        {user?.full_name
                                            ? `Chatting as ${user.full_name}`
                                            : "Describe a document to generate"}
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
                                                    background: "rgba(59, 130, 246, 0.1)",
                                                    border: "1px solid rgba(59,130,246,0.2)",
                                                }}
                                            >
                                                <AIDocsIcon
                                                    className="w-8 h-8"
                                                    style={{ color: "#3B82F6" }}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[var(--chat-text-primary)] font-semibold text-base mb-1.5">
                                                    AI Docs
                                                </p>
                                                <p className="text-[var(--chat-text-muted)] text-sm max-w-[260px] leading-relaxed">
                                                    Describe the document you need. The AI returns
                                                    structured HTML rendered directly in the editor.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 text-xs text-[var(--chat-text-muted)] w-full max-w-[260px]">
                                                {[
                                                    "Write a project proposal for a new AI tool",
                                                    "Draft a technical specification document",
                                                    "Create a user manual for a mobile app",
                                                    "Generate a blog post about web design",
                                                ].map((hint) => (
                                                    <button
                                                        key={hint}
                                                        onClick={() => handleSendMessage(hint)}
                                                        className="px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] text-left hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)] transition-colors"
                                                    >
                                                        {hint}
                                                    </button>
                                                ))}
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
                                                Document Editor
                                            </div>
                                            <div className="text-[10px] text-[var(--chat-text-muted)]">
                                                Live AI Generation & Editing
                                            </div>
                                        </div>
                                        <Info className="w-4 h-4 text-[var(--chat-text-muted)]" />
                                    </button>
                                </div>

                                <OutputFormatSelector
                                    exportFormat={docsExportFormat}
                                    onExportChange={setDocsExportFormat}
                                    disabled={isLoading}
                                />

                                <ChatInput
                                    onSend={handleSendMessage}
                                    isLoading={isLoading}
                                    animatePlaceholder={false}
                                    placeholder="Describe the document you want to create...."
                                    modelSelector={
                                        <ModelSelector
                                            selectedModelId={selectedModelId}
                                            onModelChange={(modelId) => setSelectedModelId(modelId)}
                                            autoOnly={false}
                                        />
                                    }
                                />
                            </div>
                        </div>

                        {/* Mobile preview overlay */}
                        {isMobilePreviewOpen && (
                            <div className="fixed inset-0 z-[100] bg-[var(--chat-bg-primary)] flex flex-col">
                                <header className="h-14 border-b border-[var(--chat-border)] flex items-center justify-between px-4 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <AIDocsIcon className="w-4 h-4 text-[var(--chat-accent)]" />
                                        <span className="text-sm font-bold">Document Editor</span>
                                    </div>
                                    <button
                                        onClick={() => setIsMobilePreviewOpen(false)}
                                        className="p-2 hover:bg-[var(--chat-bg-secondary)] rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </header>
                                <div className="flex-1 overflow-hidden">
                                    <TiptapEditor
                                        key={editorKey}
                                        content={renderedDocumentHtml}
                                        onChange={handleEditorChange}
                                        onAutoSave={handleAutoSave}
                                        exportFormat={docsExportFormat}
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                    )}
                </div>
            </div>
        </div>
    );
}

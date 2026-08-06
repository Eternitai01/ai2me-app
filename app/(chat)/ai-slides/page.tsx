"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    getModelApiId,
    getProviderFromModelId,
    type Message,
} from "@/components/chat";
import { ResizableChatPreviewLayout } from "@/components/chat/ResizableChatPreviewLayout";
import { AI_SLIDES_PANEL_LAYOUT_KEY } from "@/lib/panel-layout";
import { SlideViewer } from "@/components/slides/SlideViewer";
import { SlideEditorModal } from "@/components/slides/SlideEditorModal";
import { ExportModal } from "@/components/slides/ExportModal";
import { TemplateGallery, TemplatePreviewModal, SLIDE_TEMPLATES, type SlideTemplate } from "@/components/slides/TemplateGallery";

import { X, Info, Download, ChevronDown } from "lucide-react";

const TEMPLATE_STORAGE_KEY = "ai-slides:last-template-id";
const AI_RECOMMENDED_STORAGE_ID = "ai-recommended";

function readStoredSlideTemplate(): SlideTemplate | null {
    if (typeof window === "undefined") return null;
    try {
        const id = localStorage.getItem(TEMPLATE_STORAGE_KEY);
        if (!id || id === AI_RECOMMENDED_STORAGE_ID) return null;
        return SLIDE_TEMPLATES.find((t) => t.id === id) ?? null;
    } catch {
        return null;
    }
}

function writeStoredSlideTemplate(template: SlideTemplate | null) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(
            TEMPLATE_STORAGE_KEY,
            template?.id ?? AI_RECOMMENDED_STORAGE_ID
        );
    } catch {
        /* ignore quota / private mode */
    }
}
const AISlidesIcon = (props: any) => (
    <svg
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

import chatHistoryService, {
    ChatSession,
    ProjectSummary,
} from "@/app/api/chatHistory";
import { usePlaygroundAccess } from "@/hooks/use-playground-access";
import { useAuth } from "@/context/AuthContext";
import { useProviderTheme } from "@/hooks/use-provider-theme";
import {
    DEFAULT_CLARIFY_INTRO,
    formatClarificationQaBlock,
    normalizeClarifyResponse,
    type ClarifyAnswer,
    type ClarifyQuestion,
    type ClarifyResponse,
} from "@/lib/clarify";
import { openWorkspaceInNewTab } from "@/lib/open-workspace-new-tab";

// API types
type StartResponse = {
    session_id: string;
    ai_response?: string;
    ai_provider?: {
        provider_name?: string;
        model?: string;
        model_name?: string;
    };
    provider_name?: string;
    model?: string;
    provider?: string;
    detail?: string;
    response_type?: string;
    message?: string;
};

type ContinueResponse = {
    session_id: string;
    answer?: string;
    ai_provider?: {
        provider_name?: string;
        model?: string;
        model_name?: string;
    };
    provider_name?: string;
    model?: string;
    provider?: string;
    detail?: string;
    status?: string;
};

// The slides system prompt is server-owned: EnhancedRoutingService._get_slide_outline_instructions
// / _get_slide_single_instructions, selected by slide_generation_phase. A client-side copy used to
// live here and shipped on every request asking for { slideNumber, html } while the server asked
// for { slide_number, html_content } — two contradictory schemas reaching the model at once,
// surviving only because _normalize_slide_item happens to accept both spellings. Send the user's
// own content only; the server owns the prompt.
const buildAdditionalContent = (
    additionalContent?: string | Record<string, unknown>
): string | undefined => {
    if (typeof additionalContent === "string") return additionalContent || undefined;
    if (additionalContent && Object.keys(additionalContent).length > 0) {
        return JSON.stringify(additionalContent);
    }
    return undefined;
};

/**
 * Identity of a deck, for skipping no-op state updates while polling.
 *
 * The poll refetches every 2s; without this, every tick would hand React a brand-new
 * array and re-render the viewer for nothing. id+updated_at is enough: generation only
 * ever appends rows (new ids), and an edit via PUT bumps updated_at.
 */
const slidesSignature = (slides: { id?: string; updated_at?: string }[]): string =>
    slides.map((s) => `${s.id}:${s.updated_at ?? ""}`).join("|");

export default function AISlidesPage() {
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
    const [editorJson, setEditorJson] = useState<any>(null);
    const [editorHtml, setEditorHtml] = useState<string>("");
    const [slides, setSlides] = useState<any[]>([]);
    const [isEditingHtml, setIsEditingHtml] = useState(false);
    const [activeSlideForEdit, setActiveSlideForEdit] = useState<any>(null);

    // Chat
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<SlideTemplate | null>(null);
    const [templatePrefHydrated, setTemplatePrefHydrated] = useState(false);
    const [previewingTemplate, setPreviewingTemplate] = useState<SlideTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Model
    const [selectedModelId, setSelectedModelId] = useState<string>("claude-sonnet-4-6");
    // Scroll state — left chat panel + right slides panel
    const leftPanelRef  = useRef<HTMLDivElement>(null);
    const templateSectionRef = useRef<HTMLDivElement>(null);
    const pageScrollRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);
    const [showLeftScrollBtn,  setShowLeftScrollBtn]  = useState(false);
    const [showRightScrollBtn, setShowRightScrollBtn] = useState(false);
    const initialQueryHandledRef = useRef<string>("");
    const skipClearAfterStartRef = useRef(false);
    const slidesRef = useRef<any[]>([]);
    slidesRef.current = slides;
    /** Prompt held while the clarify stepper is open (submit/skip then generate). */
    const pendingClarifyRef = useRef<{
        question: string;
        modelIdOverride?: string;
        additionalContent?: string | Record<string, unknown>;
        attachments?: { name: string; type?: string }[];
        userMsgId: string;
        loadingMsgId: string;
        questions: ClarifyQuestion[];
        intro?: string | null;
    } | null>(null);
    // pollForContent reschedules itself with setTimeout, so without these it keeps running
    // after unmount or after a new generation starts — writing a stale session's messages
    // over the current one. The token lets an in-flight poll notice it's been superseded.
    const pollTokenRef = useRef<{ cancelled: boolean } | null>(null);
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelActivePoll = useCallback(() => {
        if (pollTokenRef.current) pollTokenRef.current.cancelled = true;
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
    }, []);

    // Stop polling when the page unmounts.
    useEffect(() => cancelActivePoll, [cancelActivePoll]);

    // Auto-scroll left panel to bottom whenever messages load/update
    useEffect(() => {
        if (!leftPanelRef.current || messages.length === 0) return;
        const el = leftPanelRef.current;
        el.scrollTop = el.scrollHeight;
    }, [messages]);

    // Scroll-button visibility listeners
    useEffect(() => {
        const el = leftPanelRef.current;
        if (!el) return;
        const onScroll = () => {
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setShowLeftScrollBtn(distFromBottom > 80);
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const el = rightPanelRef.current;
        if (!el) return;
        const onScroll = () => {
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setShowRightScrollBtn(distFromBottom > 80);
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        // Show button initially if content overflows
        onScroll();
        return () => el.removeEventListener("scroll", onScroll);
    }, [slides]);
    const { isTransitioning } = useProviderTheme(
        getProviderFromModelId(selectedModelId)
    );

    // History
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [hasLoadedSessionIndex, setHasLoadedSessionIndex] = useState(false);
    /** Set when user clicks Sidebar New Chat so URL effect clears without re-attaching session. */
    const newChatClickRef = useRef(false);

    /**
     * Clear session/slides/chat/loading/poll-related workspace state only.
     * Keeps selectedTemplate (persisted preference for the next blank chat).
     */
    const resetSlidesWorkspace = useCallback(() => {
        cancelActivePoll();
        pendingClarifyRef.current = null;
        skipClearAfterStartRef.current = false;
        setSessionId("");
        setMessages([]);
        setSlides([]);
        setEditorJson(null);
        setEditorHtml("");
        setActiveSlideForEdit(null);
        setIsEditingHtml(false);
        setShowExportModal(false);
        setPreviewingTemplate(null);
        setIsLoading(false);
        setIsLoadingHistory(false);
        setIsMobilePreviewOpen(false);
    }, [cancelActivePoll]);

    // Hydrate last template preference (client-only)
    useEffect(() => {
        setSelectedTemplate(readStoredSlideTemplate());
        setTemplatePrefHydrated(true);
    }, []);

    // Persist selection (including AI Recommended / clear)
    useEffect(() => {
        if (!templatePrefHydrated) return;
        writeStoredSlideTemplate(selectedTemplate);
    }, [selectedTemplate, templatePrefHydrated]);

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
                // Projects are always AI Developer sessions
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
            const loadedMessages: Message[] = history.messages.map((msg) => ({
                id: msg.id,
                type: msg.type === "outgoing" ? "user" : "assistant",
                content: msg.text,
                timestamp: msg.timestamp,
                providerName: msg.ai_metadata?.provider,
                model: msg.ai_metadata?.model,
            }));
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
                        submitLabel: "Build presentation",
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
            fetchSlides(sessionIdToLoad);
        } catch (error) {
            console.error("Failed to load chat history:", error);
            toast.error("Failed to load chat history");
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    // Mount — wait for auth before fetching sessions
    useEffect(() => {
        if (!isAuthenticated) return;   // auth not ready yet — will re-run when it is
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
        // ?new=timestamp — force blank workspace
        const isNewRequest = searchParams.get("new");
        if (isNewRequest) {
            resetSlidesWorkspace();
            router.replace("/ai-slides", { scroll: false });
            return;
        }

        if (newChatClickRef.current) {
            newChatClickRef.current = false;
            resetSlidesWorkspace();
            return;
        }

        const urlSessionId = searchParams.get("session_id");

        // If no session_id in URL, ensure we're in a clean state
        if (!urlSessionId) {
            if (sessionId && skipClearAfterStartRef.current) {
                skipClearAfterStartRef.current = false;
                return;
            }
            if (sessionId) {
                resetSlidesWorkspace();
            }
            return;
        }

        if (!hasLoadedSessionIndex) return;

        const sessionExists = mergedSessions.some(
            (s) => s.session_id === urlSessionId
        );
        const isCurrentActiveSession = urlSessionId === sessionId;

        if (!sessionExists && !isCurrentActiveSession) {
            resetSlidesWorkspace();
            router.replace("/ai-slides");
            return;
        }

        if (urlSessionId !== sessionId) {
            loadChatHistory(urlSessionId);
        }
    }, [searchParams, sessionId, loadChatHistory, mergedSessions, router, hasLoadedSessionIndex, resetSlidesWorkspace]);

    // Session / navigation handlers
    const handleNewChat = () => {
        newChatClickRef.current = true;
        resetSlidesWorkspace();
        router.replace("/ai-slides");
    };

    const handleNewChatInNewTab = () => {
        openWorkspaceInNewTab("/ai-slides");
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
            router.push(`/ai-docs?session_id=${sessionIdToLoad}`);
            return;
        }

        if (agentId === "ai-slides") {
            // Don't call loadChatHistory here: the URL effect fires on the session_id change
            // and loads it. Doing both raced two history fetches and two fetchSlides calls.
            router.replace(`/ai-slides?session_id=${sessionIdToLoad}`);
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

    const handleExportPresentation = async () => {
        if (!sessionId) {
            toast.error("Generate a presentation first before exporting.");
            return;
        }

        try {
            const response = await fetch(`/api/ai/slides/sessions/${sessionId}/export-pptx`, {
                method: "POST",
            });

            if (!response.ok) {
                toast.error("Failed to export presentation.");
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `slides-${sessionId}.pptx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Export failed.");
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
            router.push("/ai-docs");
            return;
        }
        if (agentName === "AI Slides") {
            router.push("/ai-slides?new=" + Date.now());
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

    // API: process AI response
    const slideContent = useMemo(() => {
        const latestAssistant = [...messages]
            .reverse()
            .find((m) => m.type === "assistant" && !m.isLoading && !m.isError && (m.content || "").trim());
        return latestAssistant?.content ?? "";
    }, [messages]);

    const handleEditorChange = (json: any) => {
        setEditorJson(json);
    };

    const handleAutoSave = async (json: any, html: string) => {
        setEditorHtml(html);
        console.log("Autosaving slides...", { sessionId, json });
        if (sessionId) {
            try {
                // await chatHistoryService.updateSessionMetadata(sessionId, { editor_state: json });
            } catch (e) {
                console.warn("Autosave persistence failed", e);
            }
        }
    };

    /**
     * Load the deck for a session.
     *
     * `silent` is used by the poll, which runs every 2s while slides are still being
     * written. Transient failures there are expected and must not raise a toast per tick.
     */
    const fetchSlides = useCallback(async (sid: string, options?: { silent?: boolean }) => {
        const silent = options?.silent ?? false;
        try {
            const response = await fetch(`/api/ai/slides/sessions/${sid}/slides`, {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                const next = Array.isArray(data) ? data : [];
                // Only swap state when the deck actually changed, so a 2s poll doesn't
                // re-render the viewer (and remount iframes) on every unchanged tick.
                setSlides((prev) =>
                    slidesSignature(prev) === slidesSignature(next) ? prev : next
                );
            } else {
                const errBody = await response.json().catch(() => ({}));
                console.warn("Failed to fetch slides:", response.status, errBody);
                if (silent) return;
                if (response.status === 401) {
                    toast.error("Session expired or not authorized to load slides. Try refreshing.");
                } else if (response.status === 404) {
                    toast.error("Slides not found for this session. The session may be from a different environment or slides may not have been saved yet.");
                }
            }
        } catch (error) {
            console.error("Failed to fetch slides:", error);
            if (silent) return;
            toast.error("Could not load slide preview. Check your connection and try again.");
        }
    }, []);

    const pollForContent = useCallback(async (sid: string, loadingMsgId: string) => {
        let attempts = 0;
        // Each tick costs two requests (chat history + deck). At 2s that was ~110 requests for
        // a single 3-slide deck, which is enough to trip rate limiting for no benefit — a slide
        // takes ~35s to generate, so polling faster than that just re-reads unchanged rows.
        const pollInterval = 30000; // 30s
        // Keep these two in step: a deck is N+1 sequential model calls and a measured 3-slide
        // run took ~110s, so the cap must stay generous. maxAttempts * pollInterval is the real
        // budget — leaving this at its old value would have stretched the timeout to 2.5 hours.
        const maxAttempts = 20; // 20 * 30s = 10 minutes
        let lastHistoryNullCount = 0;

        // Supersede any poll already running, then claim ownership.
        cancelActivePoll();
        const token = { cancelled: false };
        pollTokenRef.current = token;

        const poll = async () => {
            if (token.cancelled) return;
            if (attempts >= maxAttempts) {
                setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
                    ...m,
                    content: "The slides are taking longer than expected. Please check back in a few moments by refreshing or checking your history.",
                    isLoading: false,
                    isError: true
                } : m));
                pollTokenRef.current = null;
                setIsLoading(false);
                return;
            }

            try {
                const history = await chatHistoryService.getChatHistory(sid);
                // The await above can outlive this poll (unmount, or a newer generation
                // superseding it) — re-check before writing any state.
                if (token.cancelled) return;
                if (!history) {
                    lastHistoryNullCount++;
                    // In production, chat history can return null if auth fails (e.g. cookie not sent to API)
                    if (lastHistoryNullCount === 3) {
                        setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
                            ...m,
                            content: "Your slides may still be generating. If you don’t see an update soon, try refreshing the page or opening this session from the sidebar.",
                            isLoading: false
                        } : m));
                    }
                } else {
                    lastHistoryNullCount = 0;
                    if (history.messages.length > 0) {
                        const assistantMsgs = history.messages.filter(m => m.type === "incoming");
                        const lastMsg = assistantMsgs[assistantMsgs.length - 1];

                        if (lastMsg && lastMsg.text && !lastMsg.text.includes("processing in background")) {
                            setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
                                ...m,
                                content: lastMsg.text,
                                isLoading: false,
                                providerName: lastMsg.ai_metadata?.provider,
                                model: lastMsg.ai_metadata?.model
                            } : m));
                            pollTokenRef.current = null;
                            await fetchSlides(sid);
                            setIsLoading(false);
                            await loadChatSessions();
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error("Polling error:", e);
            }

            if (token.cancelled) return;

            // Generation appends one presentation_slides row per model call, so the deck is
            // readable long before the final chat message lands. Refetching each tick makes
            // slides appear one-by-one as they're written instead of all at once at the end —
            // the visible part of the streaming AI_SLIDES.md asks for, with no backend work.
            await fetchSlides(sid, { silent: true });
            if (token.cancelled) return;

            attempts++;
            pollTimeoutRef.current = setTimeout(poll, pollInterval);
        };

        poll();
    }, [loadChatSessions, fetchSlides, cancelActivePoll]);

    // API: start new session
    const callStart = useCallback(
        async (
            question: string,
            modelIdOverride?: string,
            additionalContent?: string | Record<string, unknown>,
            attachments?: { name: string; type?: string }[],
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
            // pollForContent is fire-and-forget, so the finally block below must NOT clear
            // isLoading while a poll is still running — that re-enables the input mid-generation
            // and lets a second run race the first through the backend's clear_slides().
            // The poll owns isLoading from the moment it starts.
            let pollingStarted = false;

            try {
                const effectiveModelId = modelIdOverride || selectedModelId;
                const preferredProvider = getProviderFromModelId(effectiveModelId);
                const preferredModel = getModelApiId(effectiveModelId);
                const isAuto = effectiveModelId === "auto";
                const resolvedPreferredProvider =
                    preferredProvider === "AI2me" || preferredProvider === "auto"
                        ? "anthropic"
                        : preferredProvider;
                const resolvedPreferredModel = isAuto
                    ? "claude-opus-4-6-2026-04-01"
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
                        additional_content: buildAdditionalContent(additionalContent),
                        session_metadata: { agent_id: "ai-slides" },
                        preferences: {
                            cost_sensitivity: "medium",
                            quality_priority: "balanced",
                            response_time: "",
                            preferred_provider: resolvedPreferredProvider,
                            preferred_model: resolvedPreferredModel,
                        },
                        // A deck is N+1 sequential model calls and routinely runs past the 300s
                        // maxDuration on this route — the fetch then died with "Internal server
                        // error: fetch failed" while the backend carried on and finished a deck
                        // the user never saw. instant_response hands generation to FastAPI
                        // BackgroundTasks and returns immediately; pollForContent picks it up.
                        instant_response: true,
                        clarification_qa_text: options?.clarificationQaText || undefined,
                        clarification_payload: options?.clarificationPayload || undefined,
                    }),
                });

                const data: StartResponse & { detail?: string; message?: string; sessionId?: string } = await response.json();
                if (!response.ok) throw new Error(data.detail || "Failed to start session");

                // Support both snake_case (backend) and camelCase (production gateways)
                const sid = data.session_id ?? data.sessionId ?? "";
                if (!sid) throw new Error("No session_id in response");
                skipClearAfterStartRef.current = true;
                setSessionId(sid);
                // Keep URL in sync so the URL effect doesn't clear state (production fix)
                router.replace(`/ai-slides?session_id=${sid}`);

                // Support both snake_case (backend) and camelCase (some gateways) and fallback to message
                const displayContent =
                    data.ai_response ??
                    (data as { aiResponse?: string }).aiResponse ??
                    (data.response_type === "immediate" ? data.message : undefined) ??
                    "";

                if (data.response_type === "session_only" || !displayContent) {
                    // Show feedback while polling (helps when chat history is delayed or auth differs in prod)
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === loadingMessageId
                                ? { ...msg, content: "Generating your slides…" }
                                : msg
                        )
                    );
                    pollingStarted = true;
                    pollForContent(sid, loadingMessageId);
                } else {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === loadingMessageId
                                ? {
                                    id: loadingMessageId,
                                    type: "assistant" as const,
                                    content: displayContent || "No response received",
                                    providerName:
                                        data.ai_provider?.provider_name ||
                                        data.provider_name ||
                                        data.provider ||
                                        "",
                                    model:
                                        data.ai_provider?.model_name ||
                                        data.ai_provider?.model ||
                                        data.model ||
                                        "",
                                }
                                : msg
                        )
                    );
                    await fetchSlides(sid);
                    setIsLoading(false);
                }

                await loadChatSessions();
                await loadProjects();
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
                pollingStarted = false; // request failed outright; no poll owns the flag
            } finally {
                if (!pollingStarted) setIsLoading(false);
            }
        },
        [selectedModelId, loadChatSessions, loadProjects, fetchSlides, pollForContent, router]
    );

    // API: continue existing session
    const callContinue = useCallback(
        async (
            question: string,
            modelIdOverride?: string,
            additionalContent?: string | Record<string, unknown>,
            attachments?: { name: string; type?: string }[],
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
            // See callStart: the poll owns isLoading once started, so finally must not clear it.
            let pollingStarted = false;

            try {
                const effectiveModelId = modelIdOverride || selectedModelId;
                const preferredProvider = getProviderFromModelId(effectiveModelId);
                const preferredModel = getModelApiId(effectiveModelId);
                const isAuto = effectiveModelId === "auto";
                const resolvedPreferredProvider =
                    preferredProvider === "AI2me" || preferredProvider === "auto"
                        ? "anthropic"
                        : preferredProvider;
                const resolvedPreferredModel = isAuto
                    ? "claude-opus-4-6-2026-04-01"
                    : preferredModel === "auto"
                        ? ""
                        : preferredModel;

                const response = await fetch("/api/ai/continue", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        session_id: sessionId,
                        question,
                        additional_content: buildAdditionalContent(additionalContent),
                        session_metadata: {
                            agent_id: "ai-slides",
                        },
                        preferences: {
                            cost_sensitivity: "medium",
                            quality_priority: "balanced",
                            response_time: "",
                            preferred_provider: resolvedPreferredProvider,
                            preferred_model: resolvedPreferredModel,
                        },
                        // See callStart: generate in the background and poll, instead of
                        // holding the request open past this route's 300s maxDuration.
                        instant_response: true,
                        clarification_qa_text: options?.clarificationQaText || undefined,
                        clarification_payload: options?.clarificationPayload || undefined,
                    }),
                });

                const data: ContinueResponse & { detail?: string } = await response.json();
                if (!response.ok) throw new Error(data.detail || "Failed to continue session");

                const continueContent = data.answer ?? "";

                // A backgrounded query comes back as status "pending" WITH a placeholder answer
                // ("Ok, code generation will start shortly."), so a !continueContent check alone
                // misses it — we'd show the placeholder and fetch slides before any exist.
                // Treat pending/processing/active as "still generating" and poll.
                const backgroundStatus = (data as { status?: string }).status;
                const isGenerating =
                    backgroundStatus === "pending" ||
                    backgroundStatus === "processing" ||
                    backgroundStatus === "active";

                if (isGenerating || !continueContent) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === loadingMessageId ? { ...msg, content: "Generating your slides…" } : msg
                        )
                    );
                    pollingStarted = true;
                    pollForContent(sessionId, loadingMessageId);
                } else {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === loadingMessageId
                                ? {
                                    id: loadingMessageId,
                                    type: "assistant" as const,
                                    content: continueContent || "No response received",
                                    providerName:
                                        data.ai_provider?.provider_name ||
                                        data.provider_name ||
                                        data.provider ||
                                        "",
                                    model:
                                        data.ai_provider?.model_name ||
                                        data.ai_provider?.model ||
                                        data.model ||
                                        "",
                                }
                                : msg
                        )
                    );
                    await fetchSlides(sessionId);
                    setIsLoading(false);
                }
            } catch (error: unknown) {
                const err = error as Error;
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
                pollingStarted = false; // request failed outright; no poll owns the flag
            } finally {
                if (!pollingStarted) setIsLoading(false);
            }
        },
        [callStart, selectedModelId, sessionId, fetchSlides, pollForContent]
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
                                  submitLabel: "Build presentation",
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
        async (message: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string }[], modelIdOverride?: string) => {
            // Inject template design hint into first message of a new session
            const enriched = (!sessionId && selectedTemplate)
                ? `${message}\n\n[Design template: ${selectedTemplate.promptHint}]`
                : message;
            const userMsgId = crypto.randomUUID();
            const loadingMsgId = crypto.randomUUID();
            const isFollowUp = Boolean(sessionId);

            setMessages((prev) => [
                ...prev,
                {
                    id: userMsgId,
                    type: "user",
                    content: enriched,
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
                const deck = slidesRef.current || [];
                const titles = deck
                    .slice(0, 8)
                    .map((s: any) => s?.title || s?.heading || "")
                    .filter(Boolean);
                const summary = deck.length
                    ? `Deck: ${deck.length} slides${titles.length ? ` (${titles.join("; ")})` : ""}`
                    : null;
                const res = await fetch("/api/ai/clarify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        question: enriched,
                        agent_id: "ai-slides",
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
                console.warn("slides clarify failed; falling back to generate", e);
            }

            if (clarify && !clarify.sufficient && clarify.questions.length > 0) {
                pendingClarifyRef.current = {
                    question: enriched,
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
                                      submitLabel: "Build presentation",
                                  },
                              }
                            : m
                    )
                );
                setIsLoading(false);
                return;
            }

            await (isFollowUp ? callContinue : callStart)(
                enriched,
                modelIdOverride,
                additionalContent,
                attachments,
                {
                    existingUserMsgId: userMsgId,
                    existingLoadingMsgId: loadingMsgId,
                }
            );
        },
        [callContinue, callStart, sessionId, selectedTemplate]
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

    // Landing until first Generate; editor after messages/session (or while loading history)
    const templateLocked = Boolean(sessionId) || messages.length > 0;
    const isLanding = !templateLocked && !isLoadingHistory;

    const renderAttachedTemplate = (opts?: { attached?: boolean }) => {
        const attached = opts?.attached ?? false;
        const shell = attached
            ? "w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] shadow-sm"
            : "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] text-[var(--chat-text-primary)]";

        if (selectedTemplate !== null) {
            return (
                <div className={shell}>
                    {attached ? (
                        <>
                            <div
                                className="w-16 sm:w-20 aspect-[16/10] rounded-lg shrink-0 border border-[var(--chat-border)] overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${selectedTemplate.previewColors[0]}, ${selectedTemplate.previewColors[1] ?? selectedTemplate.previewColors[0]})`,
                                }}
                                aria-hidden
                            >
                                <div
                                    className="w-full h-full opacity-90"
                                    style={{
                                        background: `linear-gradient(160deg, transparent 40%, ${selectedTemplate.accentColor}55)`,
                                    }}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
                                    {selectedTemplate.name}
                                </p>
                                <p className="text-[11px] text-[var(--chat-text-muted)] truncate">
                                    {selectedTemplate.description}
                                </p>
                            </div>
                            {!templateLocked && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedTemplate(null)}
                                    className="p-1.5 rounded-lg text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)] transition-colors shrink-0"
                                    aria-label="Clear template — use AI Recommended"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: selectedTemplate.accentColor }}
                            />
                            <span className="max-w-[200px] truncate">{selectedTemplate.name}</span>
                            {!templateLocked && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedTemplate(null)}
                                    className="ml-0.5 text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] transition-colors"
                                    aria-label="Clear template — use AI Recommended"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            );
        }

        return (
            <div className={shell}>
                {attached ? (
                    <>
                        <div
                            className="w-16 sm:w-20 aspect-[16/10] rounded-lg shrink-0 border border-[var(--chat-border)] bg-[var(--chat-bg-primary)] flex items-center justify-center"
                            aria-hidden
                        >
                            <span className="text-lg text-[var(--chat-accent)]">✦</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[var(--chat-text-primary)]">
                                AI Recommended
                            </p>
                            <p className="text-[11px] text-[var(--chat-text-muted)]">
                                Let AI pick the best design for your topic
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <span className="text-[var(--chat-accent)]" aria-hidden>
                            ✦
                        </span>
                        <span>AI Recommended</span>
                    </>
                )}
            </div>
        );
    };

    // Render
    return (
        <div
            ref={pageScrollRef}
            className="bg-[var(--chat-bg-primary)]"
            style={{ overflowY: "auto", height: "100vh" }}
        >
            <div
                className={`bg-[var(--chat-bg-primary)] overflow-hidden flex ${isLanding ? "min-h-full" : ""}`}
                style={isLanding ? undefined : { height: "100vh", display: "flex", flexShrink: 0 }}
            >
                <NavSidebar
                    user={user}
                    userMenuOpen={userMenuOpen}
                    setUserMenuOpen={setUserMenuOpen}
                    handleSignOut={handleSignOut}
                    router={router}
                    handleNewChat={handleNewChat}
                    handleAgentAction={handleAgentAction}
                    menuAgents={MENU_AGENTS}
                    onOpenSidebar={() => setSidebarOpen(true)}
                    onOpenSearch={() => setSidebarOpen(true)}
                />

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

                <div className="lg:pl-20 flex flex-col flex-1 min-w-0 min-h-full transition-all duration-300 ease-in-out">
                    <div
                        className={`flex-1 flex flex-col min-w-0 min-h-full transition-all duration-300 ease-in-out ${
                            sidebarOpen ? "lg:ml-80" : "ml-0"
                        }`}
                    >
                        <MinimalHeader
                            sidebarOpen={sidebarOpen}
                            onOpenSidebar={() => setSidebarOpen(true)}
                            onNewChatInNewTab={handleNewChatInNewTab}
                        />

                        {isLanding ? (
                            /* ── LANDING: centered composer + gallery (Genspark-style) ── */
                            <div className="flex-1 flex flex-col w-full">
                                <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-6 flex flex-col items-center">
                                    <div
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-5"
                                        style={{
                                            background: "rgba(249, 115, 22, 0.1)",
                                            border: "1px solid rgba(249, 115, 22, 0.2)",
                                        }}
                                    >
                                        <AISlidesIcon
                                            className="w-7 h-7 sm:w-8 sm:h-8"
                                            style={{ color: "#F97316" }}
                                        />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--chat-text-primary)] text-center">
                                        AI Slides
                                    </h1>
                                    <p className="mt-2 text-sm text-[var(--chat-text-muted)] text-center max-w-md leading-relaxed">
                                        Choose a style, describe your presentation, and generate a polished deck.
                                    </p>

                                    <div className="w-full mt-8 space-y-3">
                                        {renderAttachedTemplate({ attached: true })}
                                        <ChatInput
                                            onSend={handleSendMessage}
                                            isLoading={isLoading}
                                            animatePlaceholder={false}
                                            placeholder="Enter your presentation topic and requirements"
                                            showAttachButton={true}
                                        />
                                    </div>

                                    <div className="mt-5 flex flex-wrap justify-center gap-2 w-full">
                                        {[
                                            "Pitch deck for a new startup",
                                            "Monthly business review",
                                            "Educational slides about AI",
                                        ].map((hint) => (
                                            <button
                                                key={hint}
                                                type="button"
                                                onClick={() => handleSendMessage(hint)}
                                                className="px-3 py-1.5 rounded-full text-xs border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] hover:border-[var(--chat-accent)]/40 transition-colors"
                                            >
                                                {hint}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    ref={templateSectionRef}
                                    id="template-gallery"
                                    className="w-full border-t border-[var(--chat-border)] pb-16"
                                >
                                    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
                                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--chat-text-primary)]">
                                            Choose a presentation style
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[var(--chat-text-muted)] mt-1 max-w-2xl leading-relaxed">
                                            Select a template to guide your deck&apos;s look, or keep AI Recommended
                                            and generate anytime.
                                        </p>
                                    </div>
                                    <TemplateGallery
                                        selectedId={selectedTemplate?.id ?? null}
                                        onSelect={(tpl) => {
                                            // Gallery only calls this for AI Recommended (null)
                                            if (templateLocked) return;
                                            if (tpl === null) setSelectedTemplate(null);
                                        }}
                                        onPreview={(tpl) => {
                                            if (templateLocked) return;
                                            setPreviewingTemplate(tpl);
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* ── EDITOR: chat + presentation preview ── */
                            isLg ? (
                            <ResizableChatPreviewLayout
                                storageKey={AI_SLIDES_PANEL_LAYOUT_KEY}
                                enabled
                                className="min-h-0"
                                chatHeader={
                                    <header className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                                    style={{
                                                        background: "rgba(249, 115, 22, 0.15)",
                                                        border: "1px solid rgba(249, 115, 22, 0.3)",
                                                    }}
                                                >
                                                    <AISlidesIcon
                                                        className="w-3.5 h-3.5"
                                                        style={{ color: "#F97316" }}
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
                                                    AI Slides
                                                </span>
                                            </div>
                                            <div className="text-xs text-[var(--chat-text-muted)] truncate mt-0.5">
                                                {user?.full_name
                                                    ? `Chatting as ${user.full_name}`
                                                    : "Describe a presentation to generate"}
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
                                            className={`flex-1 flex flex-col min-h-0 h-full ${
                                                isTransitioning ? "opacity-95" : ""
                                            }`}
                                        >
                                            <div className="relative flex-1 flex flex-col min-h-0">
                                                <div
                                                    ref={leftPanelRef}
                                                    className="flex-1 overflow-y-auto chat-scrollbar min-h-0"
                                                >
                                                    <div className="max-w-4xl mx-auto pb-4 px-2">
                                                        <ChatMessages
                                                            messages={messages}
                                                            onClarifySubmit={handleClarifySubmit}
                                                            onClarifySkip={handleClarifySkip}
                                                        />
                                                    </div>
                                                </div>
                                                {showLeftScrollBtn && (
                                                    <button
                                                        onClick={() =>
                                                            leftPanelRef.current?.scrollTo({
                                                                top: leftPanelRef.current.scrollHeight,
                                                                behavior: "smooth",
                                                            })
                                                        }
                                                        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm shadow-lg transition-all"
                                                        title="Scroll to bottom"
                                                    >
                                                        <ChevronDown className="w-5 h-5 text-[var(--chat-text-primary)]" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }
                                composer={
                                    <>
                                        <div className="flex items-center gap-1.5 px-1 mb-2">
                                            {renderAttachedTemplate()}
                                        </div>
                                        <ChatInput
                                            onSend={handleSendMessage}
                                            isLoading={isLoading}
                                            animatePlaceholder={false}
                                            placeholder="Enter your presentation topic and requirements"
                                            showAttachButton={true}
                                        />
                                    </>
                                }
                                preview={
                                    <div className="flex-1 flex flex-col min-h-0 h-full bg-[var(--chat-bg-secondary)]">
                                        <header className="h-14 border-b border-[var(--chat-border)] bg-[var(--chat-bg-primary)] flex items-center justify-between px-6 shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[var(--chat-bg-tertiary)] rounded-lg border border-[var(--chat-border)]">
                                                    <AISlidesIcon className="w-4 h-4 text-[var(--chat-text-primary)]" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-[var(--chat-text-muted)] font-medium uppercase tracking-wider">
                                                        Presentation Editor
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    slides.length > 0
                                                        ? setShowExportModal(true)
                                                        : toast.error("Generate a presentation first.")
                                                }
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Export
                                            </button>
                                        </header>
                                        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                                            <SlideViewer
                                                slides={slides}
                                                sessionId={sessionId}
                                                onCreate={() =>
                                                    handleSendMessage("Create a presentation deck")
                                                }
                                                onEdit={(slide) => {
                                                    setActiveSlideForEdit(slide);
                                                    setIsEditingHtml(true);
                                                }}
                                            />
                                        </div>
                                    </div>
                                }
                            />
                            ) : (
                            <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
                                <div className="w-full border-b border-[var(--chat-border)] flex flex-col min-h-[50vh] bg-[var(--chat-bg-primary)]">
                                    <header className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                                    style={{
                                                        background: "rgba(249, 115, 22, 0.15)",
                                                        border: "1px solid rgba(249, 115, 22, 0.3)",
                                                    }}
                                                >
                                                    <AISlidesIcon
                                                        className="w-3.5 h-3.5"
                                                        style={{ color: "#F97316" }}
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
                                                    AI Slides
                                                </span>
                                            </div>
                                            <div className="text-xs text-[var(--chat-text-muted)] truncate mt-0.5">
                                                {user?.full_name
                                                    ? `Chatting as ${user.full_name}`
                                                    : "Describe a presentation to generate"}
                                            </div>
                                        </div>
                                    </header>

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
                                            className={`flex-1 flex flex-col min-h-0 ${
                                                isTransitioning ? "opacity-95" : ""
                                            }`}
                                        >
                                            <div className="relative flex-1 flex flex-col min-h-0">
                                                <div
                                                    ref={leftPanelRef}
                                                    className="flex-1 overflow-y-auto chat-scrollbar"
                                                >
                                                    <div className="max-w-4xl mx-auto pb-32 px-2">
                                                        <ChatMessages
                                                            messages={messages}
                                                            onClarifySubmit={handleClarifySubmit}
                                                            onClarifySkip={handleClarifySkip}
                                                        />
                                                    </div>
                                                </div>
                                                {showLeftScrollBtn && (
                                                    <button
                                                        onClick={() =>
                                                            leftPanelRef.current?.scrollTo({
                                                                top: leftPanelRef.current.scrollHeight,
                                                                behavior: "smooth",
                                                            })
                                                        }
                                                        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm shadow-lg transition-all"
                                                        title="Scroll to bottom"
                                                    >
                                                        <ChevronDown className="w-5 h-5 text-[var(--chat-text-primary)]" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="fixed bottom-16 left-0 right-0 p-4 border-t border-[var(--chat-border)] bg-[var(--chat-bg-primary)] z-10">
                                        <div className="mb-3">
                                            <button
                                                onClick={() => setIsMobilePreviewOpen(true)}
                                                className="w-full flex items-center justify-between p-3 bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] rounded-xl hover:bg-[var(--chat-bg-hover)] transition-all text-left"
                                            >
                                                <div>
                                                    <div className="text-sm font-semibold text-[var(--chat-text-primary)]">
                                                        Presentation Editor
                                                    </div>
                                                    <div className="text-[10px] text-[var(--chat-text-muted)]">
                                                        Live AI Generation & Editing
                                                    </div>
                                                </div>
                                                <Info className="w-4 h-4 text-[var(--chat-text-muted)]" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1.5 px-1 mb-2">
                                            {renderAttachedTemplate()}
                                        </div>

                                        <ChatInput
                                            onSend={handleSendMessage}
                                            isLoading={isLoading}
                                            animatePlaceholder={false}
                                            placeholder="Enter your presentation topic and requirements"
                                            showAttachButton={true}
                                        />
                                    </div>
                                </div>

                                {isMobilePreviewOpen && (
                                    <div className="fixed inset-0 z-[100] bg-[var(--chat-bg-primary)] flex flex-col">
                                        <header className="h-14 border-b border-[var(--chat-border)] flex items-center justify-between px-4 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <AISlidesIcon className="w-4 h-4 text-[var(--chat-accent)]" />
                                                <span className="text-sm font-bold">Presentation Editor</span>
                                            </div>
                                            <button
                                                onClick={() => setIsMobilePreviewOpen(false)}
                                                className="p-2 hover:bg-[var(--chat-bg-secondary)] rounded-full transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </header>
                                        <div className="flex-1 overflow-hidden flex flex-col">
                                            <SlideViewer
                                                slides={slides}
                                                sessionId={sessionId}
                                                onCreate={() =>
                                                    handleSendMessage("Create a presentation deck")
                                                }
                                                onEdit={(slide) => {
                                                    setActiveSlideForEdit(slide);
                                                    setIsEditingHtml(true);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            )
                        )}
                    </div>
                </div>

                {isEditingHtml && activeSlideForEdit && (
                    <SlideEditorModal
                        slide={activeSlideForEdit}
                        onClose={() => setIsEditingHtml(false)}
                        onSave={(updatedHtml) => {
                            setSlides((prev) =>
                                prev.map((s) =>
                                    s.id === activeSlideForEdit.id
                                        ? {
                                              ...s,
                                              html_content: updatedHtml,
                                              updated_at: new Date().toISOString(),
                                          }
                                        : s
                                )
                            );
                        }}
                    />
                )}

                {showExportModal && (
                    <ExportModal
                        slides={slides}
                        sessionId={sessionId}
                        sessionTitle={
                            messages.find((m) => m.type === "user")?.content?.slice(0, 60) ||
                            "presentation"
                        }
                        onClose={() => setShowExportModal(false)}
                    />
                )}
            </div>

            {previewingTemplate && !templateLocked && (
                <TemplatePreviewModal
                    template={previewingTemplate}
                    onConfirm={(tpl) => {
                        setSelectedTemplate(tpl);
                        setPreviewingTemplate(null);
                    }}
                    onClose={() => setPreviewingTemplate(null)}
                />
            )}
        </div>
    );
}

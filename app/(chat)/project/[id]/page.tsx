"use client";

import { use, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import "@/styles/chat-theme.css";
import "@/styles/chat-provider-themes.css";

import {
  ChatInput,
  ChatMessages,
  ChatSidebar,
  NavSidebar,
  AppPreview,

  ThemeToggle,
  MinimalHeader,
  MENU_AGENTS,
  getModelApiId,
  getProviderFromModelId,
  FileExplorer,
  FileViewer,
  WebsiteBuilderCanvas,
  type AIModel,
  type Message,
} from "@/components/chat";

import { FileText, Globe, Info, X, FolderOpen, LayoutGrid, Github,
  Code2, Copy, Download, Check, ChevronDown} from "lucide-react";

import chatHistoryService, { ChatSession, ProjectSummary } from "@/app/api/chatHistory";
import { usePlaygroundAccess } from "@/hooks/use-playground-access";
import { useAuth } from "@/context/AuthContext";
import { useProviderTheme } from "@/hooks/use-provider-theme";
import { useAIStream } from "@/hooks/useAIStream";
import { AIResponseView } from "@/components/AIResponseView";
import { PhaseProgressBar } from "@/components/PhaseProgressBar";
import { PipelineStatusPanel } from "@/components/PipelineStatusPanel";

const PROJECT_CHAT_BOOTSTRAP_KEY_PREFIX = "project-chat-bootstrap:";
const PROJECT_HISTORY_POLL_INTERVAL_MS = 3000;
const PROJECT_HISTORY_POLL_WINDOW_MS = 600000; // 10 min — code generation can take 5-9 min

type ContinueResponse = {
  session_id: string;
  query_id?: string;
  status?: string;
  message?: string;
  answer?: string;
  intent?: string;
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

type StartResponse = {
  session_id: string;
  ai_response?: string;
  response_type?: string;
  complexity_level?: string;
  query_id?: string;
  intent?: string;
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

// ── GitHub Export Button ────────────────────────────────────────────────

function ExportToGithubButton({ previewUrl, projectId }: { previewUrl?: string; projectId?: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handle = async () => {
    setLoading(true); setErr(null);
    try {
      // Fetch the preview HTML from the live URL
      const html = previewUrl
        ? await fetch("/api/ai/preview-html", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: previewUrl, project_id: projectId }),
          }).then(r => r.ok ? r.json().then(d => d.html) : null)
        : null;

      const res = await fetch("/api/v1/connectors/github/export-html", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: html || `<!-- AI2me project ${projectId} -->`,
          title: projectId ? `ai2me-${projectId.slice(0, 8)}` : "ai2me-project",
          make_public: true,
        }),
      });
      if (res.status === 400) { const authRes = await fetch("/api/connectors/github/auth"); if (authRes.ok) { const { auth_url } = await authRes.json(); window.location.href = auth_url; } return; }
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail ?? "Export failed"); }
      const data = await res.json();
      setDone(data.github_url);
      toast.success("Exported to GitHub!");
    } catch (e: any) {
      setErr(e.message || "Export failed");
      toast.error(e.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handle}
        disabled={loading}
        className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] hover:border-purple-500/50 text-xs font-medium transition-all disabled:opacity-50"
      >
        <Github size={13} />
        {loading ? "Exporting…" : done ? "Exported ✓" : "Export to GitHub"}
      </button>
      {done && (
        <a href={done} target="_blank" rel="noopener noreferrer"
          className="hidden lg:block text-xs text-purple-400 hover:text-purple-300 underline truncate max-w-[120px]"
        >{done.replace("https://github.com/", "")}</a>
      )}
    </div>
  );
}

export default function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut, loading: authLoading, isAuthenticated } = useAuth();
  const { canAccessPlayground, isLoading: accessLoading, refreshAccess } = usePlaygroundAccess();
  // Auth token for API calls — read from cookie client-side only
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  useEffect(() => {
    import("@/utility/cookies").then(({ getCookie }) => {
      setAuthToken(getCookie("auth-token") || undefined);
    });
  }, [user]);

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [generationPending, setGenerationPending] = useState(false); // true while background code gen is in-flight
  const [generationTimedOut, setGenerationTimedOut] = useState(false);
  const generationStartRef = useRef<number | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | undefined>(undefined);
  const pollRestartRef = useRef(0); // bump to restart poll loop on demand
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"app" | "files" | "builder" | "code">("app");
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // Sidebar States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [previewTooltipOpen, setPreviewTooltipOpen] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const { id: sessionId } = use(params);
  const [actualSessionId, setActualSessionId] = useState<string | null>(null);
  const isNewProject = sessionId === "new";

  // Use actual session ID if we've created a project, otherwise use the URL param
  const effectiveSessionId = actualSessionId || sessionId;

  // App preview URL: use project's preview_url when available (dev server per project)
  // useState (not useMemo) so deployStatus effect can call setCurrentProject to patch preview_url
  // without waiting for a full projects refetch.
  const [currentProject, setCurrentProject] = useState<ProjectSummary | undefined>(
    () => projects.find((p) => p.session_id === effectiveSessionId)
  );
  // Keep currentProject in sync when projects list or session changes
  useEffect(() => {
    setCurrentProject(projects.find((p) => p.session_id === effectiveSessionId));
  }, [projects, effectiveSessionId]);
  // Auto-switch to app preview when existing project has generated files
  useEffect(() => {
    if (currentProject?.project_id && !isNewProject) {
      setPreviewMode("app");
    }
  }, [currentProject?.project_id, isNewProject]);

  // Only use preview_url if it's a real HTTPS URL — empty string or localhost falls through
  // to the on-demand esbuild route in AppPreview (/api/ai/preview/${sessionId}).
  const appPreviewUrl = currentProject?.preview_url && currentProject.preview_url.startsWith("https://")
    ? currentProject.preview_url
    : undefined;

  // ── Canonical PreviewState (reducer-backed) ──────────────────────────────
  // previewState is the ONLY source of truth for the preview render tree.
  // Fed from: SSE deploy_status.preview_state + fallback polling after SSE disconnect.
  // LIVE badge requires: previewState.kind === "ready" && previewState.iframeStatus === "loaded".
  // currentVersionId is derived from previewState for AppPreview key stability.
  const currentVersionId =
    previewState.kind === "ready" || previewState.kind === "failed"
      ? previewState.versionId
      : previewState.versionId;

  // Model Selection State - single source of truth
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-sonnet-4-6");
  const { isTransitioning } = useProviderTheme(getProviderFromModelId(selectedModelId));

  // ── AI Builder SSE stream ─────────────────────────────────────────────────
  const {
    phases,
    steps,
    codeDeltaFiles,
    status: streamStatus,
    error: streamError,
    delayed: streamDelayed,
    conversationId: streamConversationId,
    project: streamProject,
    deployStatus,
    previewState,
    dispatchPreview,
    previewPollVersionRef,
    start: startStream,
    retry: retryStream,
    reset: resetStream,
  } = useAIStream();

  const [streamBannerError, setStreamBannerError] = useState<string | null>(null);
  // Bumped when codegen finishes (and on deploy ready) so AppPreview refetches.
  const [previewRevision, setPreviewRevision] = useState(0);
  const prevStreamStatusRef = useRef(streamStatus);

  // When background deploy completes, update the preview URL without a full page reload.
  // previewState reducer is fed from the SSE payload directly in useAIStream.
  // This effect handles currentProject sync and previewRevision bump only.
  useEffect(() => {
    if (deployStatus?.status === "ready" && deployStatus.preview_url) {
      setCurrentProject((prev) =>
        prev ? { ...prev, preview_url: deployStatus.preview_url! } : prev
      );
      setPreviewRevision((r) => r + 1);
    } else if (deployStatus?.status === "failed") {
      // Gate failed — clear any stale preview_url so the iframe cannot render.
      setCurrentProject((prev) =>
        prev ? { ...prev, preview_url: "" } : prev
      );
    }
    // Wire the poll version ref so the SSE-disconnect fallback poller knows what to poll.
    const dsTyped = deployStatus as (Record<string, unknown> | null);
    const vid = dsTyped?.version_id;
    if (typeof vid === "string" && vid) {
      previewPollVersionRef.current = vid;
    }
  }, [deployStatus, previewPollVersionRef]);

  // Dispatch VERSION_CHANGE when the canonical version_id changes so the reducer
  // resets immediately — prior version URL must never appear for the new version.
  const prevVersionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentVersionId && currentVersionId !== prevVersionIdRef.current) {
      prevVersionIdRef.current = currentVersionId;
      dispatchPreview({ type: "VERSION_CHANGE", versionId: currentVersionId });
    }
  }, [currentVersionId, dispatchPreview]);

  // Auto-reload App Preview after each successful stream (start or continue).
  // Staggered bumps cover prod latency where file persistence lags the "done" event.
  useEffect(() => {
    const prev = prevStreamStatusRef.current;
    prevStreamStatusRef.current = streamStatus;
    if (prev === "done" || streamStatus !== "done") return;
    const delays = [500, 2000, 5000];
    const timers = delays.map((ms) =>
      window.setTimeout(() => {
        setPreviewRevision((r) => r + 1);
      }, ms)
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [streamStatus]);

  // Bump once when files phase completes (often earlier than stream "done").
  const filesDoneBumpRef = useRef(false);
  useEffect(() => {
    if (streamStatus === "streaming" || streamStatus === "idle") {
      filesDoneBumpRef.current = false;
    }
  }, [streamStatus]);
  useEffect(() => {
    if (phases.files.status !== "done" || filesDoneBumpRef.current) return;
    filesDoneBumpRef.current = true;
    setPreviewRevision((r) => r + 1);
  }, [phases.files.status]);

  // Guards the post-stream refresh so a finished stream is only harvested once.
  const finishedStreamQueryRef = useRef<string | null>(null);

  // Fire-once guards for the preview auto-switch. Declared here (rather than beside the
  // effect that reads them) so clearProjectViewState can reset them without a TDZ hazard.

  const hasAppPreviewRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [showRightScrollBtn, setShowRightScrollBtn] = useState(false);

  // Show/hide scroll-to-bottom arrow on right panel for non-PRD tabs
  useEffect(() => {
    const el = rightPanelRef.current;
    if (!el) { setShowRightScrollBtn(false); return; }
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowRightScrollBtn(dist > 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [previewMode]);

  // Auto-scroll left chat column to bottom as new phases/steps arrive during streaming
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [steps, phases.code.status, phases.files.status, codeDeltaFiles.length]);

  // Scroll left column to bottom after history loads on hard refresh.
  // isLoadingHistory becoming false and messages.length changing are batched separately
  // in React 18, so we depend on both to catch whichever comes last.
  // Use a generous delay + double-rAF so the full message list has time to render
  // before we measure scrollHeight — without this the panel snaps to the top.
  useEffect(() => {
    if (isLoadingHistory) return;
    const el = chatScrollRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        });
      });
    }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingHistory, messages.length]);



  // Load sidebars data
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

  // Merge projects into sessions so AI Developer projects appear in sidebar
  const mergedSessions = useMemo(() => {
    // Build a set of session IDs that belong to builder projects
    const builderSessionIds = new Set(projects.map((p) => p.session_id));

    // Tag any chatSession that's actually a builder project
    const taggedChatSessions = chatSessions.map((s) =>
      builderSessionIds.has(s.session_id) ? { ...s, agent_id: (projects.find((p) => p.session_id === s.session_id)?.agent_id || "web-builder") } : s
    );

    const seen = new Set(taggedChatSessions.map((session) => session.session_id));
    const projectSessions: ChatSession[] = projects
      .filter((project) => !seen.has(project.session_id))
      .map((project) => ({
        session_id: project.session_id,
        title: project.title || "Web Builder",
        preview: project.project_id,
        created_at: project.created_at,
        updated_at: project.updated_at,
        message_count: 0,
        agent_id: project.agent_id || "web-builder",
      }));

    return [...taggedChatSessions, ...projectSessions].sort((a, b) => {
      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      return bTime - aTime;
    });
  }, [chatSessions, projects]);

  // Check playground access on mount (only gates new prompt submission, not sidebar)
  useEffect(() => {
    const checkAccess = async () => {
      const hasAccess = await refreshAccess();
      if (!hasAccess) {
        router.push("/dashboard/credits");
      }
    };
    checkAccess();
  }, [router, refreshAccess]);

  const loadChatHistory = useCallback(async () => {
    // Skip loading history for new projects that haven't been created yet
    if (isNewProject && !actualSessionId) {
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    let hasHistoryMessages = false;
    try {
      const history = await chatHistoryService.getChatHistory(effectiveSessionId);
      if (!history) {
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

      hasHistoryMessages = loadedMessages.length > 0;
      if (hasHistoryMessages) {
        setMessages(loadedMessages);
      }

      // Do not auto-switch preview: respect user choice (PRD vs Web Preview)

    } catch (error) {
      console.error("Failed to load chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsLoadingHistory(false);
      if (hasHistoryMessages) {
        try {
          sessionStorage.removeItem(`${PROJECT_CHAT_BOOTSTRAP_KEY_PREFIX}${effectiveSessionId}`);
        } catch {
          // Ignore storage errors.
        }
      }
    }
  }, [effectiveSessionId, isNewProject, actualSessionId]);

  // Single bootstrap: sessions + projects (+ history for existing projects).
  // Avoids the previous double loadProjects() from auth-ready + sessionId effects.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadChatSessions();
    loadProjects();
    if (!isNewProject) {
      loadChatHistory();
    }
  }, [
    authLoading,
    isAuthenticated,
    sessionId,
    isNewProject,
    loadChatSessions,
    loadProjects,
    loadChatHistory,
  ]);

  useEffect(() => {
    // Only hydrate for existing projects on initial load
    if (isNewProject) return;

    try {
      const raw = sessionStorage.getItem(`${PROJECT_CHAT_BOOTSTRAP_KEY_PREFIX}${sessionId}`);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { messages?: Message[]; createdAt?: number };
      const isFresh = typeof parsed.createdAt === "number" && Date.now() - parsed.createdAt < PROJECT_HISTORY_POLL_WINDOW_MS;
      if (isFresh && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        const bootstrapMessages = parsed.messages;
        setMessages((prev) => (prev.length > 0 ? prev : bootstrapMessages));
      }
    } catch (error) {
      console.warn("Failed to hydrate project bootstrap messages:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Only run on mount or when URL sessionId changes

  // Does the poll still have anything to find?
  //
  // This poll exists only because the client used to have no other way to learn
  // project_id/preview_url — so it hammered /chat/sessions every 3s and
  // /chat/projects every 6s for a full 10 minutes, long after generation finished.
  // The `done` SSE event now carries the project, so the poll is needed only when
  // no stream is driving this session and we still lack project metadata.
  // Once project_id exists, App Preview can use on-demand esbuild; deploy URL
  // updates arrive via SSE deployStatus — no need to poll for 10 minutes.
  const pollNeededRef = useRef(true);
  useEffect(() => {
    const streamActive = streamStatus === "connecting" || streamStatus === "streaming";
    const httpsPreview = (u?: string | null) =>
      Boolean(u && u.startsWith("https://"));
    const havePreview = Boolean(
      httpsPreview(streamProject?.preview_url) ||
      httpsPreview(currentProject?.preview_url) ||
      (deployStatus?.status === "ready" && httpsPreview(deployStatus?.preview_url))
    );
    const haveProjectId = Boolean(
      currentProject?.project_id || streamProject?.project_id
    );
    pollNeededRef.current = !streamActive && !havePreview && !haveProjectId;
  }, [streamStatus, streamProject, currentProject, deployStatus]);

  useEffect(() => {
    // Skip polling for new projects that haven't been created yet
    if (isNewProject && !actualSessionId) return;

    let isMounted = true;
    const startedAt = Date.now();
    let lastProjectRefresh = 0;
    const PROJECT_REFRESH_INTERVAL = 6000; // Refresh projects every 6 seconds (every 2 polls)

    const poll = async () => {
      if (!isMounted) return;
      if (Date.now() - startedAt > PROJECT_HISTORY_POLL_WINDOW_MS) return;

      // Nothing left to discover (stream is delivering, or we already have the
      // preview URL) — skip the network round trip but keep the loop alive so it
      // resumes if a new generation starts.
      if (!pollNeededRef.current) {
        if (isMounted) innerTimer = setTimeout(poll, PROJECT_HISTORY_POLL_INTERVAL_MS);
        return;
      }

      try {
        const history = await chatHistoryService.getChatHistory(effectiveSessionId);
        if (!isMounted || !history) return;

        const loadedMessages: Message[] = history.messages.map((msg) => ({
          id: msg.id,
          type: msg.type === "outgoing" ? "user" : "assistant",
          content: msg.text,
          timestamp: msg.timestamp,
          providerName: msg.ai_metadata?.provider,
          model: msg.ai_metadata?.model,
        }));

        if (loadedMessages.length > 0) {
          let shouldRefetchProjects = false;

          // Update messages if server has more messages OR if content has changed
          setMessages((prev) => {
            // If server has more messages, use server messages
            if (loadedMessages.length > prev.length) {
              shouldRefetchProjects = true;
              return loadedMessages;
            }

            if (loadedMessages.length === prev.length) {
              const hasContentChanged = loadedMessages.some((serverMsg, idx) => {
                const localMsg = prev[idx];
                if (!localMsg) return false;
                if (serverMsg.content !== localMsg.content) {
                  // Check if the new content indicates project files were created or deployed
                  const newContent = serverMsg.content.toLowerCase();
                  if (newContent.includes("project files created") ||
                    newContent.includes("code folder") ||
                    newContent.includes("files have been created") ||
                    newContent.includes("generated the following") ||
                    newContent.includes("deployed") ||
                    newContent.includes("deployment") ||
                    newContent.includes("vercel") ||
                    newContent.includes("preview url") ||
                    newContent.includes("live at")) {
                    shouldRefetchProjects = true;
                  }
                  return true;
                }
                return false;
              });

              if (hasContentChanged) {
                return loadedMessages;
              }
            }

            // Otherwise keep existing messages to avoid overwriting local state
            return prev;
          });

          // Refetch projects if content changed OR periodically to catch preview_url updates
          const now = Date.now();
          if (shouldRefetchProjects || (now - lastProjectRefresh >= PROJECT_REFRESH_INTERVAL)) {
            loadProjects();
            lastProjectRefresh = now;
          }

          // Do not override previewMode from polling
          try {
            sessionStorage.removeItem(`${PROJECT_CHAT_BOOTSTRAP_KEY_PREFIX}${effectiveSessionId}`);
          } catch {
            // Ignore storage errors.
          }
        }
      } catch {
        // Ignore polling errors and keep polling within the window.
      }

      if (isMounted && Date.now() - startedAt <= PROJECT_HISTORY_POLL_WINDOW_MS) {
        innerTimer = setTimeout(poll, PROJECT_HISTORY_POLL_INTERVAL_MS);
      }
    };

    let innerTimer: ReturnType<typeof setTimeout>;
    const timer = setTimeout(poll, PROJECT_HISTORY_POLL_INTERVAL_MS);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearTimeout(innerTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSessionId, isNewProject, actualSessionId, pollRestartRef.current]);

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleNewChat = async () => {
    // Pre-create a session so we navigate to /project/[id] immediately (like Lovable)
    try {
      const res = await fetch("/api/ai/new-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: isAppBuilder ? "New App Builder Project" : "New Web Builder Project", agent_id: isAppBuilder ? "ai-builder" : "web-builder" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session_id) {
          router.push(`/project/${data.session_id}?mode=${isAppBuilder ? "app" : "web"}`);
          return;
        }
      }
    } catch {
      // fallback to /project/new if pre-create fails
    }
    router.push("/project/new");
  };

  const handleAgentAction = (agentName: string) => {
    if (agentName === "App Builder") {
      router.push("/project/new?mode=app");
      return;
    }
    if (agentName === "Web Builder") {
      handleNewChat();
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
      router.push("/ai-docs?new=" + Date.now());
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
    router.push("/chat");
  };

  const handleSelectSession = (id: string, agentId?: string | null) => {
    // Never navigate to a project that was just deleted
    const exists = projects.some((p) => p.session_id === id);
    if (!exists) return;
    if (agentId === "ai-builder" || agentId === "web-builder" || isBuilderProject) {
      const project = projects.find((p) => p.session_id === id);
      // Preserve the stored agent_id — ai-builder stays ai-builder (App Builder),
      // web-builder stays web-builder. Fall back to the passed agentId if not stored.
      const storedAgentId = project?.agent_id;
      const effectiveAgentId = storedAgentId === "ai-builder" ? "ai-builder"
        : storedAgentId === "web-builder" ? "web-builder"
        : agentId === "ai-builder" ? "ai-builder"
        : "web-builder";
      router.push(`/project/${id}?mode=${effectiveAgentId === "ai-builder" ? "app" : "web"}`);
      return;
    }
    if (agentId === "ai-sheets") {
      router.push(`/ai-sheets?session_id=${id}`);
      return;
    }
    if (agentId === "ai-docs") {
      router.push(`/ai-docs?session_id=${id}`);
      return;
    }
    if (agentId === "ai-slides") {
      router.push(`/ai-slides?session_id=${id}`);
      return;
    }
    router.push(`/chat?session_id=${id}`);
  };

  const handleOpenProject = (id: string) => {
    router.push(`/project/${id}`);
  };

  const handleDeleteSession = async (id: string) => {
    // Optimistically remove from sidebar list immediately — never navigate
    setProjects(prev => prev.filter(p => p.session_id !== id));
    try {
      await chatHistoryService.deleteChatSession(id);
      toast.success("Project deleted");
    } catch (error) {
      // Restore on failure
      loadChatSessions();
      toast.error("Failed to delete project");
    }
  };

  const handleRenameProject = async (newTitle: string) => {
    const id = actualSessionId || sessionId;
    if (!id || id === "new") return;
    // Optimistically update local state
    setProjects(prev => prev.map(p =>
      p.session_id === id ? { ...p, title: newTitle } : p
    ));
    try {
      await chatHistoryService.renameChatSession(id, newTitle);
      toast.success("Project renamed");
    } catch (error) {
      loadChatSessions();
      toast.error("Failed to rename project");
    }
  };

  // signOut already destructured above (useAuth called once)
  const handleSignOut = async () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.removeItem("chat-theme");
    await signOut();
    router.push("/");
  };

  // Helper function to detect if message is a greeting
  const isGreeting = (text: string): boolean => {
    const greetings = [
      'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon',
      'good evening', 'howdy', 'hola', 'bonjour', 'namaste', 'sup', 'yo',
      'what\'s up', 'whats up', 'how are you', 'how do you do'
    ];
    const lowerText = text.toLowerCase().trim();
    return greetings.some(greeting =>
      lowerText === greeting ||
      lowerText.startsWith(greeting + ' ') ||
      lowerText.startsWith(greeting + '!')
    );
  };

  const callStart = async (question: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string }[]) => {
    const userMessageId = crypto.randomUUID();
    const loadingMessageId = crypto.randomUUID();

    setMessages((prev: Message[]) => [
      ...prev,
      { id: userMessageId, type: "user", content: question, attachments: attachments?.length ? attachments : undefined },
      { id: loadingMessageId, type: "assistant", content: "", isLoading: true },
    ]);

    setIsLoading(true);

    try {
      const preferredProvider = getProviderFromModelId(selectedModelId);
      const preferredModel = getModelApiId(selectedModelId);
      const resolvedPreferredProvider =
        preferredProvider === "AI2me" || preferredProvider === "auto"
          ? "anthropic"
          : preferredProvider;

      const response = await fetch("/api/ai/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" && localStorage.getItem("ai2me_backend_token")
            ? { "Authorization": `Bearer ${localStorage.getItem("ai2me_backend_token")}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          question,
          connector_ids: [],
          additional_content: additionalContent ?? "",
          session_metadata: {
            project_session: true,
            source: "ai_builder",
            agent_id: builderMode === "app" ? "ai-builder" : "web-builder",
            mode: builderMode,
          },
          preferences: {
            cost_sensitivity: "medium",
            quality_priority: "balanced",
            response_time: "",
            preferred_provider: resolvedPreferredProvider,
            preferred_model: preferredModel === "auto" ? "" : preferredModel,
          },
          instant_response: true,
        }),
      });

      const data: StartResponse = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to start session");

      // Determine the response content based on intent
      let responseContent = data.ai_response || data.detail || "";
      // If backend didn't provide a meaningful response and this is a greeting, use friendly response
      if ((!responseContent || responseContent === "Ok, code generation will start shortly.")) {
        if (isGreeting(question)) {
          responseContent = isAppBuilder
            ? "Hello! 👋 I'm your App Builder assistant. Describe the app you want to build and I'll generate the full code, structure, and a live preview instantly. What would you like to create?"
            : "Hello! 👋 I'm your Web Builder assistant. I can help you build complete applications from scratch. Just describe what you'd like to create, and I'll generate a full project with code, structure, and everything you need. What would you like to build today?";
        } else {
          responseContent = "Ok, code generation will start shortly.";
          setGenerationPending(true); // show generating spinner in preview panel
          setGenerationTimedOut(false);
        }
      }

      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "assistant" as const,
              content: responseContent,
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

      try {
        const bootstrapMessages: Message[] = [
          { id: userMessageId, type: "user", content: question, attachments: attachments?.length ? attachments : undefined },
          {
            id: loadingMessageId,
            type: "assistant",
            content: responseContent,
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
          },
        ];

        sessionStorage.setItem(
          `${PROJECT_CHAT_BOOTSTRAP_KEY_PREFIX}${data.session_id}`,
          JSON.stringify({
            messages: bootstrapMessages,
            createdAt: Date.now(),
          })
        );
      } catch (storageError) {
        console.warn("Failed to store project bootstrap messages:", storageError);
      }

      // Store the actual session ID in state - DO NOT navigate to prevent remounting
      setActualSessionId(data.session_id);

      // Update the URL in the browser without triggering a navigation
      const newUrl = `/project/${data.session_id}?mode=${builderMode}`;
      window.history.replaceState({}, '', newUrl);
    } catch (e: unknown) {
      const err = e as Error;
      console.error(err);
      const isStaleDeployment = err.message?.includes("Server Action") || err.message?.includes("older or newer deployment");
      const userMsg = isStaleDeployment
        ? "The page is outdated. Please press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows) to refresh."
        : err.message || "Failed to send message";
      toast.error(userMsg, { duration: isStaleDeployment ? 10000 : 4000 });

      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "assistant" as const,
              content: isStaleDeployment
                ? "⚠️ Page is outdated after a recent update. Please hard-refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)."
                : "Unable to generate a response. Please try again.",
              isError: true,
            }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const callContinue = async (question: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string }[], options?: { silent?: boolean }) => {
    const userMessageId = crypto.randomUUID();
    const loadingMessageId = crypto.randomUUID();

    setMessages((prev: Message[]) => [
      ...prev,
      // Only add visible user message when not called silently (e.g. auto-generate trigger)
      ...(options?.silent ? [] : [{ id: userMessageId, type: "user" as const, content: question, attachments: attachments?.length ? attachments : undefined }]),
      { id: loadingMessageId, type: "assistant" as const, content: "", isLoading: true },
    ]);

    setIsLoading(true);
    try {
      const preferredProvider = getProviderFromModelId(selectedModelId);
      const preferredModel = getModelApiId(selectedModelId);
      const resolvedPreferredProvider =
        preferredProvider === "AI2me" || preferredProvider === "auto"
          ? "anthropic"
          : preferredProvider;

      const response = await fetch("/api/ai/continue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" && localStorage.getItem("ai2me_backend_token")
            ? { "Authorization": `Bearer ${localStorage.getItem("ai2me_backend_token")}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          session_id: effectiveSessionId,
          question,
          additional_content: additionalContent ?? "",
          session_metadata: {
            project_session: true,
            source: "ai_builder",
            agent_id: builderMode === "app" ? "ai-builder" : "web-builder",
            mode: builderMode,
          },
          preferences: {
            cost_sensitivity: "medium",
            quality_priority: "balanced",
            response_time: "",
            preferred_provider: resolvedPreferredProvider,
            preferred_model: preferredModel === "auto" ? "" : preferredModel,
          },
          instant_response: true,
        }),
      });

      let data: ContinueResponse = await response.json();
      if (response.status === 401) { window.location.href = "/login?reason=session_expired"; return; }
      // 400 "not found" = pre-created session not yet initialized — re-init and retry once
      if (response.status === 400 && (data.detail || "").toLowerCase().includes("not found")) {
        try { await fetch("/api/ai/new-project", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: effectiveSessionId }) }); } catch (e) { /* ignore */ }
        const retry = await fetch("/api/ai/continue", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: effectiveSessionId, question, additional_content: additionalContent ?? "", session_metadata: { project_session: true, source: "ai_builder", agent_id: builderMode === "app" ? "ai-builder" : "web-builder", mode: builderMode }, preferences: { cost_sensitivity: "medium", quality_priority: "balanced", response_time: "", preferred_provider: resolvedPreferredProvider, preferred_model: preferredModel === "auto" ? "" : preferredModel }, instant_response: true }) });
        const retryData: ContinueResponse = await retry.json();
        if (!retry.ok) throw new Error(retryData.detail || "Session re-init failed");
        Object.assign(data, retryData);
      } else if (!response.ok) throw new Error(data.detail || "Failed to continue session");

      // If query is still processing, poll for result
      if ((data.status === "pending" || data.status === "processing") && data.query_id) {
        const queryId = data.query_id;
        setGenerationStatus("pending");
        const MAX_POLL_ATTEMPTS = 180; // 180 × 2s = 6 min
        const MAX_CONSECUTIVE_ERRORS = 5; // circuit breaker — abort after 5 consecutive failures
        let pollAttempts = 0;
        let consecutiveErrors = 0;
        while (pollAttempts < MAX_POLL_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 2000));
          pollAttempts++;
          try {
            const pollRes = await fetch(`/api/ai/query/${queryId}`, { credentials: "include", cache: "no-cache" });
            if (!pollRes.ok) {
              consecutiveErrors++;
              if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                throw new Error(`Query polling failed after ${MAX_CONSECUTIVE_ERRORS} consecutive errors (status ${pollRes.status}). Please try again.`);
              }
              continue;
            }
            consecutiveErrors = 0; // reset on success
            const pollData = await pollRes.json();
            setGenerationStatus(pollData.status);
            if (pollData.status === "completed") {
              data = { ...data, answer: pollData.answer, status: "completed" };
              setGenerationStatus(undefined);
              break;
            }
            if (pollData.status === "failed") {
              throw new Error(pollData.answer || "Generation failed");
            }
          } catch (pollErr) {
            if ((pollErr as Error).message?.includes("consecutive errors")) throw pollErr;
            consecutiveErrors++;
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`Query polling failed after ${MAX_CONSECUTIVE_ERRORS} consecutive errors. Please try again.`);
            }
          }
        }
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          throw new Error("Generation timed out after 6 minutes. Please try again.");
        }
      }

      // Determine the response content based on intent
      let continueResponseContent = data.answer || data.message || "";

      // If backend didn't provide a meaningful response and this is a greeting, use friendly response
      if (!continueResponseContent || continueResponseContent === "Ok, code generation will start shortly.") {
        if (isGreeting(question)) {
          continueResponseContent = "Hello again! 👋 How can I help you with your project? You can ask me to add features, fix issues, or make changes to the code.";
        } else {
          continueResponseContent = "Ok, I'll work on that.";
          setGenerationPending(true); // background generation in-flight
        }
      }

      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "assistant" as const,
              content: continueResponseContent,
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

      // Refetch projects so preview_url is available when user switches to Web Preview
      if (data.answer?.toLowerCase().includes("project files created") ||
        data.answer?.toLowerCase().includes("code folder")) {
        loadProjects();
      }

    } catch (e: unknown) {
      const err = e as Error;
      console.error(err);
      const isStaleDeployment2 = err.message?.includes("Server Action") || err.message?.includes("older or newer deployment");
      const isTimeout2 = err.message?.includes("timed out") || err.message?.includes("504") || err.message?.includes("still processing");
      const userMsg2 = isStaleDeployment2
        ? "The page is outdated. Please press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows) to refresh."
        : isTimeout2
        ? "Generation is taking longer than expected. Please try again — your prompt may need to be shorter."
        : err.message || "Failed to send message";
      toast.error(userMsg2, { duration: isStaleDeployment2 ? 10000 : 6000 });

      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "assistant" as const,
              content: isStaleDeployment2
                ? "⚠️ Page is outdated after a recent update. Please hard-refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)."
                : isTimeout2
                ? "⏱️ Generation took too long. Try again — for large pages, break the request into smaller parts."
                : "Unable to generate a response. Please try again.",
              isError: true,
            }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Streaming send path ───────────────────────────────────────────────────
  // New messages stream over SSE (PRD -> Code -> Files in one pass). The polling/history
  // path below is retained only for restoring an existing project on reload.

  const buildStreamPayload = useCallback(
    (question: string, additionalContent?: string | Record<string, unknown>) => {
      const preferredProvider = getProviderFromModelId(selectedModelId);
      const preferredModel = getModelApiId(selectedModelId);
      const resolvedPreferredProvider =
        preferredProvider === "AI2me" || preferredProvider === "auto" ? "anthropic" : preferredProvider;

      return {
        question,
        additional_content: additionalContent ?? "",
        // The server force-stamps these anyway; sent for parity with the non-stream path.
        session_metadata: {
          project_session: true,
          source: "ai_builder",
          agent_id: builderMode === "app" ? "ai-builder" : "web-builder",
          mode: builderMode,
        },
        preferences: {
          cost_sensitivity: "medium",
          quality_priority: "balanced",
          response_time: "",
          preferred_provider: resolvedPreferredProvider,
          preferred_model: preferredModel === "auto" ? "" : preferredModel,
        },
      };
    },
    [selectedModelId]
  );

  const handleSendMessage = useCallback(
    async (
      message: string,
      additionalContent?: string | Record<string, unknown>,
      attachments?: { name: string; type?: string }[]
    ) => {
      const trimmed = (message || "").trim();
      if (!trimmed) return;

      setStreamBannerError(null);
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "user",
          content: trimmed,
          attachments: attachments?.length ? attachments : undefined,
        },
      ]);
      setIsLoading(true);

      const isStart = isNewProject && !actualSessionId;
      const payload = isStart
        ? { ...buildStreamPayload(trimmed, additionalContent), connector_ids: [] }
        : { ...buildStreamPayload(trimmed, additionalContent), session_id: effectiveSessionId };

      // Reset the finished-query guard so the done-handler fires on every prompt,
      // not just the first one. Without this, second+ prompts in the same session
      // are blocked by the ref guard and never merge streamProject or call loadProjects().
      finishedStreamQueryRef.current = null;
      await startStream(isStart ? "/api/ai/start/stream" : "/api/ai/continue/stream", payload);
    },
    [isNewProject, actualSessionId, effectiveSessionId, buildStreamPayload, startStream]
  );

  /**
   * Full teardown of everything tied to one project view.
   *
   * Every line here exists because something leaked between projects: a stale selected
   * file, a previous project's preview iframe, a finished-stream guard that suppressed
   * the next run.
   */
  const clearProjectViewState = useCallback(() => {
    resetStream();
    setMessages([]);
    setActualSessionId(null);
    setPreviewMode("app");
    setSelectedFile(null);
    setStreamBannerError(null);
    finishedStreamQueryRef.current = null;
    setIsLoading(false);
    setGenerationPending(false);
    setGenerationTimedOut(false);
    hasAppPreviewRef.current = false;
    filesDoneBumpRef.current = false;
    setPreviewRevision(0);
    prevStreamStatusRef.current = "idle";
    prevVersionIdRef.current = null;
    // Reset canonical PreviewState — new generation must re-earn LIVE.
    dispatchPreview({ type: "RESET" });
  }, [resetStream, dispatchPreview]);

  // Landing on /project/new must not inherit the previous project's view.
  useEffect(() => {
    if (sessionId === "new") {
      clearProjectViewState();
    }
    // clearProjectViewState is intentionally omitted: it is stable, and including it
    // would wipe state on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // The stream reports the real session id on `connected`. Adopt it and rewrite the URL
  // in place — router.push would remount the page and kill the in-flight stream.
  useEffect(() => {
    if (!streamConversationId || actualSessionId === streamConversationId) return;
    setActualSessionId(streamConversationId);
    window.history.replaceState(
      {},
      "",
      `/project/${streamConversationId}?mode=${builderMode}`
    );
  }, [streamConversationId, actualSessionId, searchParams]);

  // Stream finished: pull the persisted history and projects so the PRD, file list and
  // preview_url land in the panels that read from them.
  useEffect(() => {
    if (streamStatus !== "done") return;
    const key = streamConversationId || effectiveSessionId;
    if (!key || finishedStreamQueryRef.current === key) return;
    finishedStreamQueryRef.current = key;
    setIsLoading(false);
    setGenerationPending(false);
    // FIX: Immediately merge streamProject into currentProject so hasAppPreview
    // becomes true right away. The pipeline sets preview_url="" at generation time
    // (build happens in background), so loadProjects() alone won't populate it.
    // currentProject.project_id is what gates hasAppPreview and the auto-switch to
    // preview mode — without this, the preview panel never unlocks.
    if (streamProject?.project_id) {
      setCurrentProject((prev) =>
        prev
          ? { ...prev, project_id: streamProject.project_id!, preview_url: streamProject.preview_url || "" }
          : ({ session_id: key, project_id: streamProject.project_id!, preview_url: streamProject.preview_url || "" } as typeof prev)
      );
      setProjects((prev) => {
        const exists = prev.some((p) => p.session_id === key);
        if (exists) {
          return prev.map((p) =>
            p.session_id === key
              ? { ...p, project_id: streamProject.project_id!, preview_url: streamProject.preview_url || p.preview_url || "" }
              : p
          );
        }
        return [
          ...prev,
          { session_id: key, project_id: streamProject.project_id!, preview_url: streamProject.preview_url || "", title: "" } as (typeof prev)[0],
        ];
      });
    }
    void loadProjects();
    void loadChatHistory();
  }, [streamStatus, streamConversationId, effectiveSessionId, streamProject, loadProjects, loadChatHistory]);


  useEffect(() => {
    if (streamStatus === "error") {
      setIsLoading(false);
      setGenerationPending(false);
      // Do not push to streamBannerError: the preview panel renders the error
      // directly, so setting the banner here would produce duplicate error cards.
    }
  }, [streamStatus, streamError]);

  // Poll for preview_url after stream ends — background npm+vite build takes ~90s.
  // Shows "Compiling preview…" spinner instead of a broken empty panel.
  useEffect(() => {
    const hasRealPreview = appPreviewUrl && appPreviewUrl.startsWith("https://");
    const projectId = currentProject?.project_id;
    // Only poll when: stream is done, we have a project_id, but no preview_url yet
    if (streamStatus !== "done" && streamStatus !== "idle") return;
    if (hasRealPreview || !projectId) return;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // 40 × 3s = 2 minutes max
    const poll = async () => {
      if (cancelled || attempts >= MAX_ATTEMPTS) return;
      attempts++;
      try {
        const res = await fetch(`/api/chat/projects?session_id=${effectiveSessionId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        const proj = Array.isArray(data) ? data[0] : data?.projects?.[0];
        if (proj?.preview_url && proj.preview_url.startsWith("https://")) {
          if (!cancelled) {
            setCurrentProject((prev) =>
              prev ? { ...prev, preview_url: proj.preview_url } : prev
            );
          }
          return; // done
        }
      } catch { /* ignore */ }
      if (!cancelled) setTimeout(poll, 3000);
    };
    const t = setTimeout(poll, 3000);
    return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamStatus, currentProject?.project_id, appPreviewUrl]);

  // Hard 15-minute timeout: if generationPending stays true that long,
  // the build process died silently on the server. Surface an error.
  useEffect(() => {
    if (generationPending) {
      generationStartRef.current = Date.now();
      setGenerationTimedOut(false);
      const timer = setTimeout(() => {
        setGenerationPending(false);
        setGenerationTimedOut(true);
      }, 15 * 60 * 1000);
      return () => clearTimeout(timer);
    } else {
      generationStartRef.current = null;
      setGenerationTimedOut(false);
    }
  }, [generationPending]);

    const hasStreamArtifacts =
    Boolean(phases.code.content?.trim()) ||
    Boolean(phases.files.content?.trim()) ||
    steps.length > 0 ||
    codeDeltaFiles.length > 0;

  // Memoized: building this inline with .map() handed ChatMessages a brand-new array
  // on every render, so its auto-scroll effect (keyed on `messages`) fired on every
  // render — including each 3s poll tick — and dragged the scroll position with it.
  const messagesWithStatus = useMemo(
    () => messages.map((m) => (m.isLoading ? { ...m, generationStatus } : m)),
    [messages, generationStatus]
  );

  const showStreamView =
    streamStatus === "connecting" ||
    streamStatus === "streaming" ||
    streamStatus === "error" ||
    (streamStatus === "done" && hasStreamArtifacts);

  // Disable PRD/Web Preview toggle until at least one is generated
  // A real PRD has substantial content (>150 chars). Short acks like
  // "Ok, code generation will start shortly." don't count as a PRD.
  const hasFiles = (isNewProject && !actualSessionId) ? false : Boolean(currentProject?.project_id);
  // mode: read from URL param (?mode=web or ?mode=app). Replaces fragile isAppBuilder detection.
  // Mode comes from URL ?mode= param only.
  // Do NOT infer from agent_id — that was causing Web Builder sessions to show as App Builder.
  // Phase 1: this will be replaced by project.project_type from GET /v1/projects/{id}.
  const builderMode = searchParams.get("mode") || "web";
  // isAppBuilder kept as a display alias — true when mode=app — used only for UI labels.
  const isAppBuilder = builderMode === "app";
  const hasAppPreview = Boolean(currentProject?.project_id) || Boolean(currentProject?.preview_url);
  const hasBuilder = true; // Builder mode always available
  const previewToggleDisabled = !hasAppPreview && !hasFiles && !hasBuilder;

  // Auto-switch: show Web Preview when project_id exists
  useEffect(() => {
    // Code gen done — project_id exists means preview is ready in S3.
    const hasProjectFiles = Boolean(currentProject?.project_id);
    if (hasProjectFiles && !hasAppPreviewRef.current) {
      setPreviewMode("app");
      hasAppPreviewRef.current = true;
      setPreviewRevision((r) => r + 1);
    }
  }, [previewMode, currentProject?.project_id]);

  // NOTE: the `__auto_generate__` follow-up call that used to live here has been removed.
  // It existed because the old request/response flow produced only a PRD and needed a
  // second round-trip to generate code. The stream runs PRD -> Code -> Files in a single
  // pass, so re-triggering on `hasPrd` would kick off a duplicate (and billable) code
  // generation the moment the streamed PRD landed in history.


  if (accessLoading) {
    return (
      <div className="min-h-screen bg-[var(--chat-bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--chat-text-secondary)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canAccessPlayground) {
    // Still loading auth/credits — show spinner instead of blank
    if (accessLoading || !user) {
      return (
        <div className="min-h-screen bg-[var(--chat-bg-primary)] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="h-screen flex bg-[var(--chat-bg-primary)] overflow-hidden">
      {/* Left Icon Sidebar */}
      <NavSidebar
        user={user}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        handleSignOut={handleSignOut}
        router={router}
        handleNewChat={handleNewChat}
        handleAgentAction={handleAgentAction}
        menuAgents={[]}
        // Without these the rail's "Open menu" and search buttons are dead: NavSidebar calls them
        // as `onOpenSidebar?.()`, so an unpassed prop silently no-ops rather than erroring.
        // See /chat, which passes both.
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenSearch={() => setSidebarOpen(true)}
      />

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={mergedSessions}
        projects={projects}
        showProjects={false}
        selectedSessionId={isNewProject && !actualSessionId ? "" : effectiveSessionId}
        onSelectSession={handleSelectSession}
        onSelectProject={handleOpenProject}
        onNewChat={handleNewChat}
        onBoardroomClick={() => router.push("/landing?view=boardroom")}
        onDeleteSession={handleDeleteSession}
        isLoading={isLoadingSessions}
      />

      {/* Main Content Area */}
      <div className="lg:pl-20 flex flex-col flex-1 min-w-0 h-full relative transition-all duration-300 ease-in-out">
        <div
          className="flex-1 flex flex-col min-w-0 h-full"
        >
          {/* Header */}
          <MinimalHeader
            sidebarOpen={sidebarOpen}
            onOpenSidebar={() => setSidebarOpen(true)}
            projectTitle={currentProject?.title || (isNewProject && !actualSessionId ? "New Project" : undefined)}
            projectSubtitle={currentProject?.title ? (isAppBuilder ? "App Builder" : "Web Builder") : undefined}
            sessionId={effectiveSessionId !== "new" ? effectiveSessionId : undefined}
            onRenameProject={effectiveSessionId !== "new" ? handleRenameProject : undefined}
          />

          {/* Page Content: Two-column Project layout */}
          <div className="flex-1 flex flex-row overflow-hidden">
            {/* Left: Chat — full width on mobile, 38% on desktop */}
            <div className="w-full lg:w-[38%] lg:max-w-[420px] lg:border-r border-[var(--chat-border)] flex flex-col min-h-0 bg-[var(--chat-bg-primary)] lg:flex-shrink-0 overflow-x-hidden overflow-y-hidden">
              <header className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--chat-text-primary)] truncate flex items-center gap-2">
                      {isAppBuilder ? "App Builder" : "Web Builder"}
                    </div>
                    <div className="text-xs text-[var(--chat-text-muted)] truncate">
                      {user?.full_name ? `Chatting as ${user.full_name}` : "Chat"}
                    </div>
                  </div>
                </header>

              {isLoadingHistory && messages.length === 0 && !showStreamView ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[var(--chat-text-secondary)] text-sm">Loading conversation...</p>
                  </div>
                </div>
              ) : (
                <div className={`flex-1 flex flex-col min-h-0 ${isTransitioning ? "opacity-95" : ""}`}>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden chat-scrollbar">
                    <div className="max-w-4xl mx-auto pb-4 px-2">
                      <div className="mx-2 mt-3">
                        <PhaseProgressBar phases={phases} visible={showStreamView} streamFailed={streamStatus === "error"} />
                      </div>

                      <ChatMessages messages={messagesWithStatus} />
                      {showStreamView && (
                        <AIResponseView
                          phases={phases}
                          steps={steps}
                          codeDeltaFiles={codeDeltaFiles}
                          status={streamStatus}
                          error={streamBannerError}
                          delayed={streamDelayed}
                          onRetry={retryStream}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="relative lg:sticky lg:bottom-0 p-4 border-t border-[var(--chat-border)] bg-[var(--chat-bg-primary)] z-10 overflow-x-hidden">
                {/* Mobile Preview Trigger (Image Reference style) */}
                <div className="lg:hidden mb-4">
                  <button
                    onClick={() => setIsMobilePreviewOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] rounded-xl hover:bg-[var(--chat-bg-hover)] transition-all text-left"
                  >
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-[var(--chat-text-primary)]">Preview</div>
                      <div className="text-[10px] text-[var(--chat-text-muted)]">
                        {isAppBuilder ? "Live App Preview" : "Live Web Preview"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-[var(--chat-text-muted)]" />
                      <div className="flex items-center p-1 bg-[var(--chat-bg-tertiary)] rounded-lg border border-[var(--chat-border)]">
                        <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${previewMode === 'app' ? 'bg-[var(--chat-bg-primary)] text-[var(--chat-text-primary)] shadow-sm' : 'text-[var(--chat-text-muted)]'}`}>
                          {isAppBuilder ? "App" : "Web"}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
                <ChatInput onSend={handleSendMessage} isLoading={isLoading} placeholder="What are we creating Today ...." />
              </div>
            </div>

            {/* Right: Preview Area — hidden on mobile until triggered, always visible on desktop */}
            <div className={`
              ${isMobilePreviewOpen
                ? "fixed inset-0 z-[100] flex animate-in slide-in-from-bottom duration-300"
                : "hidden lg:flex"}
               flex-1 min-w-0 bg-[var(--chat-bg-primary)] flex-col min-h-0 lg:border-l border-[var(--chat-border)]
            `}>
              <header className="px-6 py-3 border-b border-[var(--chat-border)] flex items-center justify-between bg-[var(--chat-bg-primary)]">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-[var(--chat-text-primary)] flex items-center gap-2">
                    Preview
                    {/* LIVE: canonical reducer requires kind=ready AND iframeStatus=loaded.
                         No other variables (deployStatus, appPreviewUrl, iframeLoaded) gate this. */}
                    {previewMode === "app" && previewState.kind === "ready" && previewState.iframeStatus === "loaded" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full font-bold uppercase tracking-wider">Live</span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--chat-text-muted)]">
                    {previewMode === "app" ? (isAppBuilder ? "App Preview" : "Web Preview") : previewMode === "code" ? "Code Files" : "Project Files"}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* PRD copy/download removed — Web Builder has no PRD */}
                  <div
                    className={`flex items-center gap-2 ${previewToggleDisabled ? "cursor-help" : ""}`}
                    onMouseEnter={() => previewToggleDisabled && setPreviewTooltipOpen(true)}
                    onMouseLeave={() => setPreviewTooltipOpen(false)}
                  >
                    {previewTooltipOpen && previewToggleDisabled && (
                      <span
                        className="absolute right-0 top-full mt-2 px-3 py-2 w-56 text-right text-xs font-normal text-[var(--chat-text-primary)] bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] rounded-lg shadow-lg z-50 pointer-events-none"
                        role="tooltip"
                      >
                        <span className="absolute right-4 bottom-full -mb-px border-8 border-transparent border-b-[var(--chat-bg-secondary)]" />
                        This toggle will be enabled once the PRD is generated or the web preview is ready.
                      </span>
                    )}
                    <div
                      className={`flex items-center p-1 border rounded-lg ${previewToggleDisabled
                        ? "bg-[var(--chat-bg-tertiary)] border-[var(--chat-border)] opacity-60 cursor-not-allowed"
                        : "bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)]"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!previewToggleDisabled) {
                            setPreviewMode("app");
                            pollRestartRef.current += 1;
                          }
                        }}
                        disabled={previewToggleDisabled}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${previewMode === "app"
                          ? "bg-[var(--chat-bg-primary)] text-[var(--chat-text-primary)] shadow-sm"
                          : "text-[var(--chat-text-muted)] hover:text-[var(--chat-text-secondary)]"
                          } disabled:pointer-events-none disabled:opacity-70`}
                      >
                        <Globe size={14} />
                        {isAppBuilder ? "App Preview" : "Web Preview"}
                      </button>
                      {/* PRD tab REMOVED — Web Builder does not generate PRDs */}
                      {/* Files tab hidden — Code tab shows the same file tree */}
                      {/* Builder tab hidden — temporarily disabled */}
                      {/* Code tab — appears once code generation is done */}
                      {hasFiles && (
                        <button
                          type="button"
                          onClick={() => setPreviewMode("code")}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            previewMode === "code"
                              ? "bg-[var(--chat-bg-primary)] text-[var(--chat-text-primary)] shadow-sm"
                              : "text-[var(--chat-text-muted)] hover:text-[var(--chat-text-secondary)]"
                          }`}
                        >
                          <Code2 size={14} />
                          Code
                        </button>
                      )}
                      {/* Visual tab — optional canvas mode (Lovable-style power user) */}
                      <button
                        type="button"
                        onClick={() => setPreviewMode("builder")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          previewMode === "builder"
                            ? "bg-[var(--chat-bg-primary)] text-[var(--chat-text-primary)] shadow-sm"
                            : "text-[var(--chat-text-muted)] hover:text-[var(--chat-text-secondary)]"
                        }`}
                      >
                        <LayoutGrid size={14} />
                        Visual
                      </button>
                    </div>
                  </div>

                  {/* GitHub Export button — visible on Web Preview tab */}
                  {/* GitHub Export — always rendered for layout stability, active only on Web Preview */}
                  <div className={previewMode === "app" && hasAppPreview ? "" : "invisible pointer-events-none"}>
                    <ExportToGithubButton previewUrl={appPreviewUrl} projectId={currentProject?.project_id} />
                  </div>

                  {/* Close button for Mobile Overlay */}
                  <button
                    onClick={() => setIsMobilePreviewOpen(false)}
                    className="lg:hidden p-2 rounded-lg bg-[var(--chat-bg-secondary)] text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] border border-[var(--chat-border)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div className="relative flex-1 min-h-0" ref={rightPanelRef}>
                {isLoadingHistory && !hasFiles ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-[var(--chat-text-muted)]">Loading project…</p>
                    </div>
                  </div>
                ) : streamStatus === "error" && streamError ? (
                  /* Terminal failure — show error panel immediately; do not spin */
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--chat-text-primary)] mb-1">Generation failed</p>
                        <p className="text-xs text-[var(--chat-text-muted)] leading-relaxed font-mono break-all">{streamError}</p>
                      </div>
                      <button
                        onClick={retryStream}
                        className="px-4 py-2 rounded-lg bg-[var(--chat-accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : previewMode === "app" && previewState.kind === "building" ? (
                  // ── Building branch ──────────────────────────────────────────────────────────
                  // Covers: generation in-flight, SSE disconnect (polling fallback), npm/vite running.
                  // generationPending/generationTimedOut are preserved for the chat-side spinner only.
                  <div className="h-full flex items-center justify-center">
                    {generationTimedOut ? (
                      <div className="flex flex-col items-center gap-4 max-w-xs text-center">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--chat-text-primary)] mb-1">Build timed out</p>
                          <p className="text-xs text-[var(--chat-text-muted)] leading-relaxed">The build process stopped responding. This can happen with complex apps or temporary server issues.</p>
                        </div>
                        <button
                          onClick={() => { setGenerationTimedOut(false); window.location.href = "/project/new"; }}
                          className="px-4 py-2 rounded-lg bg-[var(--chat-accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          Start over
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 max-w-xs text-center">
                        <div className="relative">
                          <div className="w-12 h-12 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-[var(--chat-accent)]/30 border-t-transparent rounded-full animate-spin" style={{animationDirection:'reverse'}} />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--chat-text-primary)] mb-1">
                            {generationPending ? "Building your website…" : "Compiling preview…"}
                          </p>
                          <p className="text-xs text-[var(--chat-text-muted)]">
                            {generationPending
                              ? "The AI is writing and assembling your code. Complex apps take longer — you\'ll see live file progress on the left."
                              : previewState.phase
                                ? `Pipeline phase: ${previewState.phase} — checking every few seconds…`
                                : "Files are ready. npm install + Vite build running in the background — usually takes 60–90 seconds."}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[0,1,2].map((i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--chat-accent)] animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : previewMode === "app" && previewState.kind === "failed" ? (
                  // ── Failed branch ─────────────────────────────────────────────────────────────
                  // Covers: render gate failed, npm/vite failure, iframe load failure.
                  // code = IFRAME_LOAD_FAILED when the iframe itself errored.
                  // Never falls through to blank panel.
                  <div className="h-full flex items-center justify-center p-8 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--chat-text-primary)] mb-1">Failed</p>
                        <p className="text-xs text-[var(--chat-text-muted)] leading-relaxed">
                          {previewState.reason}
                        </p>
                        {previewState.code && previewState.code !== "IFRAME_LOAD_FAILED" && (
                          <p className="mt-1 text-[10px] text-[var(--chat-text-muted)] font-mono">{previewState.code}</p>
                        )}
                      </div>
                      <button
                        onClick={retryStream}
                        className="px-4 py-2 rounded-lg bg-[var(--chat-accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : previewMode === "app" && previewState.kind === "ready" ? (
                  // ── Ready branch ──────────────────────────────────────────────────────────────
                  // LIVE badge requires iframeStatus === "loaded" (set by onLoadSuccess).
                  // onLoadFailure dispatches IFRAME_ERROR → reducer transitions to failed.
                  // A prior version URL can never appear here: VERSION_CHANGE resets to building.
                  <AppPreview
                    key={`${previewState.url}-${previewState.versionId}`}
                    url={previewState.url}
                    sessionId={effectiveSessionId || undefined}
                    projectId={currentProject?.project_id || undefined}
                    authToken={authToken}
                    revision={previewRevision}
                    versionId={previewState.versionId}
                    onLoadSuccess={() => {
                      dispatchPreview({ type: "IFRAME_LOADED" });
                    }}
                    onLoadFailure={() => {
                      dispatchPreview({ type: "IFRAME_ERROR" });
                    }}
                  />
                ) : previewMode === "app" ? (
                  // ── App tab but no previewState match yet ─────────────────────────────────────
                  // Blank-panel guard: show pipeline status while awaiting first SSE/poll event.
                  <div className="h-full flex items-center justify-center p-8 text-center">
                    <PipelineStatusPanel deployStatus={deployStatus} />
                  </div>
                ) : previewMode === "code" ? (
                  <div className="flex h-full">
                    <div className="w-64 border-r border-[var(--chat-border)] bg-[var(--chat-bg-secondary)]">
                      <FileExplorer sessionId={effectiveSessionId} onFileSelect={setSelectedFile} />
                    </div>
                    <div className="flex-1">
                      <FileViewer sessionId={effectiveSessionId} file={selectedFile} />
                    </div>
                  </div>
                ) : previewMode === "builder" ? (
                  <WebsiteBuilderCanvas sessionId={effectiveSessionId} />
                ) : !hasFiles ? (
                  // The Files tab is always visible, but there is nothing to list until a
                  // project exists. Without this, FileExplorer would fetch
                  // /api/chat/projects/new/files and render "Failed to load project files".
                  <div className="h-full flex items-center justify-center p-8 text-center">
                    <div className="flex flex-col items-center gap-3 max-w-xs">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--chat-accent)]/10 flex items-center justify-center">
                        <FolderOpen size={22} className="text-[var(--chat-accent)]" />
                      </div>
                      <p className="text-sm font-semibold text-[var(--chat-text-primary)]">
                        No project files yet
                      </p>
                      <p className="text-xs text-[var(--chat-text-secondary)]">
                        Send a prompt on the left. Generated files will show up here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full">
                    <div className="w-64 border-r border-[var(--chat-border)] bg-[var(--chat-bg-secondary)]">
                      <FileExplorer sessionId={effectiveSessionId} onFileSelect={setSelectedFile} />
                    </div>
                    <div className="flex-1">
                      <FileViewer sessionId={effectiveSessionId} file={selectedFile} />
                    </div>
                  </div>
                )}

                {/* Scroll-to-bottom arrow — right panel, non-PRD tabs */}
                {showRightScrollBtn && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = rightPanelRef.current;
                      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
                    }}
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20
                      flex items-center justify-center w-8 h-8 rounded-full
                      bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)]
                      text-[var(--chat-text-muted)] shadow-lg
                      hover:bg-[var(--chat-accent)] hover:text-white hover:border-[var(--chat-accent)]
                      transition-all duration-150 animate-in fade-in slide-in-from-bottom-1"
                    aria-label="Scroll to bottom"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



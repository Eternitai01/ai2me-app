"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import {
  User, LogOut, CreditCard, LayoutDashboard,
  LayoutGrid, Presentation, Table, FileText, Code2,
  Palette, MessageSquare, Image as ImageIcon, Music,
  Video, NotebookPen, Sparkles, Plus, Home, Inbox,
  Layers, Folder, Gift, Camera, Scissors, AudioLines, Paintbrush
} from "lucide-react";

import "@/styles/chat-theme.css";
import "@/styles/chat-provider-themes.css";

import {
  ChatInput,
  ChatMessages,
  ChatSidebar,
  NavSidebar,

  ThemeToggle,
  WelcomeScreen,
  ModelSelector,
  AVAILABLE_MODELS,
  getModelApiId,
  getProviderFromModelId,
  MENU_AGENTS,
  QUICK_AGENTS,
  LiquidCircleButton,
  MinimalHeader,
  type AIModel,
  type Message,
  type Agent,
  type AgentSection,
} from "@/components/chat";


import chatHistoryService, { ChatSession, ProjectSummary } from "@/app/api/chatHistory";
import { usePlaygroundAccess } from "@/hooks/use-playground-access";
import { useAuth } from "@/context/AuthContext";
import { useProviderTheme } from "@/hooks/use-provider-theme";

const AIChatIcon = (props: any) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-4-7.5" />
    <path d="M8 20l-4 2 1-4" />
    <path d="M8 15l2-6 2 6" />
    <line x1="9" y1="13" x2="11" y2="13" />
    <line x1="14" y1="9" x2="14" y2="15" />
  </svg>
);

// API Response types
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
};

type ContinueResponse = {
  session_id: string;
  query_id?: string;
  status?: string;
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
};



function QuickAgentsBar({
  agents,
  onAgentAction,
}: {
  agents: Agent[];
  onAgentAction: (name: string) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="w-full py-4 relative">
      <div className="flex flex-wrap items-start justify-center gap-x-4 sm:gap-x-8 gap-y-4 sm:gap-y-6 px-4">
        {agents.map((agent, idx) => (
          <div key={idx} className="relative flex flex-col items-center">
            {/* Tooltip */}
            {hoveredIdx === idx && agent.description && (
              <div className="
                fixed md:absolute 
                bottom-28 md:bottom-full 
                left-1/2 -translate-x-1/2 
                md:mb-6
                w-[92vw] md:w-64
                p-3 bg-[var(--chat-bg-tertiary)] border border-[var(--chat-border)]
                rounded-xl shadow-2xl z-[999]
                chat-message-enter pointer-events-none
              ">
                <ul className="space-y-2">
                  {agent.description.map((line: string, lIdx: number) => (
                    <li key={lIdx} className="flex items-start gap-2 text-xs text-[var(--chat-text-primary)]">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--chat-text-muted)] flex-shrink-0" />
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
                {/* Arrow - Desktop only since mobile is fixed centered */}
                <div className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-[var(--chat-bg-tertiary)]" />
              </div>
            )}

            <div
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex flex-col items-center gap-2 group transition-all duration-200 hover:scale-105"
            >
              <div className="relative">
                <LiquidCircleButton
                  liquidColor={agent.iconColor}
                  className="!w-10 !h-10 sm:!w-12 sm:!h-12"
                  onClick={() => onAgentAction(agent.name)}
                  offsetX={-0.4}
                  offsetY={-0.1}
                >
                  <agent.icon className="w-5 h-5" />
                </LiquidCircleButton>
                {agent.badge && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-yellow-400 rounded-full shadow-sm z-10">
                    <span className="text-[8px] font-black text-black leading-none uppercase">
                      {agent.badge}
                    </span>
                  </div>
                )}
                {agent.dot && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--chat-bg-primary)] shadow-sm z-10" />
                )}
              </div>
              <span className="text-[10px] font-medium text-[var(--chat-text-secondary)] group-hover:text-[var(--chat-text-primary)] transition-colors text-center max-w-[70px] whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer"
                onClick={() => onAgentAction(agent.name)}>
                {agent.name}
              </span>
            </div>



          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut, loading: authLoading, isAuthenticated } = useAuth();
  const { canAccessPlayground, isLoading: accessLoading, refreshAccess } = usePlaygroundAccess();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Model Selection State - single source of truth
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-sonnet-4-6");
  const initialQueryHandledRef = useRef<string>("");
  const newChatClickRef = useRef(false);
  const isAiChatRoute = pathname === "/ai-chat";
  const currentRoute = isAiChatRoute ? "/ai-chat" : "/chat";

  // Provider Theme - applies LLM-specific UI styling
  const { isTransitioning } = useProviderTheme(getProviderFromModelId(selectedModelId));

  // Chat History State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [hasLoadedSessionIndex, setHasLoadedSessionIndex] = useState(false);

  // Check playground access on mount
  useEffect(() => {
    const checkAccess = async () => {
      const hasAccess = await refreshAccess();
      if (!hasAccess) {
        router.push("/dashboard/credits");
      }
    };
    checkAccess();
  }, [router, refreshAccess]);

  // Load chat sessions callback
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
    // Tag any chatSession that's actually a builder project
    const builderSessionIds = new Set(projects.map((p) => p.session_id));
    const taggedChatSessions = chatSessions.map((s) =>
      // Tag as builder if: (a) in projects list, OR (b) API already returned agent_id=ai-builder or web-builder
      (builderSessionIds.has(s.session_id) || s.agent_id === "ai-builder" || s.agent_id === "web-builder")
        ? { ...s, agent_id: s.agent_id === "web-builder" ? "web-builder" : "ai-builder" }
        : s
    );
    const seen = new Set(taggedChatSessions.map((session) => session.session_id));
    const projectSessions: ChatSession[] = projects
      .filter((project) => !seen.has(project.session_id))
      .map((project) => ({
        session_id: project.session_id,
        title: project.title || project.project_id || "Web Builder",
        preview: project.project_id,
        created_at: project.created_at,
        updated_at: project.updated_at,
        message_count: 0,
        agent_id: project.agent_id || "ai-builder",
      }));

    return [...taggedChatSessions, ...projectSessions].sort((a, b) => {
      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      return bTime - aTime;
    });
  }, [chatSessions, projects]);

  // Model change handler
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const loadChatHistory = useCallback(async (sessionIdToLoad: string) => {
    setIsLoadingHistory(true);
    try {
      const history = await chatHistoryService.getChatHistory(sessionIdToLoad);
      if (!history) {
        toast.error("Format of history not recognized or session not found.");
        return;
      }
      const loadedMessages: Message[] = [];
      for (const msg of history.messages) {
        const base: Message = {
          id: msg.id,
          type: msg.type === "outgoing" ? "user" : "assistant",
          content: msg.text,
          timestamp: msg.timestamp,
          attachments: msg.attachments as any,
          providerName: msg.ai_metadata?.provider,
          model: msg.ai_metadata?.model,
        };
        loadedMessages.push(base);

      }

      setMessages(loadedMessages);
      setSessionId(sessionIdToLoad);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Load chat sessions — wait for auth to be ready to avoid race with token not yet in localStorage
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let isActive = true;
    const initializeSessionIndex = async () => {
      // Always refresh token before fetching — guards against stale cached tokens
      await chatHistoryService.ensureToken();
      await Promise.all([loadChatSessions(), loadProjects()]);
      if (isActive) {
        setHasLoadedSessionIndex(true);
      }
    };

    initializeSessionIndex();

    // Open sidebar by default on desktop
    // if (typeof window !== "undefined" && window.innerWidth >= 1024) {
    //   setSidebarOpen(true);
    // }

    return () => {
      isActive = false;
    };
  }, [loadChatSessions, loadProjects, authLoading, isAuthenticated]);

  const resolveRouteForAgent = (agentId?: string | null) => {
    if (agentId === "ai-chat") return "/ai-chat";
    if (agentId === "chat") return "/chat";
    if (agentId === "ai-sheets") return "/ai-sheets";
    if (agentId === "ai-docs") return "/ai-docs";
    if (agentId === "ai-slides") return "/ai-slides";
    return currentRoute;
  };

  const buildSessionUrl = (route: string, sessionIdToLoad: string, agentId?: string | null) => {
    const params = new URLSearchParams();
    params.set("session_id", sessionIdToLoad);
    if (agentId) {
      params.set("agent_id", agentId);
    }
    return `${route}?${params.toString()}`;
  };

  const handleSelectSession = (sessionIdToLoad: string, agentId?: string | null) => {
    // Always route to project page if this session is a builder project or has PRD content
    const isBuilderProject = projects.some((p) => p.session_id === sessionIdToLoad);
    const isBuilderSession = mergedSessions.find((s) => s.session_id === sessionIdToLoad)?.agent_id === "ai-builder"
      || mergedSessions.find((s) => s.session_id === sessionIdToLoad)?.agent_id === "web-builder";
    if (agentId === "ai-builder" || agentId === "web-builder" || isBuilderProject || isBuilderSession) {
      // Use the project's stored agent_id; old sessions have ai-builder stored but are Web Builder
      const project = projects.find((p) => p.session_id === sessionIdToLoad);
      const storedAgentId = project?.agent_id;
      const effectiveAgentId = storedAgentId === "web-builder" ? "web-builder"
        : agentId === "ai-builder" ? "ai-builder"  // explicitly opened as App Builder
        : "web-builder";                             // everything else = Web Builder
      router.push(`/project/${sessionIdToLoad}?agent_id=${effectiveAgentId}`);
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
      router.push(`/ai-slides?session_id=${sessionIdToLoad}`);
      return;
    }

    const targetRoute = resolveRouteForAgent(agentId);
    const targetUrl = buildSessionUrl(targetRoute, sessionIdToLoad, agentId);

    if (targetRoute !== currentRoute) {
      router.push(targetUrl);
      return;
    }

    router.replace(targetUrl);
    loadChatHistory(sessionIdToLoad);
  };


  useEffect(() => {
    // User just clicked New chat: force clear and ignore stale URL params
    if (newChatClickRef.current) {
      newChatClickRef.current = false;
      setSessionId("");
      setMessages([]);
      return;
    }

    const urlSessionId = searchParams.get("session_id");
    const urlAgentId = searchParams.get("agent_id");
    
    // If no session_id in URL, clear state only when we have no messages
    // (avoids clearing right after callStart sets sessionId before URL has updated)
    if (!urlSessionId) {
      if (sessionId && messages.length === 0) {
        setSessionId("");
        setMessages([]);
      }
      return;
    }

    if (urlAgentId === "ai-builder") {
      router.replace(`/project/${urlSessionId}?agent_id=ai-builder`);
      return;
    }

    const targetRoute = resolveRouteForAgent(urlAgentId);
    if (targetRoute !== currentRoute) {
      router.replace(buildSessionUrl(targetRoute, urlSessionId, urlAgentId));
      return;
    }

    if (!hasLoadedSessionIndex) {
      return;
    }

    const sessionExists = mergedSessions.some(
      (session) => session.session_id === urlSessionId
    );
    const isCurrentActiveSession = urlSessionId === sessionId;

    if (!sessionExists && !isCurrentActiveSession) {
      setSessionId("");
      setMessages([]);
      router.replace(currentRoute);
      return;
    }

    if (urlSessionId !== sessionId) {
      loadChatHistory(urlSessionId);
    }
  }, [searchParams, currentRoute, sessionId, messages.length, loadChatHistory, mergedSessions, router, hasLoadedSessionIndex]);

  const handleNewChat = () => {
    newChatClickRef.current = true;
    setSessionId("");
    setMessages([]);
    // Use pathname only so query params (session_id, agent_id) are always removed.
    const target = pathname || currentRoute;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", target);
    }
    router.replace(target);
    router.refresh();
  };

  const handleOpenProject = (projectSessionId: string) => {
    router.push(`/project/${projectSessionId}`);
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    try {
      const success = await chatHistoryService.deleteChatSession(sessionIdToDelete);
      if (success) {
        setChatSessions((prev: ChatSession[]) =>
          prev.filter((s: ChatSession) => s.session_id !== sessionIdToDelete)
        );
        setProjects((prev: ProjectSummary[]) =>
          prev.filter((project: ProjectSummary) => project.session_id !== sessionIdToDelete)
        );
        if (sessionId === sessionIdToDelete) {
          handleNewChat();
        }
        toast.success("Chat deleted");
      } else {
        toast.error("Failed to delete chat");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
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
      setChatSessions((prev: ChatSession[]) =>
        prev.map((s) =>
          s.session_id === sessionIdToRename ? { ...s, title: updated.title } : s
        )
      );
      setProjects((prev: ProjectSummary[]) =>
        prev.map((p) =>
          p.session_id === sessionIdToRename ? { ...p, title: updated.title } : p
        )
      );
      toast.success("Chat renamed");
    } catch (error) {
      console.error("Failed to rename session:", error);
      toast.error("Failed to rename chat");
    }
  };

  const callStart = useCallback(async (question: string, modelIdOverride?: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string; url?: string }[]) => {
    const userMessageId = crypto.randomUUID();
    const loadingMessageId = crypto.randomUUID();

    setMessages((prev: Message[]) => [
      ...prev,
      { id: userMessageId, type: "user", content: question, attachments: attachments?.length ? attachments : undefined },
      { id: loadingMessageId, type: "assistant", content: "", isLoading: true },
    ]);

    setIsLoading(true);
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
            agent_id: isAiChatRoute ? "ai-chat" : "chat",
          },
          preferences: {
            cost_sensitivity: "medium",
            quality_priority: "balanced",
            response_time: "",
            preferred_provider: resolvedPreferredProvider,
            preferred_model: resolvedPreferredModel,
          },
          attachments,
          instant_response: false,
        }),
      });

      const data: StartResponse & { detail?: string } = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to start session");

      setSessionId(data.session_id);

      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "assistant" as const,
              content: data.ai_response || "No response received",
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

      await loadChatSessions();
      await loadProjects();

    } catch (e: unknown) {
      const err = e as Error;
      console.error(err);
      toast.error(err.message || "Failed to send message");

      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "assistant" as const,
              content: "Unable to generate a response. Please try again.",
              isError: true,
            }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAiChatRoute, loadChatSessions, loadProjects, selectedModelId]);

  const callContinue = useCallback(async (question: string, modelIdOverride?: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string; url?: string }[]) => {
    if (!sessionId) {
      await callStart(question, modelIdOverride, additionalContent, attachments);
      return;
    }

    const userMessageId = crypto.randomUUID();
    const loadingMessageId = crypto.randomUUID();

    setMessages((prev: Message[]) => [
      ...prev,
      { id: userMessageId, type: "user", content: question, attachments: attachments?.length ? attachments : undefined },
      { id: loadingMessageId, type: "assistant", content: "", isLoading: true },
    ]);

    setIsLoading(true);
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
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" && localStorage.getItem("ai2me_backend_token")
            ? { "Authorization": `Bearer ${localStorage.getItem("ai2me_backend_token")}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          session_id: sessionId,
          question,
          additional_content: additionalContent ?? "",
          preferences: {
            cost_sensitivity: "medium",
            quality_priority: "balanced",
            response_time: "",
            preferred_provider: resolvedPreferredProvider,
            preferred_model: resolvedPreferredModel,
          },
          attachments,
          instant_response: false,
        }),
      });

      const data: ContinueResponse & { detail?: string } = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to continue session");

      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "assistant" as const,
              content: data.answer || "No response received",
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
    } catch (e: unknown) {
      const err = e as Error;
      console.error(err);
      toast.error(err.message || "Failed to send message");

      setMessages((prev: Message[]) =>
        prev.map((msg: Message) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "assistant" as const,
              content: "Unable to generate a response. Please try again.",
              isError: true,
            }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [callStart, selectedModelId, sessionId]);

  const handleSendMessage = useCallback(async (message: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string; url?: string }[], modelIdOverride?: string) => {
    if (sessionId) {
      await callContinue(message, modelIdOverride, additionalContent, attachments);
    } else {
      await callStart(message, modelIdOverride, additionalContent, attachments);
    }
  }, [callContinue, callStart, sessionId]);

  const LANDING_PENDING_KEY = "landing-pending-message";

  useEffect(() => {
    const urlSessionId = searchParams.get("session_id");
    if (urlSessionId || sessionId || isLoading) return;

    const fromLanding = searchParams.get("from_landing") === "1";
    if (fromLanding && typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(LANDING_PENDING_KEY);
        if (raw) {
          const payload = JSON.parse(raw) as {
            message?: string;
            additionalContent?: string | Record<string, unknown>;
            attachments?: { name: string; type?: string }[];
            model?: string;
          };
          sessionStorage.removeItem(LANDING_PENDING_KEY);
          const message = (payload.message || "").trim();
          if (message) {
            const resolvedModelId =
              payload.model && AVAILABLE_MODELS.some((m) => m.id === payload.model)
                ? payload.model
                : "auto";
            const messageKey = `landing::${message}::${resolvedModelId}`;
            if (initialQueryHandledRef.current !== messageKey) {
              initialQueryHandledRef.current = messageKey;
              setSelectedModelId(resolvedModelId);
              const expectedAgentId = isAiChatRoute ? "ai-chat" : "chat";
              router.replace(`${currentRoute}?agent_id=${expectedAgentId}`);
              (async () => {
                await handleSendMessage(
                  message,
                  payload.additionalContent,
                  payload.attachments,
                  resolvedModelId
                );
              })();
            }
          }
          return;
        }
      } catch (e) {
        console.warn("Failed to read landing pending message", e);
      }
    }

    const initialMessage = (searchParams.get("message") || "").trim();
    if (!initialMessage) return;

    const modelFromUrl = searchParams.get("model");
    const resolvedModelId = modelFromUrl && AVAILABLE_MODELS.some((m) => m.id === modelFromUrl)
      ? modelFromUrl
      : "auto";

    const messageKey = `${initialMessage}::${resolvedModelId}`;
    if (initialQueryHandledRef.current === messageKey) return;
    initialQueryHandledRef.current = messageKey;

    setSelectedModelId(resolvedModelId);

    (async () => {
      await handleSendMessage(initialMessage, undefined, undefined, resolvedModelId);
    })();
  }, [searchParams, sessionId, isLoading, handleSendMessage]);

  // Sync URL when we have a session (e.g. after first AI response) so the link is shareable and survives refresh
  useEffect(() => {
    if (!sessionId) return;
    const urlSessionId = searchParams.get("session_id");
    const urlAgentId = searchParams.get("agent_id");
    const expectedAgentId = isAiChatRoute ? "ai-chat" : "chat";
    if (urlSessionId === sessionId && urlAgentId === expectedAgentId) return;
    router.replace(buildSessionUrl(currentRoute, sessionId, expectedAgentId));
  }, [sessionId, searchParams, currentRoute, isAiChatRoute, router]);

  const handleFeedback = async (messageId: string, rating: "up" | "down") => {
    console.log("Feedback:", messageId, rating);
    toast.success("Thanks for your feedback!");
  };

  const handleOpenDeveloper: () => void = () => {
    router.push("/project/new");
  };

  const handleAgentAction = (agentName: string) => {
    if (agentName === "App Builder") {
      router.push("/ai-builder");
      return;
    }
    if (agentName === "Web Builder") {
      handleOpenDeveloper();
      return;
    }
    if (agentName === "AI Chat") {
      handleNewChat();
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
    handleNewChat();
  };

  const handleSignOut = async () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.removeItem("chat-theme");

    await signOut();
    // Redirect to home page after sign out
    router.push("/");
  };

  // Loading state
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

  // No access state
  if (!canAccessPlayground) {
    return null;
  }

  return (
    <div className="h-screen flex bg-[var(--chat-bg-primary)]">
      {/* Left Icon Sidebar */}
      <NavSidebar
        user={user}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        handleSignOut={handleSignOut}
        router={router}
        handleNewChat={handleNewChat}
        handleAgentAction={handleAgentAction}
        menuAgents={isAiChatRoute ? [] : MENU_AGENTS}
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
        selectedSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onSelectProject={handleOpenProject}
        onNewChat={handleNewChat}
        onBoardroomClick={() => router.push("/landing?view=boardroom")}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isLoading={isLoadingSessions}
        user={user}
      />

      {/* Main Content */}
      <div className="lg:pl-20 flex w-full">
        <div
          className={`
          flex-1 flex flex-col min-w-0
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "lg:ml-80" : "ml-0"}
        `}
        >
          {/* Minimal Header */}
          <MinimalHeader
            sidebarOpen={sidebarOpen}
            onOpenSidebar={() => setSidebarOpen(true)}
          />

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col min-h-0 ${isTransitioning ? "opacity-95" : ""}`}>
            {/* Empty state: Lovable-style centered input + controls */}
            {messages.length === 0 && !isLoadingHistory ? (
              <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32 sm:pb-20">
                <div className="w-full max-w-3xl mx-auto mt-4">
                  <WelcomeScreen userName={user?.full_name} provider={getProviderFromModelId(selectedModelId)} />

                  <div className="mt-4 space-y-2">
                    {/* Input Area */}
                    {isAiChatRoute ? (
                      <ChatInput
                        onSend={handleSendMessage}
                        isLoading={isLoading}
                        animatePlaceholder
                        modelSelector={
                          <ModelSelector
                            selectedModelId={selectedModelId}
                            onModelChange={handleModelChange}
                            autoOnly={false}
                          />
                        }
                      />
                    ) : (
                      <>
                        <ChatInput
                          onSend={handleSendMessage}
                          isLoading={isLoading}
                          animatePlaceholder
                          modelSelector={
                            <ModelSelector
                              selectedModelId={selectedModelId}
                              onModelChange={handleModelChange}
                              autoOnly={false}
                            />
                          }
                        />
                        <div className="flex flex-col items-center justify-center w-full">
                          <div className="mt-6 w-full max-w-4xl">
                            <QuickAgentsBar agents={QUICK_AGENTS} onAgentAction={handleAgentAction} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : isLoadingHistory ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-[var(--chat-accent)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[var(--chat-text-secondary)] text-sm">Loading conversation...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto pb-4">
                  <ChatMessages messages={messages} onFeedback={handleFeedback} />
                </div>
              </div>
            )}
          </div>

          {/* Non-empty state: bottom input - sticky at bottom */}
          {messages.length > 0 && (
            <div className="fixed bottom-16 left-0 right-0 lg:sticky lg:bottom-0 px-4 py-2 sm:px-6 sm:py-3 border-t border-[var(--chat-border)] bg-[var(--chat-bg-primary)] z-10">
              <div className="max-w-3xl mx-auto space-y-2">
                {isAiChatRoute ? (
                  <ChatInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    animatePlaceholder={false}
                    modelSelector={
                      <ModelSelector
                        selectedModelId={selectedModelId}
                        onModelChange={handleModelChange}
                        autoOnly={false}
                      />
                    }
                  />
                ) : (
                  <ChatInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    animatePlaceholder={false}
                    modelSelector={
                      <ModelSelector
                        selectedModelId={selectedModelId}
                        onModelChange={handleModelChange}
                        autoOnly={false}
                      />
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

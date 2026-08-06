"use client";

import React, { useState, useEffect, FC, KeyboardEvent, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChatInput,
  ThemeToggle,

  UserMenu,
  ChatSidebar,
  DEFAULT_IMAGE_MODEL_ID,
  RATIOS,
  getProviderFromModelId,
  type ImageRatio,
} from '@/components/chat';
import {
  getVideoPlatformByValue,
  DEFAULT_VIDEO_PLATFORM_VALUE,
  type VideoPlatformOption,
} from '@/constants/videoData';
import ExecutiveTeam, { executives } from '@/components/landing/ExecutiveTeam';
import TaskTools from '@/components/landing/TaskTools';
import { ProjectsSection } from '@/components/landing/ProjectsSection';
import { LandingIcons as Icons } from '@/components/landing/Icons';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { useProviderTheme } from '@/hooks/use-provider-theme';
import chatHistoryService, { ChatSession, ProjectSummary } from "@/app/api/chatHistory";
import settingsService from "@/app/api/settings";
import { useLanguage } from '@/lib/i18n';
import { toast } from "sonner";
import { LiquidMetal } from "@paper-design/shaders-react";
import { useTheme } from "@/context/ThemeContext";
import "@/styles/chat-theme.css";
import "@/styles/chat-provider-themes.css";
import { NavSidebar, MENU_AGENTS } from "@/components/chat/NavSidebar";
import { AgentOSConnectModal } from '@/components/landing/AgentOSConnectModal';
import { OAuthCallbackHandler } from '@/components/OAuthCallbackHandler';

// Type definitions
interface IconProps {
  width?: string;
  height?: string;
}


interface Position {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  transform?: string;
}

// Minimalist Icon Components moved to Icons.tsx

// AI2me Logo Component
// AI2me Logo Component moved inside to access auth context or passed as prop

// ─── Navbar tagline: white by default, each word colors on hover ─────────────
const TAGLINE_WORDS: { text: string; color: string }[] = [
  { text: 'The',          color: '#ffffff' },
  { text: 'Operating',    color: '#3B82F6' }, // blue  — matches Docs
  { text: 'System',      color: '#6366F1' }, // indigo — matches AI Chat
  { text: 'for',         color: '#ffffff' },
  { text: 'Building',    color: '#F97316' }, // orange — matches Slides
  { text: 'and',         color: '#ffffff' },
  { text: 'Running',     color: '#22C55E' }, // green  — matches Sheets
  { text: 'Businesses',  color: '#A855F7' }, // purple — matches Image
];

const NavTagline: FC = () => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  return (
    <span className="text-[1.35rem] font-semibold tracking-wide pointer-events-auto" style={{ display: 'flex', gap: '0.35em', flexWrap: 'wrap', justifyContent: 'center' }}>
      {TAGLINE_WORDS.map((w, i) => (
        <span
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            color: hovered === i ? w.color : '#ffffff',
            transition: 'color 0.18s ease',
            cursor: 'default',
          }}
        >
          {w.text}
        </span>
      ))}
    </span>
  );
};

const AI2meProMockup: FC = () => {
  const router = useRouter();
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-sonnet-4-6");
  const [modelType, setModelType] = useState<'llm' | 'image' | 'video'>('llm');
  const [imageRatio, setImageRatio] = useState<ImageRatio>(RATIOS[0]);
  const [selectedVideoPlatform, setSelectedVideoPlatform] = useState<string>(DEFAULT_VIDEO_PLATFORM_VALUE);
  const [videoOptions, setVideoOptions] = useState<VideoPlatformOption | null>(() =>
    getVideoPlatformByValue(DEFAULT_VIDEO_PLATFORM_VALUE) ?? null
  );
  const { user, signOut, loading } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { openModal } = useAuthModal();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const pathname = usePathname();
  const isLandingPage = pathname === '/landing';
  const displayName = user?.full_name?.trim().split(/\s+/)[0];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadContactImage = async () => {
      if (!user) {
        setProfileImageUrl("");
        return;
      }

      try {
        const response = await settingsService.getCompanyDetails();
        if (isActive) {
          setProfileImageUrl(response.contactImageUrl || "");
        }
      } catch (error) {
        console.error("Failed to load contact image:", error);
        if (isActive) {
          setProfileImageUrl("");
        }
      }
    };

    const handleImageUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ imageUrl?: string }>;
      setProfileImageUrl(customEvent.detail?.imageUrl || "");
    };

    loadContactImage();
    window.addEventListener("contact-image-updated", handleImageUpdated);
    return () => {
      isActive = false;
      window.removeEventListener("contact-image-updated", handleImageUpdated);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const openAuthModal = useCallback((nextPath?: string) => {
    if (typeof window !== "undefined" && nextPath) {
      const params = new URLSearchParams(window.location.search);
      params.set("next", nextPath);
      const currentPath = window.location.pathname || "/";
      router.replace(`${currentPath}?${params.toString()}`);
    }
    openModal("login");
  }, [openModal, router]);

  const withAuth = useCallback((action: () => void, nextPath?: string) => {
    if (!user) {
      openAuthModal(nextPath);
      return;
    }
    action();
  }, [openAuthModal, user]);

  // Sync provider theme with document element for CSS variables
  useProviderTheme(getProviderFromModelId(selectedModelId));

  // Chat History & Sidebar State
  const [agentOSModalOpen, setAgentOSModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [hasLoadedSessionIndex, setHasLoadedSessionIndex] = useState(false);

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
      // If we got empty results on a signed-in user, retry once after a short delay
      // to cover the auth token propagation window on fresh login
      if (response.projects.length === 0) {
        setTimeout(async () => {
          try {
            const retry = await chatHistoryService.getProjects();
            if (retry.projects.length > 0) setProjects(retry.projects);
          } catch { /* silent */ }
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }, []);

  // Merge sessions and projects for the sidebar
  const mergedSessions = useMemo(() => {
    // Build preview_url lookup from projects list
    const projectPreviewMap = new Map<string, string>();
    projects.forEach((p) => { if (p.preview_url) projectPreviewMap.set(p.session_id, p.preview_url); });

    const seen = new Set(chatSessions.map((session) => session.session_id));
    // Enrich chat sessions with preview_url (for Builder sessions already in the chat list)
    const enrichedSessions: ChatSession[] = chatSessions.map((s) => ({
      ...s,
      preview_url: projectPreviewMap.get(s.session_id) ?? s.preview_url ?? null,
    }));
    const projectSessions: ChatSession[] = projects
      .filter((project) => !seen.has(project.session_id))
      .map((project) => ({
        session_id: project.session_id,
        title: project.title || project.project_id || "Web Builder",
        preview: project.project_id,
        preview_url: project.preview_url,
        created_at: project.created_at,
        updated_at: project.updated_at,
        message_count: 0,
        agent_id: "ai-builder",
      }));

    return [...enrichedSessions, ...projectSessions].sort((a, b) => {
      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      return bTime - aTime;
    });
  }, [chatSessions, projects]);

  // Sidebar actions
  const handleSelectSession = (sessionIdToLoad: string, agentId?: string | null) => {
    if (agentId === "ai-builder" || agentId === "web-builder") {
      // Use stored project agent_id if available; old sessions have ai-builder but are Web Builder
      const project = projects.find((p) => p.session_id === sessionIdToLoad);
      const storedAgentId = project?.agent_id;
      const effectiveAgentId = storedAgentId === "web-builder" ? "web-builder"
        : agentId === "ai-builder" ? "ai-builder"  // explicitly App Builder
        : "web-builder";
      const destination = `/project/${sessionIdToLoad}?agent_id=${effectiveAgentId}`;
      withAuth(() => router.push(destination), destination);
      return;
    }

    if (agentId === "ai-sheets") {
      const destination = `/ai-sheets?session_id=${sessionIdToLoad}`;
      withAuth(() => router.push(destination), destination);
      return;
    }

    if (agentId === "ai-docs") {
      const destination = `/ai-docs?session_id=${sessionIdToLoad}`;
      withAuth(() => router.push(destination), destination);
      return;
    }

    if (agentId === "ai-slides") {
      const destination = `/ai-slides?session_id=${sessionIdToLoad}`;
      withAuth(() => router.push(destination), destination);
      return;
    }

    // Redirect to chat page with the session
    const agentParam = agentId ? `&agent_id=${agentId}` : '';
    const destination = `/chat?session_id=${sessionIdToLoad}${agentParam}`;
    withAuth(() => router.push(destination), destination);
  };


  const handleOpenProject = (projectSessionId: string) => {
    const destination = `/project/${projectSessionId}`;
    withAuth(() => router.push(destination), destination);
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      const success = await chatHistoryService.deleteChatSession(sessionIdToDelete);
      if (success) {
        setChatSessions((prev) => prev.filter((s) => s.session_id !== sessionIdToDelete));
        setProjects((prev) => prev.filter((p) => p.session_id !== sessionIdToDelete));
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
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      const updated = await chatHistoryService.renameChatSession(sessionIdToRename, newTitle);
      if (!updated?.title) {
        toast.error("Failed to rename chat");
        return;
      }
      setChatSessions((prev) =>
        prev.map((s) => (s.session_id === sessionIdToRename ? { ...s, title: updated.title } : s))
      );
      setProjects((prev) =>
        prev.map((p) => (p.session_id === sessionIdToRename ? { ...p, title: updated.title } : p))
      );
      toast.success("Chat renamed");
    } catch (error) {
      console.error("Failed to rename session:", error);
      toast.error("Failed to rename chat");
    }
  };

  const handleNewChat = () => {
    const destination = '/chat';
    withAuth(() => router.push(destination), destination);
  };

  const handleAgentAction = (agentName: string) => {
    const routes: Record<string, string> = {
      'Web Builder':  '/project/new?mode=web',
      'App Builder':  '/project/new?mode=app',
      'AI Chat':      '/ai-chat',
      'AI Sheets':    '/ai-sheets',
      'AI Docs':      '/ai-docs',
      'AI Slides':    '/ai-slides',
      'AI Image':     '/chat?agent_id=ai-image',
      'AI Video':     '/chat?agent_id=ai-video',
    };
    const dest = routes[agentName];
    if (!dest) return;
    withAuth(() => router.push(dest), dest);
  };

  // Load sessions only after auth is confirmed - avoids 401 race
  useEffect(() => {
    if (isMounted && user && !loading) {
      // Always refresh token before fetching — guards against stale cached tokens
      chatHistoryService.ensureToken().then(() =>
        Promise.all([loadChatSessions(), loadProjects()]).then(() => setHasLoadedSessionIndex(true))
      );
    }
  }, [isMounted, user, loading]);

  // Reload when user becomes available (in case first load was unauthenticated)
  useEffect(() => {
    if (user && isMounted && hasLoadedSessionIndex) {
      chatHistoryService.ensureToken().then(() =>
        Promise.all([loadChatSessions(), loadProjects()])
      );
    }
  }, [user]);



  const LANDING_PENDING_KEY = "landing-pending-message";

  const handleSendMessage = (message: string, additionalContent?: string | Record<string, unknown>, attachments?: { name: string; type?: string }[]) => {
    const hasAttachments = additionalContent != null || (attachments?.length ?? 0) > 0;
    if (hasAttachments && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          LANDING_PENDING_KEY,
          JSON.stringify({
            message,
            additionalContent: additionalContent ?? undefined,
            attachments: attachments ?? undefined,
            model: selectedModelId,
          })
        );
      } catch (e) {
        console.warn("sessionStorage failed, sending message only", e);
      }
      const destination = `/chat?agent_id=chat&from_landing=1&model=${selectedModelId}`;
      withAuth(() => router.push(destination), destination);
      return;
    }
    const destination = `/chat?agent_id=chat&message=${encodeURIComponent(message)}&model=${selectedModelId}`;
    withAuth(() => router.push(destination), destination);
  };

  return (
    <div
      className={`transition-all duration-300 ease-in-out lg:pl-20 ${sidebarOpen ? "pl-72 lg:pl-[calc(82px+288px)]" : "pl-0"}`}
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'var(--foreground)',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Left icon rail */}
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
      {/* Simple Loader (Matching existing app loader) */}
      {!isMounted && (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center fixed inset-0 z-[9999]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Loading...</p>
          </div>
        </div>
      )}

      <header
        className="landing-header sticky top-0 w-full flex items-center justify-between px-4 sm:px-6 md:px-12 py-2 border-b border-[var(--border)] relative"
        style={{
          background: 'var(--background)',
          zIndex: 99,
        }}>
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <Image
            src="/ai2me-logo.png"
            alt="AI2me Logo"
            width={220}
            height={80}
            className="object-contain cursor-pointer w-[95px] sm:w-[120px] md:w-[139px]"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
          />
        </div>

        {/* agentos-logo hidden */}

        {/* Center tagline */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center select-none pointer-events-none">
          <NavTagline />
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-4 flex-1 min-w-0">
          {user ? (
            <div className="w-auto shrink-0">
              {/* Home, Boardroom and profile avatar removed from top-right — already in sidebar */}
            </div>
          ) : !loading ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal()}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[var(--border)] text-xs sm:text-sm font-medium transition-all hover:bg-[var(--chat-bg-hover)] text-[var(--foreground)]"
                style={{ background: 'none', cursor: 'pointer' }}
              >
                Sign in
              </button>
              <button
                onClick={() => openModal("signup")}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[var(--chat-accent)] text-white text-xs sm:text-sm font-medium transition-all hover:bg-[var(--chat-accent-hover)] no-auth-intercept"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                Sign up
              </button>
            </div>
          ) : (
            <div className="h-9 w-[132px] sm:w-[168px] shrink-0" />
          )}
          <ThemeToggle />
        </div>

        {/* Chat Sidebar Integration */}
        {isMounted && (
          <ChatSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            sessions={mergedSessions}
            projects={projects}
            showProjects={false}
            selectedSessionId={null}
            onSelectSession={handleSelectSession}
            onSelectProject={handleOpenProject}
            onNewChat={handleNewChat}
            onBoardroomClick={() => withAuth(() => router.push('/boardroom'), '/boardroom')}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            isLoading={isLoadingSessions}
            className="lg:!left-0 !bottom-0"
          />
        )}
      </header>



      {/* Dashboard View */}
      <main
        className="dashboard-main px-4 py-4 md:px-8 md:py-6 max-w-[1100px] mx-auto flex flex-col items-center"
        style={{
          minHeight: 'calc(100vh - 80px)',
        }}>
        {/* Welcome */}
        {/* <p style={{
            color: 'var(--muted-foreground)',
            fontSize: '13px',
            marginBottom: '16px',
            letterSpacing: '0.5px'
          }}>
            Powered by <span style={{ color: 'var(--chat-accent)' }}>AI2ME</span>
          </p> */}

        {/* Connect agents banner */}
        <button
          onClick={() => setAgentOSModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--chat-border)] bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all mb-8 text-sm text-[var(--foreground)] font-medium"
          style={{ background: 'none', cursor: 'pointer' }}
        >
          <span>🔌</span>
          <span>{t('landing.connect_agents', 'Connect your agents')}</span>
          <span className="text-[var(--muted-foreground)]">→</span>
        </button>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-8 tracking-tighter text-[var(--foreground)] text-center">
          Build <span className="opacity-40">+</span> Launch <span className="opacity-40">+</span> Operate <span className="opacity-40">+</span> Scale
        </h1>

        {/* Chat Input - Primary Position */}
        <div className="w-full max-w-[700px] mb-10 px-2 sm:px-0">
          <ChatInput
            onSend={handleSendMessage}
            animatePlaceholder={true}
          />
        </div>

        {/* Task Tools Section */}
        <TaskTools
          onToolClick={(label) => {
            if (label === 'Image') {
              if (!user) {
                openModal("login");
                return;
              }
              router.push('/chat/media?mode=image');
              return;
            }
            if (label === 'Video') {
              if (!user) {
                openModal("login");
                return;
              }
              router.push('/chat/media?mode=video');
              return;
            }
            setModelType('llm');
            if (label === 'AI Chat') {
              const destination = '/ai-chat';
              // withAuth(() => router.push(destination), destination);
              router.push(destination);
              return;
            }
            if (label === 'Web Builder' || label === 'AI Developer') {
              const destination = '/project/new?mode=web';
              // withAuth(() => router.push(destination), destination);
              router.push(destination);
              return;
            }
            if (label === 'Docs' || label === 'AI Docs') {
              withAuth(() => router.push('/ai-docs'), '/ai-docs');
              return;
            }
            if (label === 'Sheets' || label === 'AI Sheets') {
              withAuth(() => router.push('/ai-sheets'), '/ai-sheets');
              return;
            }
            if (label === 'Slides' || label === 'AI Slides') {
              withAuth(() => router.push('/ai-slides'), '/ai-slides');
              return;
            }
            if (label === 'App Builder') {
              withAuth(() => router.push('/project/new?mode=app'), '/project/new?mode=app');
              return;
            }
            if (label === 'Agent Launchpad') {
              window.open('https://agentos247.com', '_blank');
              return;
            }

            // if (!user) { openAuthModal(); }
          }}
        />

        {/* ─── Projects Section (Lovable-style) ─── */}
        {isMounted && user && (
          <ProjectsSection
            sessions={mergedSessions}
            projects={projects}
            isLoading={isLoadingSessions}
            onSelectSession={handleSelectSession}
            onSelectProject={handleOpenProject}
            onNewChat={handleNewChat}
            router={router}
          />
        )}

        {/* AI Executive Team Section — hidden */}
        {/* <ExecutiveTeam speakingIndex={-1} /> */}

        {/* Boardroom Button — hidden */}
        {/* <button onClick={() => withAuth(() => router.push('/boardroom'), '/boardroom')}>Ai2me C-level Group Meeting</button> */}
      </main>

      <AgentOSConnectModal open={agentOSModalOpen} onClose={() => setAgentOSModalOpen(false)} />

      <style>{`
        @keyframes liquid-flow {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }

        /* ─── Responsive: Tablet (≤1024px) ─── */
        @media (max-width: 1024px) {
          .landing-header {
            padding: 10px 16px !important;
            flex-wrap: nowrap !important;
            gap: 4px;
          }
          .dashboard-main {
            padding: 40px 20px !important;
          }
        }

        /* ─── Responsive: Mobile (≤640px) ─── */
        @media (max-width: 640px) {
          .landing-header {
            padding: 8px 12px !important;
            gap: 4px;
          }
          .landing-header button {
            font-size: 11px !important;
            padding: 4px 6px !important;
          }
          .dashboard-main {
            padding: 24px 12px !important;
          }
          .dashboard-main h1 {
            font-size: 28px !important;
            letter-spacing: -1px !important;
          }
          .dashboard-main p {
            font-size: 14px !important;
          }
          .exec-team-card {
            flex: 1 1 calc(50% - 8px) !important;
            min-width: 130px !important;
            padding: 12px 8px !important;
          }
          .task-tool-card {
            flex: 1 1 calc(33.33% - 8px) !important;
            min-width: 85px !important;
            padding: 12px 8px !important;
          }
        }
      `}</style>

      <OAuthCallbackHandler />
    </div>
  );
};

export default AI2meProMockup;





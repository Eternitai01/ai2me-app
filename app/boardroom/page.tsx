"use client";

import React, { useState, useEffect, FC, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ThemeToggle,
    UserMenu,
    ChatSidebar,
} from '@/components/chat';
import { LandingIcons as Icons } from '@/components/landing/Icons';
import Boardroom from '@/components/landing/Boardroom';
import TelegramSetup from '@/components/boardroom/TelegramSetup';
import COOConsultationPopup from '@/components/landing/COOConsultationPopup';
import { executives } from '@/components/landing/ExecutiveTeam';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';
import chatHistoryService, { ChatSession, ProjectSummary } from "@/app/api/chatHistory";
import settingsService from "@/app/api/settings";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import Image from 'next/image';
import { SubscriptionSafeGuard } from "@/components/SubscriptionSafeGuard";
import "@/styles/chat-theme.css";
import "@/styles/chat-provider-themes.css";

interface TranscriptEntry {
    time: string;
    speaker: string;
    text: string;
}

const BoardroomPage: FC = () => {
    const router = useRouter();
    const { user, signOut, loading } = useAuth();
    const { theme } = useTheme();
    const { openModal } = useAuthModal();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState("");
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
        loadContactImage();
        return () => { isActive = false; };
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const openAuthModal = useCallback((nextPath?: string) => {
        if (typeof window !== "undefined" && nextPath) {
            const params = new URLSearchParams(window.location.search);
            params.set("next", nextPath);
            router.replace(`/boardroom?${params.toString()}`);
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

    // Sidebar State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

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

    useEffect(() => {
        if (user && isMounted) {
            loadChatSessions();
            loadProjects();
        }
    }, [user, isMounted, loadChatSessions, loadProjects]);

    // Merge sessions and projects for the sidebar
    const mergedSessions = useMemo(() => {
        const seen = new Set(chatSessions.map((session) => session.session_id));
        const projectSessions: ChatSession[] = projects
            .filter((project) => !seen.has(project.session_id))
            .map((project) => ({
                session_id: project.session_id,
                title: project.title || project.project_id || "Web Builder",
                preview: project.project_id,
                created_at: project.created_at,
                updated_at: project.updated_at,
                message_count: 0,
                agent_id: "ai-builder",
            }));

        return [...chatSessions, ...projectSessions].sort((a, b) => {
            const aTime = new Date(a.updated_at).getTime();
            const bTime = new Date(b.updated_at).getTime();
            return bTime - aTime;
        });
    }, [chatSessions, projects]);

    const handleSelectSession = (sessionIdToLoad: string, agentId?: string | null) => {
        if (agentId === "ai-builder" || agentId === "web-builder") {
            // Use stored project agent_id if available; old sessions have ai-builder but are Web Builder
            const project = projects.find((p: any) => p.session_id === sessionIdToLoad);
            const storedAgentId = project?.agent_id;
            const effectiveAgentId = storedAgentId === "web-builder" ? "web-builder"
                : agentId === "ai-builder" ? "ai-builder"  // explicitly App Builder
                : "web-builder";
            const destination = `/project/${sessionIdToLoad}?agent_id=${effectiveAgentId}`;
            withAuth(() => router.push(destination), destination);
            return;
        }
        const agentParam = agentId ? `&agent_id=${agentId}` : '';
        const destination = `/chat?session_id=${sessionIdToLoad}${agentParam}`;
        withAuth(() => router.push(destination), destination);
    };

    const [showCOOPopup, setShowCOOPopup] = useState<boolean>(false);
    const [speakingIndex, setSpeakingIndex] = useState<number>(-1);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [selectedExec, setSelectedExec] = useState<any>(undefined);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([
        { time: '14:32', speaker: 'You', text: 'What are our current operational bottlenecks?' },
        { time: '14:32', speaker: 'Sandra', text: 'Based on my analysis, I\'ve identified three primary bottlenecks. First, your order fulfillment has a 23% delay rate...' },
    ]);

    const addResponse = (): void => {
        setIsTyping(true);
        setTimeout(() => {
            setTranscript(prev => [...prev, {
                time: '14:33',
                speaker: 'Sandra',
                text: 'I recommend implementing automated inventory sync. My Process Analyst has drafted an SOP. Shall I share it?'
            }]);
            setIsTyping(false);
        }, 2000);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter' && e.currentTarget.value) {
            const val = e.currentTarget.value;
            setTranscript(prev => [...prev, {
                time: '14:34',
                speaker: 'You',
                text: val
            }]);
            e.currentTarget.value = '';
            addResponse();
        }
    };

    return (
        <SubscriptionSafeGuard>
            <div
                className={`transition-all duration-300 ease-in-out ${sidebarOpen ? "pl-72 lg:pl-80" : "pl-0"}`}
                style={{
                    minHeight: '100vh',
                    background: 'var(--background)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: 'var(--foreground)',
                    position: 'relative',
                    overflowX: 'hidden'
                }}
            >
            <header
                className="landing-header sticky top-0 w-full flex items-center justify-between px-4 sm:px-6 md:px-12 py-3 sm:py-5 border-b border-[var(--border)]"
                style={{
                    background: 'var(--background)',
                    zIndex: 100,
                }}>
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    {!sidebarOpen && user && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-1.5 sm:p-2 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--chat-bg-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <Icons.menu />
                        </button>
                    )}
                    <div className="flex items-center shrink-0">
                        <Image
                            src="/images/logo2.png"
                            alt="AI2ME Logo"
                            width={110}
                            height={40}
                            className="object-contain cursor-pointer w-[75px] sm:w-[100px] md:w-[110px] ml-1"
                            onClick={() => router.push('/')}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 sm:gap-4 flex-1 min-w-0">
                    {!user && !loading && (
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => router.push('/')}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-[var(--chat-bg-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Home
                            </button>
                            <button
                                onClick={() => window.open('https://www.ai2me.com/company', '_blank', 'noopener,noreferrer')}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-[var(--chat-bg-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Company
                            </button>
                            <button
                                disabled
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-[rgba(74,144,217,0.1)] border border-[rgba(74,144,217,0.3)] text-[#4A90D9]"
                                style={{ background: 'rgba(74, 144, 217, 0.1)', cursor: 'default' }}
                            >
                                Boardroom
                            </button>
                        </div>
                    )}

                    {user && (
                        <div className="hidden md:flex items-center gap-2 mr-1">
                            <button
                                onClick={() => router.push('/')}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-[var(--chat-bg-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Home
                            </button>
                            <button
                                disabled
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-[rgba(74,144,217,0.1)] border border-[rgba(74,144,217,0.3)] text-[#4A90D9]"
                                style={{ background: 'rgba(74, 144, 217, 0.1)', cursor: 'default' }}
                            >
                                Boardroom
                            </button>
                        </div>
                    )}
                    {user ? (
                        <div className="w-auto shrink-0">
                            <UserMenu
                                user={user}
                                isOpen={userMenuOpen}
                                setIsOpen={setUserMenuOpen}
                                handleSignOut={handleSignOut}
                                router={router}
                                dropdownPosition="top-full mt-2 right-0"
                            />
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
                        </div>
                    ) : null}
                    <ThemeToggle />
                </div>

                {isMounted && user && (
                    <ChatSidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        sessions={mergedSessions}
                        projects={projects}
                        showProjects={false}
                        selectedSessionId={null}
                        onSelectSession={handleSelectSession}
                        onSelectProject={(id) => router.push(`/project/${id}`)}
                        onNewChat={() => router.push('/chat')}
                        onBoardroomClick={() => setSidebarOpen(false)}
                        onDeleteSession={async (id) => {
                            await chatHistoryService.deleteChatSession(id);
                            loadChatSessions();
                        }}
                        onRenameSession={async (id, title) => {
                            await chatHistoryService.renameChatSession(id, title);
                            loadChatSessions();
                        }}
                        isLoading={isLoadingSessions}
                        className="lg:!left-0 !bottom-0"
                    />
                )}
            </header>

            <Boardroom
                user={user}
                displayName={displayName || ""}
                profileImageUrl={profileImageUrl}
                speakingIndex={speakingIndex}
                isTyping={isTyping}
                onCOOClick={(exec) => {
                    setSelectedExec(exec);
                    setShowCOOPopup(true);
                }}
                onKeyPress={handleKeyPress}
            />

            {/* {isMounted && user && (
                <div className="px-4 sm:px-6 md:px-12 py-8">
                    <TelegramSetup />
                </div>
            )} */}

            <COOConsultationPopup
                isOpen={showCOOPopup}
                onClose={() => setShowCOOPopup(false)}
                isTyping={isTyping}
                transcript={transcript}
                onKeyPress={handleKeyPress}
                executive={selectedExec}
            />

            <style>{`
        @keyframes liquid-flow {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
        </div>
        </SubscriptionSafeGuard>
    );
};

export default BoardroomPage;

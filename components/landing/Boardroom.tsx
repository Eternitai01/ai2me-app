"use client";

import React, { FC, useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { executives } from './ExecutiveTeam';
import { LandingIcons } from './Icons';

const BoardroomStyles = () => (
    <style>{`
    @keyframes speakWave {
      from { height: 3px; }
      to { height: 10px; }
    }
    @keyframes typingBounce {
      0%, 100% { transform: translateY(0); opacity: 40%; }
      50% { transform: translateY(-4px); opacity: 100%; }
    }

    @media (max-width: 1024px) {
      .boardroom-main {
        padding: 12px 16px !important;
        height: auto !important;
        min-height: calc(100vh - 80px);
        overflow: auto !important;
      }
      .boardroom-cols {
        flex-direction: column !important;
        overflow: auto;
      }
      .boardroom-left {
        flex: none !important;
        min-height: auto !important;
      }
      .boardroom-chat {
        width: 100% !important;
        flex-shrink: 1 !important;
        min-height: 450px;
      }
      .boardroom-exec-grid {
        padding-bottom: 5px !important;
      }
      .boardroom-table-container {
        padding: 20px 0 !important;
      }
      .boardroom-table-rect {
        height: 100px !important;
      }
    }

    @media (max-width: 640px) {
      .boardroom-main {
        padding: 8px 8px !important;
        height: auto !important;
        min-height: calc(100vh - 60px);
        overflow-y: auto !important;
      }
      .boardroom-cols {
        flex-direction: column !important;
        gap: 12px !important;
        overflow-y: auto;
      }
      .boardroom-left {
        flex: none !important;
        min-height: auto !important;
        border-radius: 12px !important;
      }
      .boardroom-chat {
        width: 100% !important;
        flex-shrink: 1 !important;
        min-height: 400px;
        border-radius: 12px !important;
      }
      .boardroom-exec-grid {
        padding-bottom: 5px !important;
      }
      .boardroom-table-container {
        margin-top: 0 !important;
        padding: 10px 0 20px !important;
      }
      .boardroom-table-rect {
        height: 80px !important;
        width: 92% !important;
      }
      .boardroom-user-seat {
        bottom: auto !important;
        gap: 4px !important;
      }
      .boardroom-exec-avatar {
        width: 38px !important;
        height: 38px !important;
      }
      .boardroom-exec-cell {
        padding: 4px 1px !important;
      }
      .boardroom-halo {
         width: 44px !important;
         height: 44px !important;
      }
      .boardroom-stage-label {
         padding-top: 8px !important;
         padding-bottom: 4px !important;
      }
      .boardroom-exec-name {
        font-size: 7px !important;
      }
      .boardroom-row {
         gap: 1px !important;
      }
      .boardroom-msg-text {
        font-size: 12px !important;
      }
    }
  `}</style>
);

interface Message {
    sender: string;
    role: string;
    time: string;
    text: string;
    color: string;
    image: string | null;
    isMine: boolean;
}

interface BoardroomProps {
    user: any;
    displayName: string;
    profileImageUrl: string;
    speakingIndex: number;
    isTyping: boolean;
    onCOOClick: (exec: any) => void;
    onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const initialDemoMessages: Message[] = [
    { sender: 'Victoria Chen', role: 'CEO', time: '14:31', text: "Let's kick off Q1 review — starting with company-wide KPIs.", color: '#4A90D9', image: '/images/Victoria Chen CEO.jpg', isMine: false },
    { sender: 'Marcus Webb', role: 'CFO', time: '14:32', text: 'Revenue 12% above plan. Costs down 8%. Strong Q2 runway.', color: '#10B981', image: '/images/Marcus Webb CFO.jpg', isMine: false },
    { sender: 'Sandra Okonkwo', role: 'COO', time: '14:33', text: 'Ops efficiency up 18%. Three bottlenecks identified — memo ready.', color: '#F59E0B', image: '/images/Sandra Okonkwo.jpg', isMine: false },
    { sender: 'You', role: 'You', time: '14:34', text: 'Great progress! What are the key actions for next week?', color: '#6366f1', image: null, isMine: true },
    { sender: 'Victoria Chen', role: 'CEO', time: '14:34', text: "Marcus — walk us through Q2 priorities. I'm available for a 1-on-1 if you need more details.", color: '#4A90D9', image: '/images/Victoria Chen CEO.jpg', isMine: false },
];

const Boardroom: FC<BoardroomProps> = ({
    user,
    displayName,
    profileImageUrl,
    speakingIndex,
    isTyping,
    onCOOClick,
    onKeyPress,
}) => {
    const [messages, setMessages] = useState<Message[]>(initialDemoMessages);
    const [chatInput, setChatInput] = useState('');
    const [sendLoading, setSendLoading] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const receivedMessageIdsRef = useRef<Set<string>>(new Set());
    const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);
    const [telegramChatTitle, setTelegramChatTitle] = useState<string | null>(null);
    const [selectedExecutive, setSelectedExecutive] = useState<any>(null);

    const getAuthHeaders = useCallback((): Record<string, string> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (typeof window !== 'undefined') {
            const apiKey = localStorage.getItem('ai_service_api_key');
            if (apiKey) headers['X-API-Key'] = apiKey;
        }
        return headers;
    }, []);

    const fetchTelegramStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/boardroom/telegram/link/status', {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setTelegramLinked((data as { linked?: boolean }).linked ?? false);
                setTelegramChatTitle((data as { chat_title?: string | null }).chat_title ?? null);
            } else {
                setTelegramLinked(false);
                setTelegramChatTitle(null);
            }
        } catch {
            setTelegramLinked(false);
            setTelegramChatTitle(null);
        }
    }, [getAuthHeaders]);


    useEffect(() => {
        if (user) fetchTelegramStatus();
    }, [user, fetchTelegramStatus]);

    // WebSocket for real-time boardroom Telegram messages (replaces polling)
    useEffect(() => {
        if (!telegramLinked || !user) return;

        const baseUrl = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AI_SERVICE_URL
            ? process.env.NEXT_PUBLIC_AI_SERVICE_URL
            : (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.hostname}:8001` : 'http://localhost:8001');
        const wsUrl = baseUrl.replace(/^http/, 'ws') + '/v1/boardroom/telegram/ws';

        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
        let mounted = true;

        const applyIncomingMessages = (messages: { id: string; sender_name: string | null; text: string; created_at: string | null }[]) => {
            if (!Array.isArray(messages)) return;
            setMessages((prev) => {
                const next = [...prev];
                let added = 0;
                for (const m of messages) {
                    if (!m.id || receivedMessageIdsRef.current.has(m.id)) continue;
                    receivedMessageIdsRef.current.add(m.id);
                    const d = m.created_at ? new Date(m.created_at) : new Date();
                    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                    next.push({
                        sender: m.sender_name || 'Telegram',
                        role: 'Telegram',
                        time,
                        text: m.text,
                        color: '#229ED9',
                        image: null,
                        isMine: false,
                    });
                    added++;
                }
                return added ? next : prev;
            });
        };

        const connect = async () => {
            if (!mounted) return;
            const apiKey = typeof window !== 'undefined' ? localStorage.getItem('ai_service_api_key') : null;
            let authPayload: { type: string; api_key?: string; token?: string };
            if (apiKey) {
                authPayload = { type: 'auth', api_key: apiKey };
            } else {
                try {
                    const res = await fetch('/api/boardroom/telegram/ws-auth', { method: 'GET', credentials: 'include' });
                    const data = await res.json().catch(() => ({})) as { token?: string };
                    if (!res.ok || !data.token) return;
                    authPayload = { type: 'auth', token: data.token };
                } catch {
                    return;
                }
            }
            const socket = new WebSocket(wsUrl);
            ws = socket;
            socket.onopen = () => {
                socket.send(JSON.stringify(authPayload));
            };
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as { type?: string; messages?: { id: string; sender_name: string | null; text: string; created_at: string | null }[] };
                    if (data.type === 'boardroom_telegram_messages' && Array.isArray(data.messages)) {
                        applyIncomingMessages(data.messages);
                    }
                } catch {
                    // ignore
                }
            };
            socket.onerror = () => {
                socket.close();
            };
            socket.onclose = () => {
                ws = null;
                if (!mounted) return;
                reconnectTimeout = setTimeout(connect, 5000);
            };
        };

        connect();
        return () => {
            mounted = false;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws) ws.close();
        };
    }, [telegramLinked, user]);

    const formatTime = () => {
        const d = new Date();
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const sendBoardroomMessage = useCallback(async () => {
        const text = chatInput.trim();
        if (!text) return;
        const senderName = displayName || user?.email?.split('@')[0] || 'You';
        setMessages((prev) => [...prev, {
            sender: senderName,
            role: 'You',
            time: formatTime(),
            text,
            color: '#6366f1',
            image: null,
            isMine: true,
        }]);
        setChatInput('');
        setSendError(null);
        if (telegramLinked) {
            setSendLoading(true);
            try {
                const res = await fetch('/api/boardroom/telegram/send', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    credentials: 'include',
                    body: JSON.stringify({ text }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setSendError((data as { detail?: string }).detail || 'Failed to send to Telegram');
                }
            } catch (e) {
                setSendError((e as Error).message || 'Request failed');
            } finally {
                setSendLoading(false);
            }
        }
        if (onKeyPress && typeof (document.activeElement as HTMLInputElement)?.value !== 'undefined') {
            const syntheticEvent = { key: 'Enter', currentTarget: { value: text } } as React.KeyboardEvent<HTMLInputElement>;
            onKeyPress(syntheticEvent);
        }
    }, [chatInput, displayName, user, telegramLinked, getAuthHeaders, onKeyPress]);

    const handleChatKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBoardroomMessage();
        } else {
            onKeyPress?.(e);
        }
    }, [sendBoardroomMessage, onKeyPress]);

    return (
        <main
            className="boardroom-main"
            style={{
                height: 'calc(100vh - 80px)',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 32px',
                gap: '0',
                overflow: 'hidden'
            }}>
            <div className="boardroom-cols" style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>

                {/* LEFT: Stage — single unified background */}
                <div
                    className="boardroom-left"
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        background: 'linear-gradient(160deg, rgba(18,24,38,0.97) 0%, rgba(10,14,24,0.99) 100%)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255,255,255,0.07)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}>

                    {/* Subtle grid texture overlay */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                        backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(74,144,217,0.06) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(99,102,241,0.06) 0%, transparent 60%)',
                    }} />

                    <div className="boardroom-stage-label" style={{ padding: '20px 16px 8px', zIndex: 1 }}>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>
                            C-Level AI Executive Team
                        </p>
                    </div>

                    {/* Executive Grid - 2 rows of 5, no individual boxes */}
                    {(() => {
                        const ORDER = ['CEO', 'COO', 'CFO', 'CTO', 'CSO', 'CMO', 'CHRO', 'CLO', 'CCO', 'COS'];
                        const orderedExecs = ORDER.map(r => executives.find(e => e.role === r)).filter(Boolean) as typeof executives;
                        const row1 = orderedExecs.slice(0, 5);
                        const row2 = orderedExecs.slice(5);

                        const ExecAvatar = ({ exec, index }: { exec: (typeof executives)[0]; index: number }) => {
                            const isSpeaking = index === speakingIndex;
                            return (
                                <div
                                    className="boardroom-exec-cell"
                                    onClick={() => onCOOClick(exec)}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '12px 4px 8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        zIndex: 1,
                                    }}
                                >
                                    {/* Speaking glow halo */}
                                    {isSpeaking && (
                                        <div
                                            className="boardroom-halo"
                                            style={{
                                                position: 'absolute',
                                                top: '6px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '84px',
                                                height: '84px',
                                                borderRadius: '50%',
                                                background: 'rgba(74,144,217,0.15)',
                                                boxShadow: '0 0 24px rgba(74,144,217,0.35)',
                                                zIndex: 0,
                                            }}
                                        />
                                    )}
                                    {/* Avatar */}
                                    <div className="boardroom-exec-avatar" style={{
                                        width: '70px', height: '70px', borderRadius: '50%',
                                        overflow: 'hidden', position: 'relative', zIndex: 1,
                                        border: isSpeaking
                                            ? '2.5px solid rgba(74,144,217,0.9)'
                                            : '2px solid rgba(74,144,217,0.55)',
                                        boxShadow: isSpeaking
                                            ? '0 0 0 4px rgba(74,144,217,0.2), 0 4px 18px rgba(0,0,0,0.5)'
                                            : '0 0 0 3px rgba(74,144,217,0.12), 0 4px 16px rgba(0,0,0,0.45)',
                                        flexShrink: 0,
                                    }}>
                                        {exec.image ? (
                                            <Image src={exec.image} alt={exec.name} fill className="object-cover" />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(40,50,65,0.9)', color: '#666' }}>
                                                <exec.icon />
                                            </div>
                                        )}
                                    </div>
                                    <span className="boardroom-exec-name" style={{
                                        fontSize: '12px', fontWeight: '600', zIndex: 1,
                                        color: isSpeaking ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {exec.name.split(' ')[0]}
                                    </span>
                                    {/* Role */}
                                    <span style={{
                                        fontSize: '11px', fontWeight: '700', zIndex: 1,
                                        color: isSpeaking ? '#4A90D9' : 'rgba(255,255,255,0.38)',
                                        letterSpacing: '0.5px',
                                    }}>
                                        {exec.role}
                                    </span>
                                    {/* Speaking bars */}
                                    {isSpeaking && (
                                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '8px', zIndex: 1 }}>
                                            {[0, 1, 2].map(i => (
                                                <div key={i} style={{
                                                    width: '3px', height: '5px', background: '#4A90D9', borderRadius: '2px',
                                                    animation: `speakWave 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                                                }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        };

                        return (
                            <div className="boardroom-exec-grid" style={{ padding: '0 8px 0', zIndex: 1, marginTop: '18px' }}>
                                {/* Thin divider under label */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '2px' }} />
                                <div className="boardroom-row" style={{ display: 'flex', gap: '0' }}>
                                    {row1.map((exec, i) => <ExecAvatar key={exec.role} exec={exec} index={i} />)}
                                </div>
                                {/* Row divider */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '1px 0' }} />
                                <div className="boardroom-row" style={{ display: 'flex', gap: '0' }}>
                                    {row2.map((exec, i) => <ExecAvatar key={exec.role} exec={exec} index={i + 5} />)}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 16px', zIndex: 1 }} />

                    <div className="boardroom-table-container" style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '5px 0',
                        zIndex: 1,
                        width: '100%',
                        minHeight: 0,
                    }}>
                        {/* Rectangle table */}
                        <div className="boardroom-table-rect" style={{
                            width: '82%',
                            height: '130px',
                            background: 'linear-gradient(180deg, rgba(50,65,85,0.65) 0%, rgba(28,36,50,0.88) 100%)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            position: 'relative',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {/* Table top edge shine */}
                            <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }} />
                        </div>

                        {/* User Seat - Now stacked below table */}
                        <div className="boardroom-user-seat" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.25)',
                                boxShadow: '0 0 0 3px rgba(255,255,255,0.07), 0 4px 15px rgba(0,0,0,0.4)',
                                overflow: 'hidden', position: 'relative',
                            }}>
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={user?.full_name || "User"}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "rgba(99,102,241,0.18)",
                                            color: "#4A90D9",
                                            fontSize: "18px",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {(displayName || user?.email?.[0] || "U").slice(0, 1).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <span className="boardroom-user-name" style={{
                                fontSize: '12px', fontWeight: '700', color: '#4A90D9',
                                letterSpacing: '0.5px',
                            }}>
                                {displayName || user?.email?.split('@')[0] || 'You'}
                            </span>
                        </div>
                    </div>
                </div>


                {/* RIGHT: WhatsApp/Telegram-style Chat Panel */}
                <div
                    className="boardroom-chat"
                    style={{
                        width: '420px', flexShrink: 0,
                        display: 'flex', flexDirection: 'column',
                        background: 'var(--background)',
                        borderRadius: '18px',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                    }}>
                    {/* Chat Header */}
                    <div style={{
                        padding: '12px 16px',
                        background: 'var(--card)',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #4A90D9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="boardroom-chat-title" style={{ fontSize: '15px', fontWeight: '600', color: 'var(--foreground)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                AI2me C-Level Team
                            </p>
                            <p style={{ fontSize: '10px', color: '#10B981', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                                Live · 10 executives
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '10px',
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        background: 'var(--background)',
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: msg.isMine ? 'row-reverse' : 'row', gap: '6px', alignItems: 'flex-end' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', border: msg.isMine ? '1.5px solid rgba(245,158,11,0.4)' : `1.5px solid ${msg.color}40` }}>
                                    {msg.isMine ? (
                                        profileImageUrl ? (
                                            <img src={profileImageUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#6366f133', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#6366f1' }}>
                                                {(displayName || user?.email?.[0] || "U").slice(0, 1).toUpperCase()}
                                            </div>
                                        )
                                    ) : msg.image ? (
                                        <Image src={msg.image} alt={msg.sender} fill className="object-cover" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: msg.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: msg.color }}>
                                            {msg.sender[0]}
                                        </div>
                                    )}
                                </div>
                                <div style={{ maxWidth: '76%' }}>
                                    {!msg.isMine && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                                            <span className="boardroom-msg-sender" style={{ fontSize: '12px', fontWeight: '700', color: msg.color }}>{msg.sender}</span>
                                            <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', opacity: 0.55 }}>· {msg.role}</span>
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            padding: '7px 11px 16px 11px',
                                            position: 'relative',
                                            background: msg.isMine
                                                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                                : 'var(--card)',
                                            borderRadius: msg.isMine
                                                ? '16px 16px 3px 16px'
                                                : '16px 16px 16px 3px',
                                            border: msg.isMine ? 'none' : '1px solid var(--border)',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        <p className="boardroom-msg-text" style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.45', color: msg.isMine ? '#fff' : 'var(--foreground)' }}>
                                            {msg.text}
                                        </p>
                                        <span
                                            style={{
                                                position: 'absolute',
                                                bottom: '4px',
                                                right: '8px',
                                                fontSize: '8px',
                                                color: 'var(--muted-foreground)',
                                                opacity: 0.6,
                                            }}
                                        >
                                            {msg.time}
                                        </span>
                                    </div>

                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                                    <Image src="/images/Sandra Okonkwo.jpg" alt="Sandra" fill className="object-cover" />
                                </div>
                                <div style={{ padding: '8px 12px', background: 'var(--card)', borderRadius: '16px 16px 16px 3px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '10px' }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--muted-foreground)', animation: `typingBounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '8px 10px', borderTop: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--card)',
                    }}>
                        {sendError && (
                            <p style={{ fontSize: '11px', color: '#ef4444', margin: 0 }}>{sendError}</p>
                        )}
                        <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder={telegramLinked ? 'Message... (sends to Telegram)' : 'Message... (link Telegram to send)'}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={handleChatKeyPress}
                                disabled={sendLoading}
                                style={{
                                    flex: 1, padding: '8px 13px',
                                    background: 'var(--background)', border: '1px solid var(--border)',
                                    borderRadius: '22px', color: 'var(--foreground)', fontSize: '12px', outline: 'none',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <BoardroomStyles />
        </main>
    );
};

export default Boardroom;


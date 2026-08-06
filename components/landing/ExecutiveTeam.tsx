import React, { FC, MouseEvent, useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Play } from 'lucide-react';

// Icons for the Executive Team
const ExecutiveIcons = {
    ceo: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    ),
    cfo: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    coo: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    cto: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
    ),
    cmo: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    ),
    clo: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="3" x2="12" y2="21" />
            <path d="M5 7l7-4 7 4" />
            <path d="M5 7v4c0 1.5-3 2-3 5h6c0-3-3-3.5-3-5V7" />
            <path d="M19 7v4c0 1.5 3 2 3 5h-6c0-3 3-3.5 3-5V7" />
        </svg>
    ),
    cso: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    cco: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    ),
    cos: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    ),
    chro: () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    videoCall: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
    ),
};

export interface Executive {
    icon: FC;
    role: string;
    name: string;
    subtitle: string;
    image?: string;
    videoUrl?: string;
}

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_BASE_URL || '';

export const executives: Executive[] = [
    { icon: ExecutiveIcons.ceo, role: 'CEO', name: 'Victoria Chen', subtitle: 'Executive', image: `${CDN_BASE_URL}/images/Victoria Chen CEO.jpg`, videoUrl: `${CDN_BASE_URL}/videos/Victoria_Chen.mp4` },
    { icon: ExecutiveIcons.coo, role: 'COO', name: 'Sandra Okonkwo', subtitle: 'Operations', image: `${CDN_BASE_URL}/images/Sandra Okonkwo.jpg`, videoUrl: `${CDN_BASE_URL}/videos/Sandra_Okonkwo.mp4` },
    { icon: ExecutiveIcons.cfo, role: 'CFO', name: 'Marcus Webb', subtitle: 'Finance', image: `${CDN_BASE_URL}/images/Marcus Webb CFO.jpg`, videoUrl: `${CDN_BASE_URL}/videos/Marcus_Webb.mp4` },
    { icon: ExecutiveIcons.cto, role: 'CTO', name: 'Raj Krishnamurthy', subtitle: 'Technology', image: `${CDN_BASE_URL}/images/Raj Krishnamurthy.jpg`, videoUrl: `${CDN_BASE_URL}/videos/Raj_Krishnamurthy.mp4` },
    { icon: ExecutiveIcons.cmo, role: 'CMO', name: 'Elena Rodriguez', subtitle: 'Marketing', image: `${CDN_BASE_URL}/images/Elena Rodriguez CMO.jpg`, videoUrl: `${CDN_BASE_URL}/videos/Elena_Rodriguez.mp4` },
    { icon: ExecutiveIcons.cso, role: 'CSO', name: 'James Mitchell', subtitle: 'Strategy', image: `${CDN_BASE_URL}/images/James MItchell CSO.jpg`, videoUrl: `${CDN_BASE_URL}/videos/James_Michell.mp4` },
    { icon: ExecutiveIcons.chro, role: 'CHRO', name: 'Michelle Thompson', subtitle: 'People', image: `${CDN_BASE_URL}/images/Michelle Thompson CHRO.jpg`, videoUrl: `${CDN_BASE_URL}/videos/Michelle_Thompson.mp4` },
    { icon: ExecutiveIcons.clo, role: 'CLO', name: 'David Nakamura', subtitle: 'Legal', image: `${CDN_BASE_URL}/images/David Nakamura.jpg`, videoUrl: `${CDN_BASE_URL}/videos/David_Nakamura.mp4` },
    { icon: ExecutiveIcons.cco, role: 'CCO', name: 'Patricia Hayes', subtitle: 'Compliance', image: `${CDN_BASE_URL}/images/Patricia Hayes CCO.jpg`, videoUrl: `${CDN_BASE_URL}/videos/Patricia_Hayes.mp4` },
    { icon: ExecutiveIcons.cos, role: 'COS', name: 'Amaya Sinclair', subtitle: 'Staff', image: `${CDN_BASE_URL}/images/Amaya Sinclair COS.jpg`, videoUrl: `${CDN_BASE_URL}/videos/Amaya_Sinclair.mp4` },
];

interface ExecutiveVideoModalProps {
    executive: Executive;
    isOpen: boolean;
    onClose: () => void;
}

const ExecutiveVideoModal: FC<ExecutiveVideoModalProps> = ({ executive, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 no-auth-intercept"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl bg-[#141414] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                            {executive.image && (
                                <img src={executive.image} alt={executive.name} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base leading-tight">{executive.name}</h3>
                            <p className="text-white/70 text-xs">{executive.role} • {executive.subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Video Content */}
                <div className="aspect-video w-full bg-black flex items-center justify-center">
                    {executive.videoUrl ? (
                        <video
                            src={executive.videoUrl}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-white/40 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                <Play size={32} />
                            </div>
                            <p>Video coming soon...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ExecutiveTeamProps {
    speakingIndex: number;
}

const ExecutiveTeam: FC<ExecutiveTeamProps> = ({ speakingIndex }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedExecutive, setSelectedExecutive] = useState<Executive | null>(null);

    // Lock scroll when modal is open
    useEffect(() => {
        if (selectedExecutive) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [selectedExecutive]);

    return (
        <div style={{
            width: '100%',
            marginBottom: '40px'
        }}>
            <p style={{
                fontSize: '14px',
                color: 'var(--muted-foreground)',
                marginBottom: '18px',
                marginTop: '20px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontWeight: '600'
            }}>
                C-Level AI Executive Team
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-2">
                {executives.map((exec, index) => {
                    const isHovered = hoveredIndex === index;
                    const isSpeaking = index === speakingIndex;

                    return (
                        <div
                            key={exec.role}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => setSelectedExecutive(exec)}
                            className="exec-team-card group cursor-pointer"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '16px 12px 14px',
                                background: isHovered
                                    ? 'rgba(99, 102, 241, 0.1)'
                                    : isSpeaking ? 'rgba(74, 144, 217, 0.15)' : 'var(--card)',
                                border: isHovered
                                    ? '1px solid rgba(99, 102, 241, 0.5)'
                                    : isSpeaking ? '1px solid rgba(74, 144, 217, 0.25)' : '1px solid var(--border)',
                                borderRadius: '12px',
                                color: isHovered
                                    ? '#6366f1'
                                    : isSpeaking ? '#4A90D9' : 'var(--muted-foreground)',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                minWidth: '100px',
                                flex: '1 1 calc(33.333% - 12px)',
                                maxWidth: '180px'
                            }}
                        >
                            {/* Video indicator */}
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                opacity: isHovered ? 1 : 0.5,
                                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s ease',
                            }}>
                                <ExecutiveIcons.videoCall />
                            </div>

                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: index === speakingIndex
                                    ? 'rgba(74, 144, 217, 0.15)'
                                    : 'var(--muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                overflow: 'hidden',
                                position: 'relative',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            }}>
                                {exec.image ? (
                                    <Image
                                        src={exec.image}
                                        alt={exec.name}
                                        fill
                                        className="object-cover"
                                        sizes="44px"
                                    />
                                ) : (
                                    <Image
                                        src="/images/user-avatar.png"
                                        alt={exec.name}
                                        fill
                                        className="object-cover opacity-50"
                                        sizes="44px"
                                    />
                                )}
                                {isHovered && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <Play size={16} className="text-white fill-white" />
                                    </div>
                                )}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>{exec.role}</span>
                            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', opacity: 0.8, fontWeight: '500' }}>{exec.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', opacity: 0.6 }}>{exec.subtitle}</span>
                        </div>
                    );
                })}
            </div>

            {selectedExecutive && (
                <ExecutiveVideoModal
                    executive={selectedExecutive}
                    isOpen={!!selectedExecutive}
                    onClose={() => setSelectedExecutive(null)}
                />
            )}
        </div>
    );
};

export default ExecutiveTeam;

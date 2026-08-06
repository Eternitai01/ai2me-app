"use client";

import React, { FC, MouseEvent } from 'react';
import { useLanguage } from '@/lib/i18n';

// Icons for the Task Tools
const ToolIcons = {
    docs: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    slides: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    sheets: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
    ),
    code: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    design: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    image: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    video: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
    ),
    mail: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    aichat: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-4-7.5" />
            <path d="M8 20l-4 2 1-4" />
            <path d="M8 15l2-6 2 6" />
            <line x1="9" y1="13" x2="11" y2="13" />
            <line x1="14" y1="9" x2="14" y2="15" />
        </svg>
    ),
    clearview1: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
    ),
    clientAcquisition: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    appBuilder: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 8l-2 2 2 2" />
            <path d="M17 8l2 2-2 2" />
            <line x1="13" y1="7" x2="11" y2="13" />
        </svg>
    ),
};

export interface Tool {
    icon: FC;
    label: string;
    isNew?: boolean;
    isSoon?: boolean;
}

export const taskToolsLeftRow1: Tool[] = [
    { icon: ToolIcons.code, label: 'Web Builder' },
    { icon: ToolIcons.appBuilder, label: 'App Builder' },
    { icon: ToolIcons.slides, label: 'Slides' },
    { icon: ToolIcons.sheets, label: 'Sheets' },
    { icon: ToolIcons.docs, label: 'Docs' },
    { icon: ToolIcons.design, label: 'Agent Launchpad' },
];

export const taskToolsLeftRow2: Tool[] = [
    { icon: ToolIcons.aichat, label: 'AI Chat' },
    { icon: ToolIcons.image, label: 'Image' },
    { icon: ToolIcons.video, label: 'Video' },
    { icon: ToolIcons.clearview1, label: 'Business Management', isSoon: true },
    { icon: ToolIcons.clientAcquisition, label: 'Client Acquisition', isSoon: true },
];

export const taskToolsLeftRow3: Tool[] = [];

// Keep for backward compat
export const taskToolsRight: Tool[] = [];

interface TaskToolsProps {
    onToolClick?: (label: string) => void;
}

// Per-tool hover color config
const toolHoverColors: Record<string, { bg: string; border: string; color: string }> = {
    'Slides': { bg: 'rgba(249, 115, 22, 0.10)', border: 'rgba(249, 115, 22, 0.40)', color: '#F97316' },
    'Docs': { bg: 'rgba(59, 130, 246, 0.10)', border: 'rgba(59, 130, 246, 0.40)', color: '#3B82F6' },
    'Sheets': { bg: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.40)', color: '#22C55E' },
    'Business Management': { bg: 'rgba(234, 179, 8, 0.10)', border: 'rgba(234, 179, 8, 0.40)', color: '#EAB308' },
    'Image': { bg: 'rgba(168, 85, 247, 0.10)', border: 'rgba(236, 72, 153, 0.40)', color: '#A855F7' },
    'Video': { bg: 'rgba(208, 162, 247, 0.12)', border: 'rgba(208, 162, 247, 0.45)', color: '#D0A2F7' },
    // 'Design': { bg: 'rgba(236, 72, 153, 0.10)', border: 'rgba(236, 72, 153, 0.45)', color: '#BE185D' },
    'Web Builder': { bg: 'rgba(255, 0, 77, 0.10)', border: 'rgba(255, 0, 77, 0.45)', color: '#FF004D' },
    'AI Chat': { bg: 'rgba(99, 102, 241, 0.10)', border: 'rgba(99, 102, 241, 0.45)', color: '#6366f1' },
    'Agent Launchpad': { bg: 'rgba(236, 72, 153, 0.10)', border: 'rgba(236, 72, 153, 0.45)', color: '#BE185D' },
    'Client Acquisition': { bg: 'rgba(20, 184, 166, 0.10)', border: 'rgba(20, 184, 166, 0.45)', color: '#14B8A6' },
    'App Builder': { bg: 'rgba(99, 102, 241, 0.10)', border: 'rgba(99, 102, 241, 0.45)', color: '#6366F1' },
};

const TaskTools: FC<TaskToolsProps> = ({ onToolClick }) => {
    const { t } = useLanguage();
    const handleToolHover = (e: MouseEvent<HTMLButtonElement>, isEntering: boolean, label: string): void => {
        const target = e.currentTarget;
        if (isEntering) {
            const c = toolHoverColors[label] ?? { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.40)', color: '#6366f1' };
            target.style.background = c.bg;
            target.style.borderColor = c.border;
            target.style.color = c.color;
        } else {
            target.style.background = 'var(--card)';
            target.style.borderColor = 'var(--border)';
            target.style.color = 'var(--muted-foreground)';
        }
    };

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
                Productivity Tools
            </p>
            <div className="flex flex-col gap-3 items-center w-full max-w-[760px] mx-auto px-4 sm:px-0">
                {/* Row 1: Web Builder, App Builder, Slides, Sheets, Docs, Agent Launchpad */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
                    {taskToolsLeftRow1.map((tool) => (
                        <ToolCard key={tool.label} tool={tool} onToolClick={onToolClick} handleToolHover={handleToolHover} t={t} />
                    ))}
                </div>
                {/* Row 2: AI Chat, Images, Videos, Business Management, Client Acquisition */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
                    {taskToolsLeftRow2.map((tool) => (
                        <ToolCard key={tool.label} tool={tool} onToolClick={onToolClick} handleToolHover={handleToolHover} t={t} />
                    ))}
                </div>
            </div>
        </div>
    );
};

interface ToolCardProps {
    tool: Tool;
    onToolClick?: (label: string) => void;
    handleToolHover: (e: MouseEvent<HTMLButtonElement>, isEntering: boolean, label: string) => void;
    t: (key: string, fallback: string) => string;
}

const ToolCard: FC<ToolCardProps> = ({ tool, onToolClick, handleToolHover, t }) => (
    <button
        key={tool.label}
        onClick={() => onToolClick?.(tool.label)}
        className="task-tool-card w-[calc(50%-8px)] sm:w-[120px]"
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            padding: '18px 20px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            transition: 'all 0.2s ease',
            position: 'relative',
        }}
        onMouseEnter={(e) => handleToolHover(e, true, tool.label)}
        onMouseLeave={(e) => handleToolHover(e, false, tool.label)}
    >
        {tool.isSoon && (
            <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                fontSize: '9px',
                fontWeight: '600',
                color: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '2px 6px',
                borderRadius: '4px'
            }}>Soon</span>
        )}
        <tool.icon />
        <span style={{ fontSize: '12px', fontWeight: '500' }}>
            {t('landing.tool.' + tool.label.toLowerCase().replace(/ /g, '_'), tool.label)}
        </span>
    </button>
);

export default TaskTools;
 

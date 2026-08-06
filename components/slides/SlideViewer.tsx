"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Edit3, Code2, Layout, Sparkles, Copy, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

// Lazy-load syntax highlighter — large bundle, not needed on initial render
const SyntaxHighlighter = dynamic(
    () => import("react-syntax-highlighter").then((m) => m.Prism),
    { ssr: false, loading: () => null }
);
import type { PrismLight } from "react-syntax-highlighter";
// @ts-ignore
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";

/** Minimal HTML pretty-printer — adds newlines/indentation without a heavy dep */
function prettyHtml(html: string): string {
    try {
        let out = "";
        let indent = 0;
        const tab = "  ";
        // Split on tags while keeping them
        const parts = html.split(/(<[^>]+>)/g);
        for (const part of parts) {
            if (!part.trim()) continue;
            if (part.startsWith("</")) {
                indent = Math.max(0, indent - 1);
                out += `\n${tab.repeat(indent)}${part.trim()}`;
            } else if (part.startsWith("<") && !part.startsWith("<!--") && !part.endsWith("/>")) {
                const voidTags = /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i;
                out += `\n${tab.repeat(indent)}${part.trim()}`;
                if (!voidTags.test(part)) indent++;
            } else {
                const text = part.trim();
                if (text) out += `\n${tab.repeat(indent)}${text}`;
            }
        }
        return out.trim();
    } catch {
        return html;
    }
}

interface Slide {
    id: string;
    slide_number: number;
    title: string;
    html_content: string;
    updated_at?: string;
}

interface SlideViewerProps {
    slides: Slide[];
    sessionId: string;
    /**
     * Start a first deck from the empty state. There is deliberately no onRegenerate:
     * the deck view has no regenerate control, and the prop that used to exist was only
     * ever wired to this empty-state button — where "regenerate" was the wrong intent.
     * Regenerating a populated deck is done by asking in chat.
     */
    onCreate?: () => void;
    onEdit?: (slide: Slide) => void;
}

type Tab = "preview" | "code" | "thinking";

export function SlideViewer({ slides, onCreate, onEdit }: SlideViewerProps) {
    const [scale, setScale] = useState(1);
    const [slideTabs, setSlideTabs] = useState<Record<string, Tab>>({});
    const [codeCopied, setCodeCopied] = useState<Record<string, boolean>>({});
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const getActiveTab = (slideId: string): Tab => slideTabs[slideId] || "preview";

    // Show scroll-to-bottom button when not at bottom
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onScroll = () => {
            setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        // Re-evaluate whenever slides change
        onScroll();
        return () => el.removeEventListener("scroll", onScroll);
    }, [slides]);
    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;

            const { width } = containerRef.current.getBoundingClientRect();
            const targetWidth = 1280;
            const targetHeight = 720;

            // How much we can scale based on width
            const scaleW = (width - 60) / targetWidth;

            // How much we can scale based on viewport height (leave room for headers, paddings)
            const viewportHeight = window.innerHeight || 900;
            const availableHeight = viewportHeight - 260; // rough space for chat header + controls
            const scaleH = availableHeight / targetHeight;

            const raw = Math.min(scaleW, scaleH, 1);
            const clamped = Math.max(0.3, raw); // never shrink to 0, but allow fairly small slides
            setScale(clamped);
        };

        updateScale();
        window.addEventListener("resize", updateScale);
        return () => window.removeEventListener("resize", updateScale);
    }, [slides]);

    if (!slides || slides.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#0f0f12] text-white">
                <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)]">
                    <Layout className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white border-none">No Presentation Found</h3>
                <p className="text-sm text-gray-500 max-w-sm mt-3 leading-relaxed">
                    Start a conversation with our AI slide generator to create a stunning presentation deck in seconds.
                </p>
                {/* Must call onCreate, not onRegenerate: there is no deck to regenerate here,
                    and sending a "regenerate this presentation" prompt told the model a deck
                    already existed. */}
                {onCreate && (
                    <button
                        onClick={onCreate}
                        className="mt-8 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-95 shadow-xl"
                    >
                        Create Presentation
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0f0f12] overflow-hidden relative selection:bg-orange-500/30">
            <main
                ref={containerRef}
                className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col gap-10 p-8 bg-[#0a0a0c]"
            >
                {slides.map((slide, index) => {
                    const activeTab = getActiveTab(slide.id);
                    const slideUrl = `/api/ai/slides/${slide.id}/html?version=${encodeURIComponent(slide.updated_at || "")}`;

                    return (
                        <div
                            key={slide.id}
                            className="max-w-6xl mx-auto bg-[#0f0f12] rounded-3xl border border-[#2a2a2e] shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex flex-col"
                        >
                            {/* Per-slide header with tabs and actions */}
                            <header className="h-[60px] bg-[#1a1a1e] border-b border-[#2a2a2e] flex items-center justify-between px-6 shrink-0">
                                <div className="flex items-center gap-1.5 p-1 bg-[#121215] rounded-full border border-[#2a2a2e]">
                                    <button
                                        onClick={() =>
                                            setSlideTabs((prev) => ({ ...prev, [slide.id]: "preview" }))
                                        }
                                        className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "preview"
                                            ? "bg-[#35353a] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                                            : "text-gray-500 hover:text-gray-300 hover:bg-[#25252a]"
                                            }`}
                                    >
                                        Preview
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSlideTabs((prev) => ({ ...prev, [slide.id]: "code" }))
                                        }
                                        className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "code"
                                            ? "bg-[#35353a] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                                            : "text-gray-500 hover:text-gray-300 hover:bg-[#25252a]"
                                            }`}
                                    >
                                        Code
                                    </button>
                                    {/* <button
                                        onClick={() =>
                                            setSlideTabs((prev) => ({ ...prev, [slide.id]: "thinking" }))
                                        }
                                        className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "thinking"
                                            ? "bg-[#35353a] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                                            : "text-gray-500 hover:text-gray-300 hover:bg-[#25252a]"
                                            }`}
                                    >
                                        Thinking
                                    </button> */}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="hidden lg:flex items-center gap-2">
                                        <button
                                            onClick={() => onEdit?.(slide)}
                                            className="flex items-center gap-2 px-3.5 py-2 bg-[#25252a] rounded-xl border border-[#303035] text-gray-300 text-[11px] font-bold tracking-tight hover:bg-[#2d2d33] transition-all hover:border-[#3a3a40]"
                                        >
                                            <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                                            Advanced Edit
                                        </button>
                                    </div>

                                    <div className="h-6 w-px bg-[#2a2a2e] mx-1 hidden lg:block" />

                                    <div className="text-gray-400 text-xs font-black bg-[#121215] px-3 py-1.5 rounded-lg border border-[#2a2a2e]">
                                        {index + 1} / {slides.length}
                                    </div>
                                </div>
                            </header>

                            {/* Per-slide content */}
                            <div className="flex-1 flex items-center justify-center bg-[#0a0a0c]">
                                {activeTab === "preview" && (
                                    <div
                                        className="relative bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] rounded-sm border border-white/5"
                                        style={{
                                            width: `${1280 * scale}px`,
                                            height: `${720 * scale}px`,
                                            flexShrink: 0,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <iframe
                                            src={slideUrl}
                                            title={`Slide ${index + 1}`}
                                            loading="eager"
                                            // Slide HTML is model-generated and user-editable, and this
                                            // proxy serves it from our own origin. Without sandbox it would
                                            // run same-origin: reaching window.parent and calling /api/ai/*
                                            // with the user's cookies. allow-scripts WITHOUT allow-same-origin
                                            // forces an opaque origin — Tailwind CDN and slide scripts still
                                            // run, but they cannot touch the app. Never add allow-same-origin.
                                            sandbox="allow-scripts"
                                            style={{
                                                width: "1280px",
                                                height: "720px",
                                                transform: `scale(${scale})`,
                                                transformOrigin: "left top",
                                                border: "none",
                                                display: "block",
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                            }}
                                        />
                                    </div>
                                )}

                                {activeTab === "code" && (
                                    <div className="w-full h-full max-w-6xl mx-auto rounded-3xl border border-[#2a2a2e] bg-[#121215] overflow-hidden flex flex-col shadow-2xl">
                                        <div className="px-6 py-3.5 border-b border-[#2a2a2e] bg-[#1a1a1e] flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-orange-500/10 rounded-lg">
                                                    <Code2 className="w-4 h-4 text-orange-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">
                                                    Slide HTML Source
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(slide.html_content);
                                                    setCodeCopied(prev => ({ ...prev, [slide.id]: true }));
                                                    setTimeout(() => setCodeCopied(prev => ({ ...prev, [slide.id]: false })), 2000);
                                                }}
                                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-lg transition-all border border-white/10 uppercase tracking-widest active:scale-95"
                                            >
                                                {codeCopied[slide.id] ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                                {codeCopied[slide.id] ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-auto">
                                            {SyntaxHighlighter ? (
                                                <SyntaxHighlighter
                                                    language="markup"
                                                    style={vscDarkPlus}
                                                    showLineNumbers
                                                    wrapLines
                                                    wrapLongLines={false}
                                                    lineNumberStyle={{ color: "#3a3a4a", minWidth: "2.5em", paddingRight: "1em", userSelect: "none" }}
                                                    customStyle={{
                                                        margin: 0,
                                                        padding: "1.5rem",
                                                        background: "#0d0d10",
                                                        fontSize: "12px",
                                                        lineHeight: "1.65",
                                                        minHeight: "100%",
                                                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                                    }}
                                                >
                                                    {prettyHtml(slide.html_content)}
                                                </SyntaxHighlighter>
                                            ) : (
                                                <pre className="p-6 text-xs font-mono text-[#a9b1d6] overflow-auto whitespace-pre-wrap">
                                                    {prettyHtml(slide.html_content)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "thinking" && (
                                    <div className="flex flex-col items-center justify-center gap-8 p-16 max-w-xl text-center bg-[#1a1a1e]/50 backdrop-blur-2xl rounded-[40px] border border-[#2a2a2e] shadow-2xl">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transition-all group-hover:bg-blue-500/30" />
                                            <div className="relative w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10 shadow-inner">
                                                <Sparkles className="w-10 h-10 text-blue-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-white font-black text-2xl tracking-tight">
                                                AI Reasoning Mode
                                            </h4>
                                            <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                                We&apos;re analyzing this slide&apos;s structure, hierarchy, and
                                                messaging to keep it consistent with the rest of your deck.
                                            </p>
                                        </div>
                                        <div className="w-full bg-[#121215]/80 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                                            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                <span>Neural Analysis</span>
                                                <span className="text-blue-400">In Progress</span>
                                            </div>
                                            <div className="w-full bg-[#0a0a0c] h-2 rounded-full overflow-hidden border border-white/5">
                                                <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full w-[70%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Scroll-to-bottom arrow — centered, fades in when not at bottom */}
            {showScrollBtn && (
                <button
                    onClick={() => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" })}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm shadow-lg transition-all animate-fade-in"
                    title="Scroll to bottom"
                >
                    <ChevronDown className="w-5 h-5 text-white" />
                </button>
            )}
        </div>
    );
}

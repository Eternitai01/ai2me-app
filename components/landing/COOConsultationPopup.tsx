"use client";

import React, { FC, useRef, useEffect } from 'react';
import { X, MoreVertical, Smile, Paperclip, Mic, Search, CheckCheck } from 'lucide-react';
import { Executive } from './ExecutiveTeam';

interface TranscriptEntry {
    time: string;
    speaker: string;
    text: string;
}

interface COOConsultationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    isTyping: boolean;
    transcript: TranscriptEntry[];
    onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    executive?: Executive;
}

const COOConsultationPopup: FC<COOConsultationPopupProps> = ({
    isOpen,
    onClose,
    isTyping,
    transcript,
    onKeyPress,
    executive,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript, isTyping]);

    if (!isOpen) return null;

    const displayName = executive ? `${executive.name.toUpperCase()} | ${executive.role.toUpperCase()} ` : "AI EXECUTIVE";

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-all duration-300">
            <div className="w-full max-w-[880px] h-[640px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/10">

                {/* Telegram-style Header */}
                <div className="bg-[#3F51B5] text-white px-4 py-2.5 flex items-center justify-between shadow-md z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="hover:bg-white/10 p-2 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center overflow-hidden border border-white/20 shadow-inner relative">
                                {executive?.image ? (
                                    <img src={executive.image} alt={executive.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-sm">{executive?.name[0] || 'AI'}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-[15px] leading-tight text-white">{displayName}</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                                    <p className="text-[11px] opacity-90 font-medium italic">Bot</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Chat Body with Starry Night Gradient Background */}
                <div className="flex-1 relative overflow-hidden bg-black">
                    {/* Gradient + Starry sky background effect */}
                    <div
                        className="absolute inset-0 opacity-100"
                        style={{
                            background: 'linear-gradient(to bottom, #000000 0%, #000000 40%, #001d3d 100%), url("https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1000")',
                            backgroundBlendMode: 'screen',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'brightness(1.2)'
                        }}
                    />

                    <div
                        ref={scrollRef}
                        className="absolute inset-0 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-slate-300/50"
                    >
                        {transcript.map((item, i) => (
                            <div
                                key={i}
                                className={`flex w-full ${item.speaker === 'You' ? 'justify-end pl-12' : 'justify-start pr-12'}`}
                            >
                                <div className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm transition-all
                                    ${item.speaker === 'You'
                                        ? 'bg-[#efffde] text-slate-800 rounded-tr-[4px] border-b-2 border-[#d9eec1]'
                                        : 'bg-white text-slate-800 rounded-tl-[4px] border-b-2 border-slate-100'}`}
                                >
                                    {item.speaker !== 'You' && (
                                        <span className="text-[12px] font-bold text-indigo-600 block mb-1">{executive?.name || item.speaker}</span>
                                    )}
                                    <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{item.text}</p>
                                    <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                                        <span className="text-[10px] opacity-40 font-medium">{item.time}</span>
                                        {item.speaker === 'You' && (
                                            <CheckCheck className="w-3.5 h-3.5 text-[#4fae4e]" />
                                        )}
                                    </div>

                                    {/* Telegram Message Tail */}
                                    <div
                                        className={`absolute top-0 w-3 h-3 ${item.speaker === 'You' ? '-right-2' : '-left-2'}`}
                                        style={{
                                            clipPath: item.speaker === 'You' ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(0 0, 100% 100%, 100% 0)',
                                            background: item.speaker === 'You' ? '#efffde' : '#ffffff'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-2xl px-4 py-2.5 rounded-tl-[4px] shadow-sm border-b-2 border-slate-100">
                                    <span className="text-[12px] font-bold text-indigo-600 block mb-1">{executive?.name || 'AI'} is typing</span>
                                    <div className="flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.8s]" />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Input Area */}
                <div className="bg-white p-3 flex items-center gap-2 border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                    <button className="text-slate-400 hover:text-indigo-600 p-2 transition-colors">
                        <Smile className="w-6 h-6" />
                    </button>

                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            onKeyPress={onKeyPress}
                            className="flex-1 bg-transparent outline-none text-[15px] text-slate-700 placeholder:text-slate-400"
                        />
                        <div className="flex items-center gap-2 pr-1">
                            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <button className="bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
                        <Mic className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default COOConsultationPopup;

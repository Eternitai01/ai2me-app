'use client';

import { useState } from 'react';
import { Search, Plus, FolderOpen, Bot, Code, MessageSquare, Globe, Paperclip, Mic, Sparkles, ChevronLeft, ChevronRight, Settings, FileText, Calculator, Palette } from 'lucide-react';

// AI2me Logo Component
const AI2meLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00D4FF" />
        <stop offset="100%" stopColor="#0066FF" />
      </linearGradient>
    </defs>
    {/* Hexagon outline */}
    <path d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z" stroke="url(#logoGradient)" strokeWidth="4" fill="none"/>
    {/* Infinity symbol */}
    <path d="M30 50C30 42 36 36 44 36C52 36 56 42 50 50C44 58 48 64 56 64C64 64 70 58 70 50C70 42 64 36 56 36C48 36 44 42 50 50C56 58 52 64 44 64C36 64 30 58 30 50Z" stroke="url(#logoGradient)" strokeWidth="4" fill="none" strokeLinecap="round"/>
    {/* Sparkles */}
    <path d="M50 12L52 18L50 24L48 18L50 12Z" fill="url(#logoGradient)"/>
    <path d="M22 32L24 36L22 40L20 36L22 32Z" fill="url(#logoGradient)"/>
    <path d="M22 60L24 64L22 68L20 64L22 60Z" fill="url(#logoGradient)"/>
  </svg>
);
export default function Home() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('auto');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    console.log('Search:', query, 'Mode:', mode);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#1a1a2e] text-white relative flex flex-col transition-all duration-300`}>
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-6 bg-[#1a1a2e] border border-gray-600 rounded-full p-1 hover:bg-gray-700 transition-colors z-10"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <AI2meLogo size={28} />
          {!sidebarCollapsed && <span className="text-lg font-semibold">AI2me</span>}
        </div>

        {/* New Chat Button */}
        <div className="px-3 mb-2">
          <button className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors`}>
            <Plus className="w-5 h-5" />
            {!sidebarCollapsed && (
              <>
                <span>New Chat</span>
                <span className="ml-auto text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">K</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg hover:bg-white/10 transition-colors`}>
            <FolderOpen className="w-5 h-5" />
            {!sidebarCollapsed && <span>Projects</span>}
          </a>
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg hover:bg-white/10 transition-colors`}>
            <Bot className="w-5 h-5" />
            {!sidebarCollapsed && <span>Agents</span>}
          </a>
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg hover:bg-white/10 transition-colors`}>
            <Code className="w-5 h-5" />
            {!sidebarCollapsed && <span>Platform</span>}
          </a>
        </nav>

        {/* History */}
        {!sidebarCollapsed && (
          <div className="px-3 mt-6">
            <p className="text-xs text-gray-400 px-3 mb-2">Yesterday</p>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-gray-300">
              <MessageSquare className="w-4 h-4" />
              <span className="truncate">What are the key components o...</span>
            </a>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Links */}
        <div className="px-3 mb-2">
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm`}>
            <Globe className="w-5 h-5" />
            {!sidebarCollapsed && <span>Web Search API</span>}
          </a>
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm`}>
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Enterprise Solutions</span>}
          </a>
        </div>

        {/* User */}
        <div className={`p-3 border-t border-white/10 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3 px-3 py-2'}`}>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
              U
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium">User</p>
                <p className="text-xs text-gray-400">Free plan</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2">
              Upgrade <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex justify-end p-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            Upgrade <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
              Enhance your productivity with AI
            </h1>
            <p className="text-4xl font-bold text-gray-900 text-center mb-8">Smarter + Safer</p>

            {/* Search Box */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="How can I help?"
                className="w-full text-lg text-gray-700 placeholder-gray-400 focus:outline-none mb-4"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMode('auto')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${mode === 'auto' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('web')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${mode === 'web' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Globe className="w-4 h-4" />
                    Web
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('attach')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${mode === 'attach' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach
                  </button>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-sm">+ 3/3</span>
                  <Mic className="w-5 h-5" />
                </div>
              </div>
            </form>

            {/* Projects Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Dive back into your projects</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>See all</span>
                  <Plus className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <FolderOpen className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="font-medium text-gray-900">GTM Strategy</h3>
                <p className="text-sm text-gray-500">Nov 24, 2025</p>
              </div>
            </div>

            {/* Agents Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Explore our Agents or create your own</h2>
                  <span className="text-gray-400">?</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>See all</span>
                  <Plus className="w-4 h-4" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Research</h3>
                  <p className="text-sm text-gray-500">Deep research with industry-leading sources</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-3">
                    <Calculator className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Compute</h3>
                  <p className="text-sm text-gray-500">Solve complex data and math problems</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                    <Palette className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Create</h3>
                  <p className="text-sm text-gray-500">Transform ideas into polished content</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

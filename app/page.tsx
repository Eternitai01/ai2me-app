'use client';

import { useState } from 'react';
import { Search, Plus, FolderOpen, Bot, Code, MessageSquare, Globe, Paperclip, Mic, Sparkles, ChevronRight, Settings, FileText, Calculator, Palette } from 'lucide-react';

// AI2me Logo Component
const AI2meLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5L93.3 27.5V72.5L50 95L6.7 72.5V27.5L50 5Z" stroke="currentColor" strokeWidth="4" fill="none"/>
    <path d="M30 50C30 44 34 40 40 40C46 40 50 44 50 50C50 44 54 40 60 40C66 40 70 44 70 50C70 56 66 60 60 60C54 60 50 56 50 50C50 56 46 60 40 60C34 60 30 56 30 50Z" stroke="currentColor" strokeWidth="3" fill="none"/>
    <path d="M50 18L52 22L50 26L48 22L50 18Z" fill="currentColor"/>
    <path d="M50 74L52 78L50 82L48 78L50 74Z" fill="currentColor"/>
  </svg>
);

export default function Home() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('auto');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    console.log('Search:', query, 'Mode:', mode);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a2e] text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3">
          <AI2meLogo size={28} />
          <span className="text-lg font-semibold">AI2me</span>
        </div>

        {/* New Chat Button */}
        <div className="px-3 mb-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
            <span className="ml-auto text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">K</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
            <FolderOpen className="w-5 h-5" />
            <span>Projects</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
            <Bot className="w-5 h-5" />
            <span>Agents</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
            <Code className="w-5 h-5" />
            <span>Platform</span>
          </a>
        </nav>

        {/* History */}
        <div className="px-3 mt-6">
          <p className="text-xs text-gray-400 px-3 mb-2">Yesterday</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-gray-300 truncate">
            What are the key components o...
          </a>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Links */}
        <div className="px-3 py-4 space-y-1 border-t border-white/10">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm">
            <Globe className="w-4 h-4" />
            <span>Web Search API</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm">
            <Settings className="w-4 h-4" />
            <span>Enterprise Solutions</span>
          </a>
        </div>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">U</div>
            <div className="flex-1">
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-gray-400">Free plan</p>
            </div>
          </div>
          <button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
            Upgrade <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex justify-end p-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">+ 3/3</span>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                    <Mic className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </form>

            {/* Projects Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Dive back into your projects</h2>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100">See all</button>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <FolderOpen className="w-6 h-6 text-gray-400 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">GTM Strategy</h3>
                  <p className="text-sm text-gray-500">Nov 24, 2025</p>
                </div>
              </div>
            </div>

            {/* Agents Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Explore our Agents or create your own</h2>
                  <span className="text-gray-400 cursor-help">?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100">See all</button>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Research</h3>
                  <p className="text-sm text-gray-500">Deep research with industry-leading sources</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Compute</h3>
                  <p className="text-sm text-gray-500">Solve complex data and math problems</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Palette className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Create</h3>
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

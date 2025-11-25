'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, FolderOpen, Bot, Code, MessageSquare, Globe, Paperclip, Mic, ChevronRight, ChevronLeft, Sparkles, FileText, Settings, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';

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
    <path d="M50 8L87 28V68L50 88L13 68V28L50 8Z" stroke="url(#logoGradient)" strokeWidth="4" fill="none"/>
    {/* Infinity symbol - proper figure 8 */}
    <path d="M32 50C32 44 36 40 42 40C48 40 50 44 50 50C50 56 52 60 58 60C64 60 68 56 68 50C68 44 64 40 58 40C52 40 50 44 50 50C50 56 48 60 42 60C36 60 32 56 32 50Z" stroke="url(#logoGradient)" strokeWidth="3" fill="none"/>
    {/* Top sparkle */}
    <path d="M50 15L51.5 19L50 23L48.5 19L50 15Z" fill="url(#logoGradient)"/>
    {/* Left top sparkle */}
    <path d="M24 33L25.5 36L24 39L22.5 36L24 33Z" fill="url(#logoGradient)"/>
    {/* Left bottom sparkle */}
    <path d="M24 61L25.5 64L24 67L22.5 64L24 61Z" fill="url(#logoGradient)"/>
  </svg>
);

// LLM Models Data
const llmProviders = [
  {
    name: 'OpenAI',
    icon: '🟢',
    models: [
            { id: 'gpt-5', name: 'GPT-5', description: 'Most advanced model' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast & efficient' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Enhanced performance' },
      { id: 'o1-preview', name: 'o1 Preview', description: 'Advanced reasoning' },
      { id: 'o1-mini', name: 'o1 Mini', description: 'Fast reasoning' },
    ]
  },
  {
    name: 'Anthropic',
    icon: '🟠',
    models: [
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Best for coding' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most powerful' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast & light' },
    ]
  },
  {
    name: 'Google',
    icon: '🔵',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest & fastest' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Long context' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Quick responses' },
    ]
  },
  {
    name: 'Meta',
    icon: '🟣',
    models: [
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', description: 'Open source powerhouse' },
      { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', description: 'Largest open model' },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', description: 'Versatile performer' },
    ]
  },
  {
    name: 'Mistral',
    icon: '🟡',
    models: [
      { id: 'mistral-large', name: 'Mistral Large', description: 'Top tier reasoning' },
      { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', description: 'MoE architecture' },
      { id: 'mistral-medium', name: 'Mistral Medium', description: 'Balanced choice' },
    ]
  },
  {
    name: 'xAI',
    icon: '⚫',
    models: [
      { id: 'grok-2', name: 'Grok 2', description: 'Real-time knowledge' },
      { id: 'grok-2-mini', name: 'Grok 2 Mini', description: 'Efficient version' },
    ]
  },
  {
    name: 'Perplexity',
    icon: '🔷',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', description: 'Search-enhanced' },
      { id: 'sonar', name: 'Sonar', description: 'Quick search' },
    ]
  },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('auto');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState({ provider: 'Auto', model: 'Auto-select best model' });
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLLMDropdown(false);
        setExpandedProvider(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    console.log('Search:', query, 'Mode:', mode, 'LLM:', selectedLLM);
  };

  const selectModel = (provider: string, model: { id: string; name: string }) => {
    setSelectedLLM({ provider, model: model.name });
    setMode(model.id);
    setShowLLMDropdown(false);
    setExpandedProvider(null);
  };

  const selectAuto = () => {
    setSelectedLLM({ provider: 'Auto', model: 'Auto-select best model' });
    setMode('auto');
    setShowLLMDropdown(false);
    setExpandedProvider(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#1a1a2e] text-white transition-all duration-300 flex flex-col relative`}>
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-6 bg-[#1a1a2e] border border-gray-600 rounded-full p-1 hover:bg-gray-700"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <AI2meLogo size={28} />
          {!sidebarCollapsed && <span className="text-lg font-semibold">AI2me</span>}
        </div>

        {/* New Chat Button */}
        <div className="px-3 mb-2">
          <button className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white`}>
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
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-lg hover:bg-white/10`}>
            <FolderOpen className="w-5 h-5" />
            {!sidebarCollapsed && <span>Projects</span>}
          </a>
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-lg hover:bg-white/10`}>
            <Bot className="w-5 h-5" />
            {!sidebarCollapsed && <span>Agents</span>}
          </a>
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-lg hover:bg-white/10`}>
            <Code className="w-5 h-5" />
            {!sidebarCollapsed && <span>Platform</span>}
          </a>
        </nav>

        {/* History */}
        {!sidebarCollapsed && (
          <div className="px-3 mt-6">
            <p className="text-xs text-gray-400 px-3 mb-2">Yesterday</p>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10">
              <MessageSquare className="w-4 h-4" />
              <span className="truncate">What are the key components o...</span>
            </a>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Links */}
        <div className="px-3 mb-2">
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-lg hover:bg-white/10`}>
            <Globe className="w-5 h-5" />
            {!sidebarCollapsed && <span>Web Search API</span>}
          </a>
          <a href="#" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-lg hover:bg-white/10`}>
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
            <button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2">
              Upgrade <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
          <div className="flex justify-end items-center gap-4 p-4">                        <ThemeToggle />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
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
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-4 mb-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="How can I help?"
                className="w-full text-lg text-gray-700 placeholder-gray-400 focus:outline-none mb-4"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* LLM Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowLLMDropdown(!showLLMDropdown)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        mode === 'auto'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      } hover:bg-blue-50`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="max-w-[120px] truncate">
                        {selectedLLM.provider === 'Auto' ? 'Auto' : selectedLLM.model}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showLLMDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showLLMDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[400px] overflow-y-auto">
                        {/* Auto Option */}
                        <button
                          type="button"
                          onClick={selectAuto}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${
                            selectedLLM.provider === 'Auto' ? 'bg-blue-50' : ''
                          }`}
                        >
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Auto</p>
                            <p className="text-xs text-gray-500">AI2me selects the best model</p>
                          </div>
                          {selectedLLM.provider === 'Auto' && (
                            <span className="ml-auto text-blue-600">✓</span>
                          )}
                        </button>

                        <div className="border-t border-gray-100 my-2" />

                        {/* LLM Providers */}
                        {llmProviders.map((provider) => (
                          <div key={provider.name}>
                            <button
                              type="button"
                              onClick={() => setExpandedProvider(
                                expandedProvider === provider.name ? null : provider.name
                              )}
                              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50"
                            >
                              <span className="text-lg">{provider.icon}</span>
                              <span className="font-medium text-gray-900">{provider.name}</span>
                              <ChevronRight
                                className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${
                                  expandedProvider === provider.name ? 'rotate-90' : ''
                                }`}
                              />
                            </button>

                            {/* Models Submenu */}
                            {expandedProvider === provider.name && (
                              <div className="bg-gray-50 py-1">
                                {provider.models.map((model) => (
                                  <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => selectModel(provider.name, model)}
                                    className={`w-full px-4 pl-12 py-2 flex items-center gap-3 hover:bg-gray-100 ${
                                      selectedLLM.model === model.name ? 'bg-blue-50' : ''
                                    }`}
                                  >
                                    <div className="text-left flex-1">
                                      <p className="text-sm font-medium text-gray-900">{model.name}</p>
                                      <p className="text-xs text-gray-500">{model.description}</p>
                                    </div>
                                    {selectedLLM.model === model.name && (
                                      <span className="text-blue-600">✓</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('web')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                      mode === 'web' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Web
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('attach')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                      mode === 'attach' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                    }`}
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
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                    <Code className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Compute</h3>
                  <p className="text-sm text-gray-500">Solve complex data and math problems</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
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

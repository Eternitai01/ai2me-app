'use client';

import { useState } from 'react';
import { Search, Sparkles, ArrowRight, Zap, Brain, Globe } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    // Add your API call here
    setTimeout(() => setIsSearching(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">AI2me</span>
          </div>
          <div className="flex gap-4">
            <button className="text-slate-300 hover:text-white">Sign In</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Get Started</button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Your AI-Powered
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"> Search Assistant</span>
          </h1>
          <p className="text-xl text-slate-300 mb-12">Get instant, accurate answers powered by AI. Search smarter, not harder.</p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full pl-12 pr-14 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 p-2 rounded-xl hover:bg-blue-700">
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <Zap className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-slate-400">Get instant answers powered by advanced AI models</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <Brain className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Smart Context</h3>
              <p className="text-slate-400">AI understands context and provides relevant results</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <Globe className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Web Search</h3>
              <p className="text-slate-400">Access real-time information from across the web</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

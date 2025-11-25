'use client';

import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';

// AI2me Logo Component
const AI2meLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hexagon */}
    <path d="M50 5L93.3 27.5V72.5L50 95L6.7 72.5V27.5L50 5Z" stroke="currentColor" strokeWidth="4" fill="none"/>
    {/* Infinity symbol */}
    <path d="M30 50C30 44 34 40 40 40C46 40 50 44 50 50C50 44 54 40 60 40C66 40 70 44 70 50C70 56 66 60 60 60C54 60 50 56 50 50C50 56 46 60 40 60C34 60 30 56 30 50Z" stroke="currentColor" strokeWidth="3" fill="none"/>
    {/* Top sparkle */}
    <path d="M50 18L52 22L50 26L48 22L50 18Z" fill="currentColor"/>
    {/* Bottom sparkle */}
    <path d="M50 74L52 78L50 82L48 78L50 74Z" fill="currentColor"/>
    {/* Left sparkle */}
    <path d="M22 50L26 52L22 54L18 52L22 50Z" fill="currentColor"/>
    {/* Right sparkle */}
    <path d="M78 50L82 52L78 54L74 52L78 50Z" fill="currentColor"/>
  </svg>
);

export default function Home() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 2000);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AI2meLogo />
            <span className="text-xl font-semibold text-gray-900">AI2me</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Features</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Pricing</a>
            <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          Search smarter.
          <br />
          <span className="text-gray-400">Not harder.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
          AI-powered answers to your questions. Fast, accurate, and beautifully simple.
        </p>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full pl-12 pr-14 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors bg-gray-50 hover:bg-white"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Quick suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {['How does AI work?', 'Best productivity tips', 'Explain quantum computing'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setQuery(suggestion)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24 border-t border-gray-100">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-500">Get answers in milliseconds, powered by advanced AI.</p>
          </div>
          <div className="text-center p-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Accurate Results</h3>
            <p className="text-gray-500">Context-aware responses that understand your intent.</p>
          </div>
          <div className="text-center p-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clean & Simple</h3>
            <p className="text-gray-500">No clutter, no ads. Just the information you need.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="container mx-auto px-6 text-center text-gray-400 text-sm">
          © 2025 AI2me. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

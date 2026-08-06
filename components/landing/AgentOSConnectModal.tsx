"use client";
import { useState } from "react";
import { X, Key, Rocket, CheckCircle, Loader2, ExternalLink, Bot, AlertCircle, Webhook, ChevronRight } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "inactive";
  platform: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = "choose" | "agentos" | "custom";

export function AgentOSConnectModal({ open, onClose }: Props) {
  const [mode, setMode]       = useState<Mode>("choose");
  const [apiKey, setApiKey]   = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [step, setStep]       = useState<"input" | "loading" | "connected" | "error">("input");
  const [agents, setAgents]   = useState<Agent[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = () => {
    setMode("choose");
    setStep("input");
    setApiKey("");
    setWebhookUrl("");
    setErrorMsg("");
    setAgents([]);
  };

  const handleConnect = async () => {
    if (mode === "agentos" && !apiKey.trim()) return;
    if (mode === "custom" && !webhookUrl.trim()) return;
    setStep("loading");
    try {
      if (mode === "agentos") {
        const res = await fetch("/api/integrations/agentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: apiKey.trim() }),
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setAgents(data.agents || []);
      } else {
        // Generic agent: store the webhook URL
        const res = await fetch("/api/integrations/custom-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhook_url: webhookUrl.trim(), api_key: apiKey.trim() }),
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setAgents(data.agents || [{ id: "custom", name: "Custom Agent", role: "AI Assistant", status: "active", platform: "Custom" }]);
      }
      setStep("connected");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect. Please check your credentials.");
      setStep("error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f111a 0%, #141728 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              {mode === "choose" ? (
                <>
                  <h2 className="text-base font-bold text-white">Connect your AI agent</h2>
                  <p className="text-xs text-white/50">Link any AI agent to the AI2me platform</p>
                </>
              ) : mode === "agentos" ? (
                <>
                  <h2 className="text-base font-bold text-white">AgentOS 24/7</h2>
                  <p className="text-xs text-white/50">Auto-sync your deployed agents</p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-bold text-white">Custom AI agent</h2>
                  <p className="text-xs text-white/50">Connect via webhook or API</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={mode === "choose" ? onClose : reset}
            style={{ background: "none", border: "none", cursor: "pointer" }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">

          {/* ── Step 1: Choose mode ── */}
          {mode === "choose" && (
            <div className="space-y-3">
              <p className="text-sm text-white/60 mb-5">
                Choose how you want to connect your AI agent to AI2me's productivity suite.
              </p>

              {/* AgentOS option */}
              <button
                onClick={() => setMode("agentos")}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/8 hover:bg-indigo-500/15 hover:border-indigo-500/50 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 shrink-0">
                  <Rocket className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white">AgentOS 24/7</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Recommended</span>
                  </div>
                  <p className="text-xs text-white/45">Instantly sync all your deployed agents — Amaya, Raj, Elena and more</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
              </button>

              {/* Custom agent option */}
              <button
                onClick={() => setMode("custom")}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/15 transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-white/8 shrink-0">
                  <Webhook className="w-5 h-5 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white mb-0.5">Custom AI agent</p>
                  <p className="text-xs text-white/45">Connect any agent via webhook URL or API key</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
              </button>
            </div>
          )}

          {/* ── AgentOS flow ── */}
          {mode === "agentos" && (step === "input" || step === "error") && (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                Enter your AgentOS 24/7 API key to instantly sync your deployed agents with AI2me.
              </p>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                  API Key
                </label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus-within:border-indigo-500/50 transition-colors">
                  <Key className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    type="password"
                    placeholder="agentos_sk_..."
                    value={apiKey}
                    onChange={e => { setApiKey(e.target.value); setStep("input"); }}
                    onKeyDown={e => e.key === "Enter" && handleConnect()}
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  />
                </div>
                {step === "error" && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errorMsg}
                  </div>
                )}
              </div>
              <button
                onClick={handleConnect}
                disabled={!apiKey.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40"
                style={{ border: "none", cursor: apiKey.trim() ? "pointer" : "not-allowed" }}
              >
                Connect Agents
              </button>
              <div className="flex items-center justify-center">
                <a
                  href="https://agentos247.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Get your API key at agentos247.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* ── Custom agent flow ── */}
          {mode === "custom" && (step === "input" || step === "error") && (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                Connect any AI agent using a webhook endpoint or API key. Works with OpenClaw, n8n, Make, and custom agents.
              </p>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                  Webhook URL
                </label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus-within:border-indigo-500/50 transition-colors">
                  <Webhook className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    type="url"
                    placeholder="https://your-agent.com/webhook"
                    value={webhookUrl}
                    onChange={e => { setWebhookUrl(e.target.value); setStep("input"); }}
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                  API Key <span className="normal-case text-white/30">(optional)</span>
                </label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus-within:border-indigo-500/50 transition-colors">
                  <Key className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    type="password"
                    placeholder="sk_..."
                    value={apiKey}
                    onChange={e => { setApiKey(e.target.value); setStep("input"); }}
                    onKeyDown={e => e.key === "Enter" && handleConnect()}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  />
                </div>
                {step === "error" && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errorMsg}
                  </div>
                )}
              </div>
              <button
                onClick={handleConnect}
                disabled={!webhookUrl.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40"
                style={{ border: "none", cursor: webhookUrl.trim() ? "pointer" : "not-allowed" }}
              >
                Connect Agent
              </button>
            </div>
          )}

          {/* ── Loading ── */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-white/50">Connecting your agent...</p>
            </div>
          )}

          {/* ── Connected ── */}
          {step === "connected" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {agents.length} agent{agents.length !== 1 ? "s" : ""} connected
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {agents.map(agent => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/8 bg-white/4"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                      <p className="text-xs text-white/40 truncate">{agent.role} · {agent.platform}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${agent.status === "active" ? "bg-green-400" : "bg-white/20"}`} />
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ border: "none", cursor: "pointer" }}
              >
                Done — Start using agents
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLazyCreditData } from "@/hooks/use-lazy-credit-data";
import {
  Zap, CreditCard, Plug, Settings, Key, User,
  ArrowRight, ArrowLeft, ChevronRight, TrendingUp, Star,
  CheckCircle, AlertCircle, RefreshCw, ExternalLink,
  Rocket, Code2, MessageSquare, ImageIcon, Video,
} from "lucide-react";

const SheetIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);
const AIDocsIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const AISlidesIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

// ─── Quick action cards ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: Code2,       label: "Web Builder",  color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   route: "/project/new" },
  { icon: MessageSquare, label: "AI Chat",   color: "#6366f1", bg: "rgba(99,102,241,0.1)",  route: "/chat?agent_id=ai-chat" },
  { icon: SheetIcon,   label: "AI Sheets",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",   route: "/ai-sheets" },
  { icon: AIDocsIcon,  label: "AI Docs",     color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  route: "/ai-docs" },
  { icon: AISlidesIcon,label: "AI Slides",   color: "#f97316", bg: "rgba(249,115,22,0.1)",  route: "/ai-slides" },
  { icon: ImageIcon,   label: "AI Image",    color: "#f472b6", bg: "rgba(244,114,182,0.1)", route: "/chat?agent_id=ai-image" },
  { icon: Video,       label: "AI Video",    color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  route: "/chat?agent_id=ai-video" },
  { icon: Rocket,      label: "AgentOS 24/7",color: "#a855f7", bg: "rgba(168,85,247,0.1)",  route: "https://agentos247.com", external: true },
];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, loading, onClick }: {
  icon: any; label: string; value: string | number; sub?: string;
  color: string; loading?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col gap-3 p-5 rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] transition-all duration-200 ${onClick ? "cursor-pointer hover:border-[var(--chat-accent)]/40 hover:bg-[var(--chat-bg-tertiary)]" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {onClick && <ChevronRight className="w-4 h-4 text-[var(--chat-text-muted)]" />}
      </div>
      {loading ? (
        <div className="h-7 w-24 rounded-lg bg-[var(--chat-bg-tertiary)] animate-pulse" />
      ) : (
        <div>
          <p className="text-2xl font-bold text-[var(--chat-text-primary)] font-outfit">{value}</p>
          <p className="text-xs text-[var(--chat-text-muted)] mt-0.5">{label}</p>
          {sub && <p className="text-[11px] text-[var(--chat-text-muted)] mt-1 opacity-70">{sub}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-[var(--chat-text-muted)] uppercase tracking-widest mb-3">{children}</h2>;
}

// ─── Main page ────────────────────────────────────────────────────────────────


/** Shows AgentOS connection status — auto-detected from account provisioning */
function AgentConnectionCard() {
  const [agents, setAgents] = useState<{ name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/agents", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setAgents(d.agents || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!agents.length) return null;

  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-green-500/15">
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">AI agents connected</p>
          <p className="text-xs text-white/50">{agents.length} agent{agents.length !== 1 ? "s" : ""} ready — just give them instructions</p>
        </div>
      </div>
      <div className="space-y-2">
        {agents.map((a, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/4">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-sm text-white/80 flex-1">{a.name}</span>
            <span className="text-xs text-green-400 font-medium">{a.status}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/35 mt-3">
        Your agents automatically save all work to this workspace.
      </p>
    </div>
  );
}

export default function AccountPage() {
  const router  = useRouter();
  const { user } = useAuth();
  const { creditBalance, creditBalanceLoading, loadCreditBalance, refreshCreditBalance } = useLazyCreditData();
  const [subData, setSubData]     = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSub = async () => {
    try {
      const r = await fetch("/api/subscriptions/current", { credentials: "include" });
      if (r.ok) setSubData(await r.json());
    } catch {}
    setSubLoading(false);
  };

  useEffect(() => {
    loadCreditBalance();
    fetchSub();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSubLoading(true);
    await Promise.all([refreshCreditBalance(), fetchSub()]);
    setRefreshing(false);
  };

  const credits        = creditBalance?.available_credits ?? 0;
  const totalCredits   = creditBalance?.total_purchased ?? 0;
  const usedCredits    = totalCredits - credits;
  const usagePct       = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;
  const planName       = subData?.plan?.name?.replace(/_(monthly|yearly)$/, "").replace(/_/g, " ") ?? "Free";
  const planStatus     = subData?.subscription?.status ?? "inactive";
  const isActive       = planStatus === "active";
  const renewDate      = subData?.subscription?.current_period_end;
  const userName       = user?.full_name || user?.email?.split("@")[0] || "there";
  const userInitial    = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen text-[var(--chat-text-primary)] dark" style={{ background: "#0a0a0a" }}>
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/landing")}
              className="p-2 rounded-xl transition-all hover:bg-white/10 text-[var(--chat-text-muted)] hover:text-white"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              title="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--chat-accent)] to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {userInitial}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-outfit">Welcome back, {userName.split(" ")[0]}</h1>
              <p className="text-sm text-[var(--chat-text-muted)] mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-secondary)] transition-all border border-[var(--chat-border)]"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Zap} label="Credits remaining" color="#6366f1"
            value={creditBalanceLoading ? "—" : credits.toLocaleString()}
            sub={totalCredits > 0 ? `${usagePct}% used` : undefined}
            loading={creditBalanceLoading}
            onClick={() => router.push("/dashboard/credits")}
          />
          <StatCard
            icon={CreditCard} label="Current plan" color="#22c55e"
            value={subLoading ? "—" : planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase()}
            sub={isActive ? "Active" : "Inactive"}
            loading={subLoading}
            onClick={() => router.push("/dashboard/subscription")}
          />
          <StatCard
            icon={TrendingUp} label="Credits used" color="#f97316"
            value={creditBalanceLoading ? "—" : usedCredits.toLocaleString()}
            sub="This period"
            loading={creditBalanceLoading}
          />
          <StatCard
            icon={Star} label="Plan status" color={isActive ? "#22c55e" : "#ef4444"}
            value={isActive ? "Active" : "Inactive"}
            sub={subLoading ? undefined : (renewDate
              ? `Renews ${new Date(renewDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : undefined
            )}
            loading={subLoading}
            onClick={() => router.push("/dashboard/subscription")}
          />
        </div>

        {/* ── Credits bar ── */}
        {!creditBalanceLoading && totalCredits > 0 && (
          <div className="p-5 rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--chat-text-primary)]">Credit usage</span>
              <span className="text-xs text-[var(--chat-text-muted)]">{credits.toLocaleString()} of {totalCredits.toLocaleString()} remaining</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--chat-bg-tertiary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePct}%`,
                  background: usagePct > 80 ? "#ef4444" : usagePct > 60 ? "#f97316" : "#6366f1"
                }}
              />
            </div>
            {usagePct > 80 && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                Running low — <button onClick={() => router.push("/dashboard/credits")} className="underline cursor-pointer" style={{ background: "none", border: "none", color: "inherit" }}>top up credits</button>
              </div>
            )}
          </div>
        )}

        {/* ── Quick actions ── */}
        <div>
          <SectionTitle>Start something</SectionTitle>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, color, bg, route, external }) => (
              <button
                key={label}
                onClick={() => external ? window.open(route, "_blank") : router.push(route)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-[var(--chat-border)] hover:border-[var(--chat-accent)]/40 transition-all duration-200 group"
                style={{ background: "none", cursor: "pointer" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className="text-[10px] text-[var(--chat-text-muted)] group-hover:text-[var(--chat-text-primary)] transition-colors text-center leading-tight font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Account section ── */}
        <div>
          <SectionTitle>Account</SectionTitle>
          <div className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] overflow-hidden divide-y divide-[var(--chat-border)]">
            {[
              { icon: CreditCard, label: "Subscription & Plan",   sub: `${planName} plan · ${isActive ? "Active" : "Inactive"}`, route: "/dashboard/subscription",   color: "#22c55e" },
              { icon: Zap,        label: "Credits",               sub: `${credits.toLocaleString()} credits remaining`,            route: "/dashboard/credits",        color: "#6366f1" },
              { icon: Plug,       label: "Connectors",            sub: "Manage integrations and connected apps",                  route: "/connectors",     color: "#06b6d4" },
              { icon: Key,        label: "API Keys",              sub: "Manage your API access keys",                             route: "/dashboard/api-keys",       color: "#f97316" },
              { icon: Settings,   label: "Settings",              sub: "Account preferences and profile",                        route: "/dashboard/settings",       color: "#94a3b8" },
            ].map(({ icon: Icon, label, sub, route, color }) => (
              <button
                key={label}
                onClick={() => router.push(route)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--chat-bg-tertiary)] transition-colors text-left group"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <div className="p-2 rounded-xl shrink-0" style={{ background: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--chat-text-primary)]">{label}</p>
                  <p className="text-xs text-[var(--chat-text-muted)] truncate">{sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--chat-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* ── AgentOS connection status ── */}
        <AgentConnectionCard />

        {/* ── AgentOS upsell (shown only when NOT connected) ── */}
        <div
          className="flex items-center gap-5 p-5 rounded-2xl border cursor-pointer hover:border-purple-500/50 transition-all"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)", borderColor: "rgba(99,102,241,0.2)" }}
          onClick={() => window.open("https://agentos247.com", "_blank")}
        >
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--chat-accent)] to-purple-600 shrink-0">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--chat-text-primary)]">Deploy your AI Agent</p>
            <p className="text-xs text-[var(--chat-text-muted)] mt-0.5">Get your own 24/7 AI executive team with AgentOS 24/7</p>
          </div>
          <ExternalLink className="w-4 h-4 text-[var(--chat-text-muted)] shrink-0" />
        </div>

      </div>
    </div>
  );
}

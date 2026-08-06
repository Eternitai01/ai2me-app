"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { connectorApi } from "@/lib/connector-api";
import { Connector } from "@/types/connector";
import { ConnectorModal } from "@/components/organisms/connector-modal";
import { toast } from "sonner";
import { BrandLogos } from "@/components/brand-logos";
import {
  Plug, Search, CheckCircle2, Loader2,
  Globe, Database, Mail, Calendar, Code2, Zap,
  Github, Chrome, FolderOpen, MessageSquare,
  Server, Table2, Webhook, Slack, Cpu,
  MoreHorizontal, Trash2, RefreshCw, ExternalLink,
  Phone, Mic, Volume2, Video, CreditCard,
} from "lucide-react";

// ─── Integration Catalog ────────────────────────────────────────────────────

type Category = "All" | "Databases" | "Storage" | "Productivity" | "Developer" | "Email" | "Automation" | "Voice & AI";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  logo?: keyof typeof BrandLogos; // Brand logo key (if available)
  iconColor: string;
  iconBg: string;
  category: Category;
  status: "available" | "soon" | "oauth";
  connectorType?: string; // maps to connector_type in DB
  oauthId?: string; // for OAuth-based connectors (e.g. google-drive)
  popular?: boolean;
}

const INTEGRATIONS: Integration[] = [
  // Payments
  {
    id: "stripe",
    name: "Stripe",
    description: "Connect your Stripe account to analyse payments, revenue, customers, and invoices in chat.",
    icon: CreditCard,
    logo: "stripe",
    iconColor: "#635bff",
    iconBg: "rgba(99,91,255,0.12)",
    category: "Databases",
    status: "available",
    connectorType: "stripe",
    popular: true,
  },
  // Databases
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "Connect any PostgreSQL database and query your data in chat.",
    icon: Database,
    logo: "postgresql",
    iconColor: "#6366f1",
    iconBg: "rgba(99,102,241,0.12)",
    category: "Databases",
    status: "available",
    connectorType: "postgresql",
    popular: true,
  },
  {
    id: "mysql",
    name: "MySQL",
    description: "Connect MySQL databases to bring structured data into AI2me.",
    icon: Database,
    logo: "mysql",
    iconColor: "#f97316",
    iconBg: "rgba(249,115,22,0.12)",
    category: "Databases",
    status: "soon",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "Query your document collections with natural language.",
    icon: Database,
    logo: "mongodb",
    iconColor: "#22c55e",
    iconBg: "rgba(34,197,94,0.12)",
    category: "Databases",
    status: "soon",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Connect your Supabase project for instant data access.",
    icon: Cpu,
    logo: "supabase",
    iconColor: "#3ecf8e",
    iconBg: "rgba(62,207,142,0.12)",
    category: "Databases",
    status: "soon",
  },
  // Storage
  {
    id: "s3",
    name: "Amazon S3",
    description: "Connect S3 buckets to analyse files and documents in chat.",
    icon: Server,
    logo: "s3",
    iconColor: "#f59e0b",
    iconBg: "rgba(245,158,11,0.12)",
    category: "Storage",
    status: "available",
    connectorType: "s3",
    popular: true,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Access Docs, Sheets, and Drive files as AI context.",
    icon: FolderOpen,
    logo: "google-drive",
    iconColor: "#4285f4",
    iconBg: "rgba(66,133,244,0.12)",
    category: "Storage",
    status: "oauth",
    oauthId: "google-drive",
    popular: true,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Bring your Notion workspace, pages, and databases into chat.",
    icon: Table2,
    logo: "notion",
    iconColor: "#ffffff",
    iconBg: "rgba(255,255,255,0.1)",
    popular: true,
  },
  // Productivity
  {
    id: "slack",
    name: "Slack",
    description: "Search and reference Slack messages and threads.",
    icon: MessageSquare,
    logo: "slack",
    iconColor: "#e01e5a",
    iconBg: "rgba(224,30,90,0.12)",
    category: "Productivity",
    status: "oauth",
    oauthId: "slack",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Let AI2me see your schedule and help manage your time.",
    icon: Calendar,
    logo: "google-calendar",
    iconColor: "#34a853",
    iconBg: "rgba(52,168,83,0.12)",
    category: "Email",
    status: "oauth",
    oauthId: "google-calendar",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Search emails, summarise threads, and draft replies in chat.",
    icon: Mail,
    logo: "gmail",
    iconColor: "#ea4335",
    iconBg: "rgba(234,67,53,0.12)",
    category: "Email",
    status: "oauth",
    oauthId: "gmail",
    popular: true,
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Connect Microsoft 365 email and calendar.",
    icon: Mail,
    logo: "outlook",
    iconColor: "#0078d4",
    iconBg: "rgba(0,120,212,0.12)",
    category: "Email",
    status: "oauth",
    oauthId: "outlook",
  },
  // Developer
  {
    id: "github",
    name: "GitHub",
    description: "Reference repos, issues, PRs, and code in your conversations.",
    icon: Github,
    logo: "github",
    iconColor: "#ffffff",
    iconBg: "rgba(255,255,255,0.1)",
    popular: true,
    status: "oauth",
    oauthId: "github",
  },
  {
    id: "rest-api",
    name: "REST API",
    description: "Connect any REST endpoint and use live data in chat.",
    icon: Globe,
    iconColor: "#06b6d4",
    iconBg: "rgba(6,182,212,0.12)",
    category: "Developer",
    // TODO: needs custom modal UI, not OAuth
    status: "soon",
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "Receive data from any external service via webhook.",
    icon: Webhook,
    iconColor: "#a855f7",
    iconBg: "rgba(168,85,247,0.12)",
    category: "Developer",
    // TODO: needs custom modal UI, not OAuth
    status: "soon",
  },
  // Automation
  {
    id: "zapier",
    name: "Zapier",
    description: "Trigger Zaps and connect 5000+ apps through AI2me.",
    icon: Zap,
    logo: "zapier",
    iconColor: "#ff4f00",
    iconBg: "rgba(255,79,0,0.12)",
    category: "Automation",
    // TODO: needs custom modal UI, not OAuth
    status: "soon",
  },
  {
    id: "make",
    name: "Make",
    description: "Build powerful automations with Make (formerly Integromat).",
    icon: Zap,
    logo: "make",
    iconColor: "#6d00cc",
    iconBg: "rgba(109,0,204,0.12)",
    category: "Automation",
    status: "soon",
  },
  // Voice & AI
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS, voice calls, and WhatsApp messaging via Twilio APIs.",
    icon: Phone,
    logo: "twilio",
    iconColor: "#F22F46",
    iconBg: "rgba(242,47,70,0.12)",
    category: "Voice & AI",
    status: "soon",
  },
  {
    id: "vapi",
    name: "Vapi",
    description: "AI-powered voice agents and phone call automation.",
    icon: Mic,
    logo: "vapi",
    iconColor: "#7C3AED",
    iconBg: "rgba(124,58,237,0.12)",
    category: "Voice & AI",
    status: "soon",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Ultra-realistic AI voice synthesis and text-to-speech.",
    icon: Volume2,
    logo: "elevenlabs",
    iconColor: "#ffffff",
    iconBg: "rgba(255,255,255,0.08)",
    category: "Voice & AI",
    status: "soon",
  },
  {
    id: "heygen",
    name: "HeyGen",
    description: "AI video generation with realistic avatars and voice cloning.",
    icon: Video,
    logo: "heygen",
    iconColor: "#00D4FF",
    iconBg: "rgba(0,212,255,0.10)",
    category: "Voice & AI",
    status: "soon",
  },
];

const CATEGORIES: Category[] = ["All", "Databases", "Storage", "Productivity", "Email", "Developer", "Automation", "Voice & AI"];

// ─── ConnectorCard ───────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  activeConnector,
  onConnect,
  oauthStatus,
  oauthConnecting,
}: {
  integration: Integration;
  activeConnector?: Connector;
  onConnect: (integration: Integration) => void;
  oauthStatus: Record<string, { connected: boolean; email?: string }>;
  oauthConnecting: string | null;
}) {
  const Icon = integration.icon;
  const Logo = integration.logo ? BrandLogos[integration.logo] : null;
  const isConnected = !!activeConnector;

  return (
    <div
      className="relative flex flex-col gap-4 p-5 rounded-2xl border transition-all group"
      style={{
        background: "var(--chat-bg-secondary)",
        borderColor: isConnected ? "rgba(34,197,94,0.3)" : "var(--chat-border)",
      }}
    >
      {/* Popular badge */}
      {integration.popular && !isConnected && (
        <span
          className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
        >
          Popular
        </span>
      )}

      {/* Connected badge */}
      {isConnected && (
        <span
          className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}
        >
          <CheckCircle2 className="w-2.5 h-2.5" />
          Connected
        </span>
      )}

      {/* Icon + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: integration.iconBg }}
        >
          {Logo ? (
            <Logo className="w-5 h-5" />
          ) : (
            <Icon className="w-5 h-5" style={{ color: integration.iconColor }} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
            {integration.name}
          </p>
          <p className="text-[10px] text-[var(--chat-text-muted)] uppercase tracking-wider">
            {integration.category}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--chat-text-muted)] leading-relaxed flex-1">
        {integration.description}
      </p>

      {/* Action */}
      {integration.status === "available" ? (
        <button
          onClick={() => onConnect(integration)}
          className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: isConnected ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.15)",
            color: isConnected ? "#4ade80" : "#818cf8",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isConnected ? "Manage" : "Connect"}
        </button>
      ) : integration.status === "oauth" ? (
        <button
          onClick={() => onConnect(integration)}
          className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: oauthStatus[integration.oauthId!]?.connected
              ? "rgba(34,197,94,0.1)"
              : "rgba(66,133,244,0.15)",
            color: oauthStatus[integration.oauthId!]?.connected ? "#4ade80" : "#4285f4",
            border: "none",
            cursor: "pointer",
          }}
        >
          {oauthConnecting === integration.oauthId ? (
            "Connecting…"
          ) : oauthStatus[integration.oauthId!]?.connected ? (
            "Connected ✓"
          ) : (
            "Connect"
          )}
        </button>
      ) : (
        <div
          className="w-full py-2 rounded-xl text-xs font-semibold text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "var(--chat-text-muted)",
          }}
        >
          Coming Soon
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConnectorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConnectorType, setSelectedConnectorType] = useState<string>("");
  const [oauthStatus, setOauthStatus] = useState<Record<string, { connected: boolean; email?: string }>>({});
  const [oauthConnecting, setOauthConnecting] = useState<string | null>(null);

  const loadConnectors = async () => {
    try {
      setIsLoading(true);
      const response = await connectorApi.getConnectors(1, 100);
      setConnectors(response.connectors);
    } catch {
      // silent — just show empty state
    } finally {
      setIsLoading(false);
    }
  };

  const OAUTH_PROVIDER_IDS = [
    "google-drive",
    "gmail",
    "google-calendar",
    "github",
    "slack",
    "notion",
    "outlook",
  ];

  const loadOauthStatus = useCallback(async () => {
    const results = await Promise.allSettled(
      OAUTH_PROVIDER_IDS.map((id) =>
        fetch(`/api/connectors/${id}/status`).then((r) => r.json())
      )
    );
    const next: Record<string, { connected: boolean; email?: string }> = {};
    OAUTH_PROVIDER_IDS.forEach((id, i) => {
      const result = results[i];
      next[id] = result.status === "fulfilled" ? result.value : { connected: false };
    });
    setOauthStatus(next);
  }, []);

  useEffect(() => {
    loadConnectors();
    loadOauthStatus();
  }, [loadOauthStatus]);

  // Handle OAuth redirect back
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      // Map slug back to display name
      const displayNames: Record<string, string> = {
        "google-drive": "Google Drive",
        gmail: "Gmail",
        "google-calendar": "Google Calendar",
        github: "GitHub",
        slack: "Slack",
        notion: "Notion",
        outlook: "Outlook",
      };
      const name = displayNames[connected] ?? connected;
      toast.success(`${name} connected!`);
      loadOauthStatus();
      router.replace("/connectors");
    } else if (error) {
      // Extract provider from error prefix
      const errorMsgs: Record<string, string> = {
        denied: "Authorization denied.",
        token_exchange: "Token exchange failed.",
        store_failed: "Could not save credentials.",
        not_authenticated: "Please log in first.",
        no_code: "No authorization code received.",
        callback_error: "An unexpected error occurred.",
      };
      const parts = error.split("_");
      const suffix = parts.slice(1).join("_");
      toast.error(errorMsgs[suffix] ?? `Connection failed: ${error}`);
      router.replace("/connectors");
    }
  }, [searchParams, loadOauthStatus, router]);

  // Find active connector for a given integration
  const getActiveConnector = (integration: Integration) =>
    connectors.find((c) => c.connector_type === integration.connectorType);

  // Filter integrations
  const filtered = INTEGRATIONS.filter((i) => {
    const matchCat = activeCategory === "All" || i.category === activeCategory;
    const matchSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleConnect = async (integration: Integration) => {
    // OAuth flow — generic handler for all OAuth providers
    if (integration.status === "oauth" && integration.oauthId) {
      const oauthId = integration.oauthId;

      // If already connected, show disconnect option
      if (oauthStatus[oauthId]?.connected) {
        if (confirm(`Disconnect ${integration.name}?`)) {
          await handleOauthDisconnect(oauthId);
        }
        return;
      }

      setOauthConnecting(oauthId);
      try {
        const res = await fetch(`/api/connectors/${oauthId}/auth`);
        const { auth_url, error } = await res.json();
        if (error) throw new Error(error);
        window.location.href = auth_url;
      } catch {
        toast.error(`Failed to start ${integration.name} connection.`);
        setOauthConnecting(null);
      }
      return;
    }
    // Standard DB connector flow
    if (!integration.connectorType) return;
    setSelectedConnectorType(integration.connectorType);
    setModalOpen(true);
  };

  const handleOauthDisconnect = async (oauthId: string) => {
    try {
      const cookieToken = document.cookie
        .split("; ")
        .find((c) => c.startsWith("auth-token="))
        ?.split("=")[1];
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${backendUrl}/v1/oauth/${oauthId}/disconnect`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${cookieToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const displayNames: Record<string, string> = {
        "google-drive": "Google Drive",
        gmail: "Gmail",
        "google-calendar": "Google Calendar",
        github: "GitHub",
        slack: "Slack",
        notion: "Notion",
        outlook: "Outlook",
      };
      toast.success(`${displayNames[oauthId] ?? oauthId} disconnected.`);
      setOauthStatus((prev) => ({ ...prev, [oauthId]: { connected: false } }));
    } catch {
      toast.error("Failed to disconnect.");
    }
  };

  const connectedCount =
    INTEGRATIONS.filter((i) => getActiveConnector(i)).length +
    INTEGRATIONS.filter(
      (i) => i.status === "oauth" && i.oauthId && oauthStatus[i.oauthId]?.connected
    ).length;

  return (
    <div
      className="min-h-screen text-[var(--chat-text-primary)]"
      style={{ background: "var(--chat-bg-primary)" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: "rgba(99,102,241,0.12)" }}
          >
            <Plug className="w-5 h-5" style={{ color: "#818cf8" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Connectors</h1>
            <p className="text-sm text-[var(--chat-text-muted)]">
              {isLoading
                ? "Loading..."
                : connectedCount > 0
                ? `${connectedCount} active connection${connectedCount !== 1 ? "s" : ""}`
                : "Connect your tools and data sources"}
            </p>
          </div>
        </div>

        {/* ── Search ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{
            background: "var(--chat-bg-secondary)",
            borderColor: "var(--chat-border)",
          }}
        >
          <Search className="w-4 h-4 text-[var(--chat-text-muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--chat-text-primary)] placeholder:text-[var(--chat-text-muted)] outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
              className="text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* ── Category pills ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background:
                  activeCategory === cat
                    ? "rgba(99,102,241,0.2)"
                    : "var(--chat-bg-secondary)",
                color:
                  activeCategory === cat
                    ? "#818cf8"
                    : "var(--chat-text-muted)",
                border:
                  activeCategory === cat
                    ? "1px solid rgba(99,102,241,0.4)"
                    : "1px solid var(--chat-border)",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--chat-text-muted)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-sm text-[var(--chat-text-muted)]">No integrations found for "{search}"</p>
            <button
              onClick={() => { setSearch(""); setActiveCategory("All"); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                activeConnector={getActiveConnector(integration)}
                onConnect={handleConnect}
                oauthStatus={oauthStatus}
                oauthConnecting={oauthConnecting}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Connector create modal (reuse existing) ── */}
      {modalOpen && (
        <ConnectorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onConnectorSaved={() => { setModalOpen(false); loadConnectors(); toast.success("Connector added!"); }}
          mode="create"
        />
      )}
    </div>
  );
}

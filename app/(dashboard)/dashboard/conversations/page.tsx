"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  MessageSquare,
  Globe,
  Send,
  Search,
  ChevronLeft,
  ChevronRight,
  MessagesSquare,
  X,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useConversations,
  type ConversationChannel,
  type ConversationTurn,
} from "@/hooks/use-conversations";

// ─── Channel Icon ────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: ConversationChannel }) {
  if (channel === "telegram") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: "#229ED9" }}
        title="Telegram"
      >
        <Send className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (channel === "whatsapp") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: "#25D366" }}
        title="WhatsApp"
      >
        <MessageSquare className="h-3.5 w-3.5" />
      </span>
    );
  }
  // web
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0 bg-slate-500"
      title="Web"
    >
      <Globe className="h-3.5 w-3.5" />
    </span>
  );
}

function ChannelBadge({ channel }: { channel: ConversationChannel }) {
  const label =
    channel === "telegram"
      ? "Telegram"
      : channel === "whatsapp"
      ? "WhatsApp"
      : "Web";
  const color =
    channel === "telegram"
      ? "bg-sky-500/10 text-sky-500 border-sky-500/20"
      : channel === "whatsapp"
      ? "bg-green-500/10 text-green-500 border-green-500/20"
      : "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", color)}>
      {label}
    </Badge>
  );
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  if (isNaN(then)) return isoDate;
  const diffMs = Date.now() - then;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(isoDate).toLocaleDateString();
}

function truncate(text: string, max: number): string {
  if (!text) return "—";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[40px_160px_1fr_1fr_120px] gap-3 items-center px-4 py-3 border-b border-border/50"
        >
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-full max-w-[240px]" />
          <Skeleton className="h-4 w-full max-w-[200px]" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type ChannelFilter = "all" | ConversationChannel;

const CHANNEL_FILTERS: { value: ChannelFilter; label: string }[] = [
  { value: "all", label: "All channels" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "web", label: "Web" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function ConversationsPage() {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [agentFilter, setAgentFilter]     = useState<string>("all");
  const [agentList, setAgentList]         = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTurn, setSelectedTurn] = useState<ConversationTurn | null>(null);

  // Load distinct agent names on mount
  useEffect(() => {
    fetch("/api/v1/conversations/agents")
      .then((r) => r.json())
      .then((d) => { if (d.agents) setAgentList(d.agents); })
      .catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  const handleChannelFilter = useCallback((f: ChannelFilter) => {
    setChannelFilter(f);
    setPage(1);
  }, []);

  const handleDateFrom = useCallback((v: string) => {
    setDateFrom(v);
    setPage(1);
  }, []);

  const handleDateTo = useCallback((v: string) => {
    setDateTo(v);
    setPage(1);
  }, []);

  const clearDateFilters = useCallback(() => {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }, []);

  const opts = {
    page,
    pageSize: PAGE_SIZE,
    channel: channelFilter,
    agentName: agentFilter !== "all" ? agentFilter : undefined,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { conversations, total, retentionDays, hasOlder, loading, error, refetch } = useConversations(opts);

  // Initial load + re-fetch when any filter/date/page changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 md:pl-[10px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessagesSquare className="h-7 w-7" />
            Conversations
          </h1>
          <p className="text-muted-foreground mt-1">
            All agent conversation turns across your connected channels.
          </p>
        </div>
        <Button
          variant="outlineBlack"
          onClick={() => refetch(true)}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Card>
        {/* Retention upsell banner — shown only when limit is active and older data exists */}
        {retentionDays > 0 && retentionDays < 365 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-amber-500/20 bg-amber-500/5 rounded-t-lg">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span className="text-amber-200">
                Showing last <span className="font-semibold">{retentionDays} days</span> of conversations.
                {hasOlder && " Older history is archived."}
              </span>
            </div>
            <a
              href="/dashboard/subscription"
              className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0"
            >
              Upgrade for longer history
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
        {/* Filters row */}
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Channel tabs */}
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 border border-border/50">
              {CHANNEL_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleChannelFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors font-medium",
                    channelFilter === f.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Agent filter */}
            {agentList.length > 0 && (
              <select
                value={agentFilter}
                onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-border bg-muted/50 px-2 text-sm text-foreground cursor-pointer hover:border-primary/50 transition-colors"
              >
                <option value="all">All agents</option>
                {agentList.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="relative min-w-[160px] flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search messages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-border bg-muted/50 hover:border-primary/50 focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/50 transition-colors"
              />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFrom(e.target.value)}
                max={dateTo || new Date().toISOString().slice(0, 10)}
                style={{ colorScheme: "dark" }}
                className="h-9 w-[140px] rounded-md border border-border bg-muted/50 px-2 text-sm text-foreground cursor-pointer hover:border-primary/50 transition-colors"
              />
              <span className="text-muted-foreground text-xs px-1">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateTo(e.target.value)}
                min={dateFrom || undefined}
                max={new Date().toISOString().slice(0, 10)}
                style={{ colorScheme: "dark" }}
                className="h-9 w-[140px] rounded-md border border-border bg-muted/50 px-2 text-sm text-foreground cursor-pointer hover:border-primary/50 transition-colors"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={clearDateFilters}
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-border/50 bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear dates"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Count */}
            {!loading && total > 0 && (
              <span className="text-sm text-muted-foreground ml-auto">
                {total.toLocaleString()} total
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
              <p className="text-red-500 text-sm">{error}</p>
              <Button variant="outlineBlack" size="sm" onClick={() => refetch(true)}>
                Try Again
              </Button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && <TableSkeleton />}

          {/* Empty state */}
          {!loading && !error && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-3">
              <MessagesSquare className="h-12 w-12 text-muted-foreground/30" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                  Your agent activity will appear here once your agent starts
                  chatting.
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && !error && conversations.length > 0 && (
            <div className="overflow-x-auto">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[40px_160px_1fr_1fr_130px] gap-3 items-center px-4 py-2 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span />
                <span>Agent</span>
                <span>User message</span>
                <span>Agent reply</span>
                <span className="text-right">Time</span>
              </div>

              {/* Rows */}
              <div>
                {conversations.map((turn) => (
                  <button
                    key={turn.id}
                    onClick={() => setSelectedTurn(turn)}
                    className="w-full text-left grid md:grid-cols-[40px_160px_1fr_1fr_130px] grid-cols-1 gap-3 items-start md:items-center px-4 py-3 border-b border-border/50 hover:bg-accent/50 transition-colors group"
                  >
                    {/* Channel icon — hidden on mobile, shown inline on md+ */}
                    <span className="hidden md:flex justify-center">
                      <ChannelIcon channel={turn.channel} />
                    </span>

                    {/* Mobile: compact layout */}
                    <span className="md:hidden flex items-center gap-2 mb-1">
                      <ChannelIcon channel={turn.channel} />
                      <span className="text-sm font-medium truncate">{turn.agent_name || "—"}</span>
                      <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                        {relativeTime(turn.created_at)}
                      </span>
                    </span>

                    {/* Agent name — desktop */}
                    <span className="hidden md:block text-sm font-medium truncate">
                      {turn.agent_name || "—"}
                    </span>

                    {/* User message */}
                    <span className="text-sm text-muted-foreground truncate leading-snug">
                      <span className="md:hidden text-xs font-semibold text-muted-foreground/70 uppercase mr-1">
                        User:
                      </span>
                      {truncate(turn.user_message, 80)}
                    </span>

                    {/* Agent reply */}
                    <span className="text-sm text-muted-foreground truncate leading-snug">
                      <span className="md:hidden text-xs font-semibold text-muted-foreground/70 uppercase mr-1">
                        Agent:
                      </span>
                      {truncate(turn.agent_reply, 80)}
                    </span>

                    {/* Timestamp — desktop */}
                    <span className="hidden md:block text-xs text-muted-foreground text-right group-hover:text-foreground transition-colors">
                      {relativeTime(turn.created_at)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlineBlack"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outlineBlack"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded detail modal */}
      <Dialog open={!!selectedTurn} onOpenChange={(open) => !open && setSelectedTurn(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTurn && <ChannelIcon channel={selectedTurn.channel} />}
              Conversation Detail
              {selectedTurn && (
                <ChannelBadge channel={selectedTurn.channel} />
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTurn && (
            <div className="space-y-4 mt-2">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground border-b border-border pb-3">
                <span>
                  <span className="font-medium text-foreground">Agent:</span>{" "}
                  {selectedTurn.agent_name || "—"}
                </span>
                <span>
                  <span className="font-medium text-foreground">Time:</span>{" "}
                  {new Date(selectedTurn.created_at).toLocaleString()}
                </span>
                {selectedTurn.session_id && (
                  <span>
                    <span className="font-medium text-foreground">Session:</span>{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {selectedTurn.session_id}
                    </code>
                  </span>
                )}
              </div>

              {/* User message */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  User message
                </p>
                <div className="rounded-lg bg-muted/50 border border-border/50 px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedTurn.user_message || (
                    <span className="italic text-muted-foreground">No message</span>
                  )}
                </div>
              </div>

              {/* Agent reply */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Agent reply
                </p>
                <div className="rounded-lg bg-muted/50 border border-border/50 px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedTurn.agent_reply || (
                    <span className="italic text-muted-foreground">No reply</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

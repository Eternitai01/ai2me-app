import { useState, useCallback, useRef } from "react";

export type ConversationChannel = "telegram" | "whatsapp" | "web";

export interface ConversationTurn {
  id: string;
  channel: ConversationChannel;
  agent_name: string;
  user_message: string;
  agent_reply: string;
  created_at: string;
  user_id?: string;
  session_id?: string;
}

export interface ConversationsResponse {
  conversations: ConversationTurn[];
  total: number;
  page: number;
  page_size: number;
  retention_days: number;       // -1 = unlimited
  retention_cutoff: string | null;
  has_older: boolean;
}

interface UseConversationsOptions {
  page?: number;
  pageSize?: number;
  channel?: ConversationChannel | "all";
  agentName?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UseConversationsReturn {
  conversations: ConversationTurn[];
  total: number;
  retentionDays: number;
  retentionCutoff: string | null;
  hasOlder: boolean;
  loading: boolean;
  error: string | null;
  refetch: (bustCache?: boolean) => Promise<void>;
}

const CACHE_DURATION = 30_000;

interface CacheEntry {
  data: ConversationsResponse;
  timestamp: number;
}

const cacheStore: Record<string, CacheEntry> = {};

function buildUrl(opts: UseConversationsOptions): string {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("page_size", String(opts.pageSize ?? 50));
  if (opts.channel && opts.channel !== "all") {
    params.set("channel", opts.channel);
  }
  if (opts.agentName && opts.agentName !== "all") {
    params.set("agent_name", opts.agentName);
  }
  if (opts.search && opts.search.trim()) {
    params.set("search", opts.search.trim());
  }
  if (opts.dateFrom) params.set("date_from", opts.dateFrom);
  if (opts.dateTo)   params.set("date_to",   opts.dateTo);
  return `/api/v1/conversations?${params.toString()}`;
}

export function useConversations(
  opts: UseConversationsOptions = {}
): UseConversationsReturn {
  const [conversations, setConversations] = useState<ConversationTurn[]>([]);
  const [total, setTotal] = useState(0);
  const [retentionDays, setRetentionDays] = useState<number>(14);
  const [retentionCutoff, setRetentionCutoff] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async (bustCache = false) => {
    const url = buildUrl(opts);
    const cached = cacheStore[url];

    if (!bustCache && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setConversations(cached.data.conversations);
      setTotal(cached.data.total);
      setRetentionDays(cached.data.retention_days ?? 14);
      setRetentionCutoff(cached.data.retention_cutoff ?? null);
      setHasOlder(cached.data.has_older ?? false);
      setLoading(false);
      setError(null);
      return;
    }

    if (bustCache) delete cacheStore[url];

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        credentials: "include",
        cache: "no-cache",
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data: ConversationsResponse = await response.json();
      const normalized: ConversationsResponse = {
        conversations: Array.isArray(data.conversations) ? data.conversations : [],
        total: typeof data.total === "number" ? data.total : 0,
        page: typeof data.page === "number" ? data.page : 1,
        page_size: typeof data.page_size === "number" ? data.page_size : 50,
        retention_days: typeof data.retention_days === "number" ? data.retention_days : 14,
        retention_cutoff: data.retention_cutoff ?? null,
        has_older: data.has_older ?? false,
      };

      cacheStore[url] = { data: normalized, timestamp: Date.now() };
      setConversations(normalized.conversations);
      setTotal(normalized.total);
      setRetentionDays(normalized.retention_days);
      setRetentionCutoff(normalized.retention_cutoff);
      setHasOlder(normalized.has_older);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Failed to load conversations";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [opts.page, opts.pageSize, opts.channel, opts.agentName, opts.search, opts.dateFrom, opts.dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  return { conversations, total, retentionDays, retentionCutoff, hasOlder, loading, error, refetch };
}

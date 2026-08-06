import { getSharedAuthToken } from "@/lib/authTokenBridge";

export interface ChatMessage {
  id: string;
  type: "outgoing" | "incoming";
  text: string;
  timestamp: string;
  ai_metadata?: {
    provider?: string;
    model?: string;
    processing_time_ms?: number;
    prd_content?: string;
    project_info?: Record<string, unknown>;
  };
  attachments?: any[];
}

export interface ChatSession {
  session_id: string;
  title: string;
  preview: string;
  preview_url?: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  agent_id?: string | null;
}

export interface ChatHistory {
  session_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  total_messages: number;
  agent_id?: string | null;
  /** AI Docs: persisted editor HTML (manual edits + last generation), if any */
  document_html?: string | null;
  /** Sheets / Docs / Slides: last clarification questionnaire for restore */
  last_clarification?: {
    intro?: string | null;
    questions?: unknown[];
    answers?: unknown[];
    status?: string;
  } | null;
}

export interface ChatSessionList {
  sessions: ChatSession[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProjectSummary {
  project_id: string;
  project_path?: string;
  preview_url?: string | null;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  agent_id?: string | null;
}

export interface ProjectList {
  projects: ProjectSummary[];
  total: number;
}

class ChatHistoryService {
  // Use Next.js API route proxy instead of calling AI service directly from browser
  private baseUrl = "/api/chat";

  // In-memory token cache — never persisted to localStorage
  // localStorage tokens go stale across secret rotations and deployments
  private _cachedToken: string | null = null;
  private _tokenFetchedAt = 0;

  private _syncFromBridge() {
    const bridgeToken = getSharedAuthToken();
    if (bridgeToken && bridgeToken !== this._cachedToken) {
      this._cachedToken = bridgeToken;
      this._tokenFetchedAt = Date.now();
    }
  }
  private static readonly TOKEN_TTL_MS = 5 * 60 * 1000; // refresh every 5 min

  private getHeaders() {
    this._syncFromBridge();
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem("ai_service_api_key") : null;
    // Use in-memory token (refreshed by ensureToken); fall back to auth-token cookie
    const cookieToken = typeof document !== 'undefined'
      ? document.cookie.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=').slice(1).join('=')
      : null;
    const effectiveToken = this._cachedToken || cookieToken;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (effectiveToken) {
      headers["Authorization"] = `Bearer ${effectiveToken}`;
    } else if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    return headers;
  }

  // Always fetch a fresh token from NextAuth — no localStorage, works in every browser
  async ensureToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const now = Date.now();
    // Re-use in-memory cached token if still fresh
    if (this._cachedToken && (now - this._tokenFetchedAt) < ChatHistoryService.TOKEN_TTL_MS) {
      return true;
    }
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(4000) });
      if (!res.ok) { this._cachedToken = null; return false; }
      const session = await res.json();
      const token = (session as any)?.backendToken;
      if (token) {
        this._cachedToken = token;
        this._tokenFetchedAt = now;
        // Also clear any stale localStorage token to avoid confusion
        try { localStorage.removeItem("ai2me_backend_token"); } catch { /**/ }
        return true;
      }
    } catch { /* ignore — session endpoint unavailable */ }
    this._cachedToken = null;
    return false;
  }

  // SSM-tunneled prod DB can take 8–15s+; keep client abort well above that.
  private static readonly FETCH_TIMEOUT_MS = 60_000;

  async getChatSessions(
    skip: number = 0,
    limit: number = 200
  ): Promise<ChatSessionList> {
    const controller = new AbortController();
    const timer = typeof window !== 'undefined'
      ? setTimeout(() => controller.abort(), ChatHistoryService.FETCH_TIMEOUT_MS)
      : null;
    try {
      const response = await fetch(
        `${this.baseUrl}/sessions?skip=${skip}&limit=${limit}`,
        { method: "GET", headers: this.getHeaders(), credentials: "include", cache: "no-cache", signal: controller.signal }
      );
      if (response.status === 401) {
        // Token invalid — fetch a fresh one from NextAuth and retry once.
        if (typeof window !== 'undefined') localStorage.removeItem("ai2me_backend_token");
        await this.ensureToken();
        const retry = await fetch(
          `${this.baseUrl}/sessions?skip=${skip}&limit=${limit}`,
          { method: "GET", headers: this.getHeaders(), credentials: "include", cache: "no-cache" }
        );
        if (!retry.ok) {
          console.warn("ChatHistory: sessions fetch failed after token refresh:", retry.status);
          return { sessions: [], total: 0, skip, limit };
        }
        return await retry.json();
      }
      if (!response.ok) {
        console.warn("ChatHistory: sessions fetch failed:", response.status);
        return { sessions: [], total: 0, skip, limit };
      }
      return await response.json();
    } catch (error) {
      console.warn("ChatHistory: Error fetching chat sessions:", error);
      return { sessions: [], total: 0, skip, limit };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async getProjects(): Promise<ProjectList> {
    // Ensure we have a fresh token before fetching — same pattern as getChatSessions
    await this.ensureToken();
    // Start abort timer only after token work so ensureToken does not eat the budget.
    const controller = new AbortController();
    const timer = typeof window !== 'undefined'
      ? setTimeout(() => controller.abort(), ChatHistoryService.FETCH_TIMEOUT_MS)
      : null;
    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        method: "GET",
        headers: this.getHeaders(),
        credentials: "include",
        cache: "no-cache",
        signal: controller.signal,
      });
      if (response.status === 401) {
        // Token stale — refresh and retry once
        if (typeof window !== 'undefined') localStorage.removeItem("ai2me_backend_token");
        await this.ensureToken();
        const retry = await fetch(`${this.baseUrl}/projects`, {
          method: "GET", headers: this.getHeaders(), credentials: "include", cache: "no-cache",
        });
        if (!retry.ok) {
          console.warn("ChatHistory: projects fetch failed after token refresh:", retry.status);
          return { projects: [], total: 0 };
        }
        return await retry.json();
      }
      if (!response.ok) {
        console.warn("ChatHistory: projects fetch failed:", response.status);
        return { projects: [], total: 0 };
      }
      return await response.json();
    } catch (error) {
      console.warn("ChatHistory: Error fetching projects:", error);
      return { projects: [], total: 0 };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async getChatHistory(sessionId: string): Promise<ChatHistory | null> {
    try {
      const headers = this.getHeaders();

      const response = await fetch(
        `${this.baseUrl}/sessions/${sessionId}`,
        {
          method: "GET",
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.warn("ChatHistory: Failed to fetch history:", errorData);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn("ChatHistory: Error fetching chat history:", error);
      return null;
    }
  }

  async deleteChatSession(sessionId: string): Promise<boolean> {
    try {
      const headers = this.getHeaders();

      const response = await fetch(
        `${this.baseUrl}/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.warn("ChatHistory: Failed to delete session:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.warn("ChatHistory: Error deleting chat session:", error);
      return false;
    }
  }

  async renameChatSession(sessionId: string, title: string): Promise<{ title: string } | null> {
    try {
      const headers = this.getHeaders();

      const response = await fetch(
        `${this.baseUrl}/sessions/${sessionId}`,
        {
          method: "PATCH",
          headers,
          credentials: "include",
          body: JSON.stringify({ title }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.warn("ChatHistory: Failed to rename session:", errorData);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn("ChatHistory: Error renaming chat session:", error);
      return null;
    }
  }
}

const chatHistoryService = new ChatHistoryService();
export default chatHistoryService;

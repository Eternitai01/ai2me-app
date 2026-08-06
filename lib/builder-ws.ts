/**
 * AI2me Builder WebSocket Client
 * Sprint 2 — streaming generation events with exponential-backoff reconnect
 * and polling fallback when WebSocket is unavailable.
 */

import { builderApi, GenerationJob } from "./builder-api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface GenerationStreamEvent {
  type:
    | "thinking"
    | "chunk"
    | "file_created"
    | "file_updated"
    | "build_log"
    | "complete"
    | "error";
  data: string;
  file_path?: string;
  progress?: number; // 0-100
}

type EventHandler = (event: GenerationStreamEvent) => void;
type CompleteHandler = () => void;
type ErrorHandler = (error: Error) => void;

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const WS_BASE_URL = "wss://us.be.ai2me.com/v1/builder/generation";
const MAX_RETRIES = 3;
const BASE_RECONNECT_DELAY_MS = 1000;
const POLL_INTERVAL_MS = 2000;

const ACTIVE_GENERATION_STATUSES: GenerationJob["status"][] = [
  "queued",
  "processing",
];

// ─────────────────────────────────────────────
// BuilderWebSocket
// ─────────────────────────────────────────────

export class BuilderWebSocket {
  private readonly jobId: string;
  private readonly token: string;

  private ws: WebSocket | null = null;
  private retryCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private usingFallback = false;
  private destroyed = false;

  private eventHandlers: EventHandler[] = [];
  private completeHandlers: CompleteHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  constructor(jobId: string, token: string) {
    this.jobId = jobId;
    this.token = token;
  }

  // ── Public registration API ──────────────────

  onEvent(handler: EventHandler): void {
    this.eventHandlers.push(handler);
  }

  onComplete(handler: CompleteHandler): void {
    this.completeHandlers.push(handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  // ── Lifecycle ────────────────────────────────

  connect(): void {
    if (this.destroyed) return;
    this.tryWebSocket();
  }

  disconnect(): void {
    this.destroyed = true;
    this.clearTimers();
    if (this.ws) {
      this.ws.onclose = null; // prevent reconnect on intentional close
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  // ── WebSocket path ───────────────────────────

  private buildWsUrl(): string {
    return `${WS_BASE_URL}/${encodeURIComponent(this.jobId)}/stream?token=${encodeURIComponent(this.token)}`;
  }

  private tryWebSocket(): void {
    if (this.destroyed) return;

    try {
      const ws = new WebSocket(this.buildWsUrl());
      this.ws = ws;

      ws.onopen = () => {
        // Reset retry counter on successful connection
        this.retryCount = 0;
      };

      ws.onmessage = (evt: MessageEvent) => {
        this.handleRawMessage(evt.data);
      };

      ws.onerror = () => {
        // onerror is always followed by onclose; do nothing here
      };

      ws.onclose = (evt: CloseEvent) => {
        if (this.destroyed) return;

        if (!evt.wasClean && this.retryCount < MAX_RETRIES) {
          this.scheduleReconnect();
        } else if (!evt.wasClean) {
          // Exhausted retries — switch to polling fallback
          this.startPollingFallback();
        }
      };
    } catch {
      // WebSocket constructor can throw in some environments (e.g. SSR)
      this.startPollingFallback();
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    this.retryCount += 1;
    const delay =
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.retryCount - 1);

    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) {
        this.tryWebSocket();
      }
    }, delay);
  }

  // ── Polling fallback ─────────────────────────

  private startPollingFallback(): void {
    if (this.destroyed || this.usingFallback) return;
    this.usingFallback = true;

    const poll = async () => {
      if (this.destroyed) return;
      try {
        const job = await builderApi.getGenerationStatus(this.jobId);
        this.synthesizeEventsFromJob(job);

        if (!ACTIVE_GENERATION_STATUSES.includes(job.status)) {
          this.clearTimers();
          if (job.status === "completed") {
            this.emitComplete();
          } else {
            this.emitError(
              new Error(job.error_message ?? "Generation failed"),
            );
          }
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        this.clearTimers();
        this.emitError(e);
      }
    };

    // Immediate first poll, then interval
    poll();
    this.pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  }

  /**
   * Synthesize stream-like events from a polled GenerationJob so that
   * consumers get a consistent stream regardless of transport.
   */
  private synthesizeEventsFromJob(job: GenerationJob): void {
    if (job.status === "processing") {
      this.emitEvent({
        type: "thinking",
        data: "Processing…",
        progress: 50,
      });
    }
    if (job.status === "completed") {
      this.emitEvent({
        type: "complete",
        data: JSON.stringify(job.result ?? {}),
        progress: 100,
      });
    }
    if (job.status === "failed") {
      this.emitEvent({
        type: "error",
        data: job.error_message ?? "Generation failed",
        progress: 0,
      });
    }
  }

  // ── Message parsing ──────────────────────────

  private handleRawMessage(raw: string): void {
    try {
      const event = JSON.parse(raw) as GenerationStreamEvent;
      this.emitEvent(event);

      if (event.type === "complete") {
        this.emitComplete();
      } else if (event.type === "error") {
        this.emitError(new Error(event.data));
      }
    } catch {
      // Treat unparseable messages as raw chunk data
      this.emitEvent({ type: "chunk", data: raw });
    }
  }

  // ── Emission helpers ─────────────────────────

  private emitEvent(event: GenerationStreamEvent): void {
    for (const h of this.eventHandlers) {
      try {
        h(event);
      } catch {
        // swallow handler errors
      }
    }
  }

  private emitComplete(): void {
    for (const h of this.completeHandlers) {
      try {
        h();
      } catch {
        // swallow handler errors
      }
    }
  }

  private emitError(error: Error): void {
    for (const h of this.errorHandlers) {
      try {
        h(error);
      } catch {
        // swallow handler errors
      }
    }
  }

  // ── Timer cleanup ────────────────────────────

  private clearTimers(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

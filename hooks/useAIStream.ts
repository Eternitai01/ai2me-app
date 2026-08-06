"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

/**
 * SSE client for the phase-based AI Builder stream.
 *
 * The server runs three phases in strict sequence (PRD -> Code -> Files) and tags every
 * event with the phase it belongs to. This hook is a reducer over that event vocabulary
 * plus the fetch/reader plumbing, stall detection, and retry.
 */

export type AIPhase = "prd" | "code" | "files";

// ── Canonical PreviewState ────────────────────────────────────────────────────
// Single reducer-backed state for preview rendering.
// Fed from both SSE deploy_status.preview_state and GET /ai/preview/state/{version_id} polling.
// The render tree must branch exclusively on PreviewState.kind — no other preview variables.

export type PreviewState =
  | {
      kind: "building";
      versionId: string | null;
      phase: string | null;
    }
  | {
      kind: "ready";
      versionId: string;
      url: string;
      iframeStatus: "loading" | "loaded" | "failed";
      deliveryStatus: "confirmed" | "degraded";
    }
  | {
      kind: "failed";
      versionId: string | null;
      code: string | null;
      reason: string;
      retryable: boolean;
    };

export const PREVIEW_STATE_INITIAL: PreviewState = {
  kind: "building",
  versionId: null,
  phase: null,
};

export type PreviewAction =
  | { type: "RESET" }
  | { type: "VERSION_CHANGE"; versionId: string }
  | {
      type: "SSE_PAYLOAD";
      payload: {
        state: string;
        version_id?: string | null;
        phase?: string | null;
        preview_url?: string | null;
        failure_code?: string | null;
        failure_reason?: string | null;
        retryable?: boolean | null;
        delivery_status?: string | null;
      };
    }
  | { type: "DISCONNECT" }
  | { type: "POLL_PAYLOAD"; payload: ReturnType<typeof Object.create> }
  | { type: "IFRAME_LOADED" }
  | { type: "IFRAME_ERROR" };

/**
 * Pure reducer — no I/O, fully testable.
 * All preview rendering decisions must derive from this function's output.
 */
export function previewStateReducer(
  state: PreviewState,
  action: PreviewAction
): PreviewState {
  switch (action.type) {
    case "RESET":
      return PREVIEW_STATE_INITIAL;

    case "VERSION_CHANGE": {
      // New version — reset to building immediately so prior URL never bleeds in.
      if (state.kind === "ready" && state.versionId === action.versionId) return state;
      if (state.kind === "building" && state.versionId === action.versionId) return state;
      return { kind: "building", versionId: action.versionId, phase: null };
    }

    case "SSE_PAYLOAD":
    case "POLL_PAYLOAD": {
      const p = action.payload as {
        state?: string;
        version_id?: string | null;
        phase?: string | null;
        preview_url?: string | null;
        failure_code?: string | null;
        failure_reason?: string | null;
        retryable?: boolean | null;
        delivery_status?: string | null;
      };
      const incoming = p.state ?? "building";
      if (incoming === "ready") {
        const prevIframeStatus =
          state.kind === "ready" &&
          state.versionId === (p.version_id ?? null)
            ? state.iframeStatus
            : "loading";
        return {
          kind: "ready",
          versionId: p.version_id ?? "",
          url: p.preview_url ?? "",
          iframeStatus: prevIframeStatus,
          deliveryStatus:
            p.delivery_status === "degraded" ? "degraded" : "confirmed",
        };
      }
      if (incoming === "failed") {
        return {
          kind: "failed",
          versionId: p.version_id ?? null,
          code: p.failure_code ?? null,
          reason:
            p.failure_reason ??
            "The generated website did not pass browser validation.",
          retryable: p.retryable ?? false,
        };
      }
      // "building" — update phase if provided
      return {
        kind: "building",
        versionId: p.version_id ?? (state.kind !== "ready" ? state.versionId : null),
        phase: p.phase ?? (state.kind === "building" ? state.phase : null),
      };
    }

    case "DISCONNECT": {
      // SSE disconnected — preserve session/version IDs, switch to polling.
      // Do NOT set terminal failure; do NOT clear versionId.
      if (state.kind === "ready" || state.kind === "failed") return state;
      return { kind: "building", versionId: state.versionId, phase: state.phase };
    }

    case "IFRAME_LOADED": {
      if (state.kind !== "ready") return state;
      return { ...state, iframeStatus: "loaded" };
    }

    case "IFRAME_ERROR": {
      // Iframe failure always terminates as failed — code = IFRAME_LOAD_FAILED.
      return {
        kind: "failed",
        versionId: state.kind === "ready" ? state.versionId : null,
        code: "IFRAME_LOAD_FAILED",
        reason: "Preview failed to load in the browser.",
        retryable: true,
      };
    }

    default:
      return state;
  }
}

// ── Poll-tick factory (exported for integration testing) ────────────────────
/**
 * Pure factory — no React, no DOM, fully injectable.
 * Returns the tick function to pass to setInterval.
 * stopFn() is called when the state reaches a terminal value (ready | failed).
 * The caller owns the interval handle; stopFn must clear it.
 */
export function _buildPreviewPollTick(
  getVersionId: () => string | null,
  fetchFn: typeof fetch,
  dispatch: (action: PreviewAction) => void,
  stopFn: () => void
): () => void {
  return () => {
    const vid = getVersionId();
    if (!vid) return;
    fetchFn(`/api/ai/preview/state/${vid}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== "object") return;
        const state = (data as Record<string, unknown>).state;
        dispatch({ type: "POLL_PAYLOAD", payload: data as Parameters<typeof previewStateReducer>[1] extends { type: "POLL_PAYLOAD"; payload: infer P } ? P : never });
        if (state === "ready" || state === "failed") {
          stopFn();
        }
      })
      .catch(() => { /* ignore transient poll errors */ });
  };
}

export type DeployStatus = {
  status:
    | "building"
    | "deploying"
    | "writing_files"
    | "installing"
    | "starting_dev"
    | "waiting_for_port"
    | "port_ready"
    | "creating_proxy"
    | "ready"
    | "failed";
  preview_url?: string | null;
  project_id?: string | null;
  session_id?: string | null;
  error?: string | null;
  message?: string | null;
  port?: number | null;
  log?: string | null;
};
export type AIPhaseStatus = "idle" | "loading" | "streaming" | "done" | "error";
export type AIStreamStatus = "idle" | "connecting" | "streaming" | "done" | "error";

export type PhaseState = { status: AIPhaseStatus; content: string; error?: string };
export type PhaseMap = Record<AIPhase, PhaseState>;

export type CodeDeltaFile = { path: string; content: string };

export type AIStreamStep = { phase: AIPhase; message: string };

/**
 * The finished project, delivered on the `done` event.
 * Lets the caller stop polling /chat/projects for project_id/preview_url.
 * Null for reply-only turns, which produce no project.
 */
export type AIStreamProject = {
  project_id: string;
  preview_url?: string | null;
  preview_source?: string | null;
  preview_error?: string | null;
  build_validation_ok?: boolean | null;
  file_count?: number | null;
};

/** No bytes at all for this long and we tell the user it's still alive. `npm install` goes quiet for minutes. */
const STALL_TIMEOUT_MS = 30_000;

const PHASE_NAMES: AIPhase[] = ["prd", "code", "files"];

function isPhase(value: unknown): value is AIPhase {
  return typeof value === "string" && (PHASE_NAMES as string[]).includes(value);
}

function idlePhases(): PhaseMap {
  return {
    prd: { status: "idle", content: "" },
    code: { status: "idle", content: "" },
    files: { status: "idle", content: "" },
  };
}

export type StartOptions = {
  /** Keep phases that already finished; only re-run what failed. Used by retry(). */
  preserveCompleted?: boolean;
};

export function useAIStream() {
  const [phases, setPhases] = useState<PhaseMap>(idlePhases);
  const [steps, setSteps] = useState<AIStreamStep[]>([]);
  const [codeDeltaFiles, setCodeDeltaFiles] = useState<CodeDeltaFile[]>([]);
  const [status, setStatus] = useState<AIStreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [delayed, setDelayed] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [queryId, setQueryId] = useState<string | null>(null);
  const [project, setProject] = useState<AIStreamProject | null>(null);
  const [deployStatus, setDeployStatus] = useState<DeployStatus | null>(null);
  const [previewState, dispatchPreview] = useReducer(
    previewStateReducer,
    PREVIEW_STATE_INITIAL
  );

  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<{ url: string; payload: unknown } | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Polling timer for SSE-disconnect fallback. */
  const previewPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Version ID to poll when SSE disconnects mid-build. */
  const previewPollVersionRef = useRef<string | null>(null);

  /** Any bytes at all — including heartbeat comments — mean the stream is alive. */
  const touch = useCallback(() => {
    setDelayed(false);
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => setDelayed(true), STALL_TIMEOUT_MS);
  }, []);

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    setDelayed(false);
  }, []);

  /** Retry keeps finished phases and only re-runs the ones that failed or never ran. */
  const resetForRetry = useCallback(() => {
    setPhases((prev) => {
      const next = { ...prev };
      for (const name of PHASE_NAMES) {
        if (next[name].status !== "done") {
          next[name] = { status: "idle", content: "" };
        }
      }
      return next;
    });
    setError(null);
    setDelayed(false);
  }, []);

  /** Full teardown. Every line here exists because something leaked between projects. */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearStallTimer();
    if (previewPollRef.current) {
      clearInterval(previewPollRef.current);
      previewPollRef.current = null;
    }
    previewPollVersionRef.current = null;
    setPhases(idlePhases());
    setSteps([]);
    setCodeDeltaFiles([]);
    setStatus("idle");
    setError(null);
    setConversationId(null);
    setQueryId(null);
    setProject(null);
    setDeployStatus(null);
    dispatchPreview({ type: "RESET" });
    lastRequestRef.current = null;
  }, [clearStallTimer]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearStallTimer();
    setStatus((prev) => (prev === "streaming" || prev === "connecting" ? "done" : prev));
  }, [clearStallTimer]);

  /**
   * Pure reducer over the event vocabulary. Kept free of I/O so it can be unit-tested
   * with synthetic events.
   */
  const applyEvent = useCallback((eventName: string, payload: Record<string, unknown>) => {
    if (eventName === "connected") {
      if (typeof payload.conversationId === "string") setConversationId(payload.conversationId);
      if (typeof payload.queryId === "string") setQueryId(payload.queryId);
      setStatus("streaming");
      return;
    }

    if (eventName === "code_delta") {
      const path = typeof payload.path === "string" ? payload.path : undefined;
      const content = typeof payload.content === "string" ? payload.content : undefined;
      if (path && content !== undefined) {
        // Upsert by path — a file may be re-emitted after the build-repair loop rewrites it.
        setCodeDeltaFiles((prev) => {
          const idx = prev.findIndex((f) => f.path === path);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { path, content };
            return next;
          }
          return [...prev, { path, content }];
        });
      }
      return;
    }

    if (eventName === "phase_start") {
      const phase = payload.phase;
      if (isPhase(phase)) {
        setPhases((prev) => ({ ...prev, [phase]: { ...prev[phase], status: "loading", error: undefined } }));
        setStatus("streaming");
      }
      return;
    }

    if (eventName === "chunk") {
      const phase = payload.phase;
      const content = typeof payload.content === "string" ? payload.content : "";
      if (isPhase(phase) && content) {
        setPhases((prev) => ({
          ...prev,
          [phase]: { ...prev[phase], status: "streaming", content: prev[phase].content + content },
        }));
      }
      return;
    }

    if (eventName === "phase_step") {
      const phase = payload.phase;
      const message = typeof payload.message === "string" ? payload.message : "";
      if (isPhase(phase) && message) {
        setSteps((prev) => [...prev, { phase, message }]);
      }
      return;
    }

    if (eventName === "phase_done") {
      const phase = payload.phase;
      if (isPhase(phase)) {
        setPhases((prev) => ({ ...prev, [phase]: { ...prev[phase], status: "done" } }));
      }
      return;
    }

    if (eventName === "phase_error") {
      const phase = payload.phase;
      const message = typeof payload.message === "string" ? payload.message : "Phase failed";
      if (isPhase(phase)) {
        // A phase failing is not fatal — the stream continues so a code failure still
        // leaves the user with a readable PRD.
        setPhases((prev) => ({ ...prev, [phase]: { ...prev[phase], status: "error", error: message } }));
      }
      return;
    }

    if (eventName === "done") {
      if (typeof payload.conversationId === "string") setConversationId(payload.conversationId);
      // The server now hands us the finished project, so the caller doesn't have to
      // poll /chat/projects to find out project_id / preview_url.
      const proj = payload.project;
      if (proj && typeof proj === "object" && typeof (proj as AIStreamProject).project_id === "string") {
        setProject(proj as AIStreamProject);
      }
      setStatus("done");
      return;
    }

    if (eventName === "deploy_status") {
      const ds = payload as unknown as DeployStatus;
      setDeployStatus(ds);
      if (ds.status === "ready" && ds.preview_url) {
        setProject((prev) =>
          prev ? { ...prev, preview_url: ds.preview_url } : prev
        );
      }
      // Feed the canonical PreviewState reducer from the normalized preview_state field.
      // If the server has wired Commit 2, payload.preview_state is the canonical payload.
      // Legacy events without preview_state are silently ignored by the reducer.
      const ps = (payload as Record<string, unknown>).preview_state;
      if (ps && typeof ps === "object") {
        dispatchPreview({ type: "SSE_PAYLOAD", payload: ps as Parameters<typeof previewStateReducer>[1] extends { type: "SSE_PAYLOAD"; payload: infer P } ? P : never });
        // If the version_id just arrived and we have a poll timer running, stop it.
        const psTyped = ps as Record<string, unknown>;
        if (psTyped.state === "ready" || psTyped.state === "failed") {
          if (previewPollRef.current) {
            clearInterval(previewPollRef.current);
            previewPollRef.current = null;
          }
        }
      }
      return;
    }

    if (eventName === "stream_error") {
      const message = typeof payload.message === "string" ? payload.message : "Stream failed";
      const available = payload.available_credits;
      setError(
        typeof available === "number" ? `${message} (available credits: ${available})` : message
      );
      setStatus("error");
      return;
    }
  }, []);

  /**
   * Split the SSE buffer on blank lines and apply each complete frame.
   * Returns the unconsumed remainder to carry into the next read.
   */
  const parseAndApply = useCallback(
    (buffer: string): string => {
      const frames = buffer.split(/\r?\n\r?\n/);
      // The last element is either an incomplete frame or "" — keep it for next time.
      const remainder = frames.pop() ?? "";

      for (const frame of frames) {
        const trimmed = frame.trim();
        if (!trimmed || trimmed.startsWith(":")) continue; // heartbeat comment

        let eventName = "message";
        const dataLines: string[] = [];
        for (const line of trimmed.split(/\r?\n/)) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }
        if (!dataLines.length) continue;

        try {
          const payload = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
          applyEvent(eventName, payload);
        } catch {
          // A malformed frame shouldn't kill the stream.
          console.warn("[useAIStream] skipping unparseable frame", trimmed.slice(0, 120));
        }
      }
      return remainder;
    },
    [applyEvent]
  );

  const start = useCallback(
    async (url: string, payload: unknown, options: StartOptions = {}) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      lastRequestRef.current = { url, payload };

      if (options.preserveCompleted) {
        resetForRetry();
      } else {
        setPhases(idlePhases());
        setSteps([]);
        setCodeDeltaFiles([]);
        setError(null);
      }
      setStatus("connecting");
      touch();

      // Inner fn so we can retry once on transient 502/503 without re-running setup.
      const attempt = async (): Promise<"ok" | "transient" | "fatal"> => {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          // Transient upstream error (AI task restarting) — caller will retry once.
          if (response.status === 502 || response.status === 503) return "transient";

          if (!response.ok || !response.body) {
            let detail = `Request failed (${response.status})`;
            try {
              const data = await response.json();
              detail = data?.detail || data?.message || detail;
            } catch {
              /* non-JSON error body */
            }
            setError(detail);
            setStatus("error");
            clearStallTimer();
            return "fatal";
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            touch();
            buffer += decoder.decode(value, { stream: true });
            buffer = parseAndApply(buffer);
          }

          // SSE stream ended cleanly (reader EOF, not AbortError).
          // If the preview is not yet terminal, start polling so the client
          // does not get stuck — SSE disconnects are common on ALB 60s idle timeout.
          clearStallTimer();
          setStatus((prev) => (prev === "error" ? prev : "done"));
          // Dispatch DISCONNECT to preserve session/version IDs and switch to polling.
          // previewStateReducer ignores this when state is already ready or failed.
          dispatchPreview({ type: "DISCONNECT" });
          // Start fallback poll every 4 s — using a captured versionId if available.
          if (previewPollRef.current) clearInterval(previewPollRef.current);
          previewPollRef.current = setInterval(
            _buildPreviewPollTick(
              () => previewPollVersionRef.current,
              fetch,
              dispatchPreview,
              () => {
                if (previewPollRef.current) {
                  clearInterval(previewPollRef.current);
                  previewPollRef.current = null;
                }
              }
            ),
            4000
          );
          return "ok";
        } catch (err) {
          clearStallTimer();
          if ((err as Error).name === "AbortError") return "fatal"; // intentional stop
          setError((err as Error).message || "Stream failed");
          setStatus("error");
          return "fatal";
        }
      };

      const result = await attempt();
      if (result === "transient") {
        // Wait 3 s and retry once — covers brief 0-task window during rolling deploys.
        await new Promise((r) => setTimeout(r, 3000));
        if (abortRef.current !== controller) return; // aborted during wait
        const retry2 = await attempt();
        if (retry2 === "transient") {
          setError("AI service is restarting — please retry in a few seconds.");
          setStatus("error");
          clearStallTimer();
        }
      }
    },
    [clearStallTimer, parseAndApply, resetForRetry, touch]
  );

  /** Replay the last request, keeping phases that already succeeded. */
  const retry = useCallback(() => {
    const last = lastRequestRef.current;
    if (!last) return;
    void start(last.url, last.payload, { preserveCompleted: true });
  }, [start]);

  // Don't leave a timer or an open reader behind on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      if (previewPollRef.current) {
        clearInterval(previewPollRef.current);
        previewPollRef.current = null;
      }
    };
  }, []);

  const hasActivePhase = PHASE_NAMES.some(
    (name) => phases[name].status === "loading" || phases[name].status === "streaming"
  );

  return {
    phases,
    steps,
    codeDeltaFiles,
    status,
    error,
    delayed,
    conversationId,
    queryId,
    project,
    deployStatus,
    /** Canonical reducer-backed PreviewState. Feed the render tree exclusively from this. */
    previewState,
    /** Dispatch preview actions from the consumer (IFRAME_LOADED, IFRAME_ERROR, VERSION_CHANGE, RESET). */
    dispatchPreview,
    /** Expose poll version ref so the consumer can set the version_id to poll on SSE disconnect. */
    previewPollVersionRef,
    hasActivePhase,
    start,
    stop,
    retry,
    reset,
  };
}

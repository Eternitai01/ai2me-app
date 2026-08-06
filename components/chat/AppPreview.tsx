"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, ExternalLink, Loader2 } from "lucide-react";

// All previews use the /api/ai/preview/ esbuild iframe path.
// srcdoc path removed in Phase 3 — everything goes through the unified esbuild pipeline.

interface AppPreviewProps {
  url?: string;
  sessionId?: string;
  projectId?: string;
  authToken?: string;
  /** Bump after codegen/deploy so the iframe refetches without a manual refresh. */
  revision?: number;
  /**
   * Version identity token. When this changes the component resets all loaded state
   * immediately — prevents a previous-version URL from appearing as valid for a new version.
   */
  versionId?: string | null;
  /**
   * Called once when the iframe fires onLoad without error. Does NOT fire for the
   * esbuild-blob path until the blob itself is served successfully.
   * No cross-origin DOM inspection; relies only on the native iframe onLoad event.
   */
  onLoadSuccess?: () => void;
  /**
   * Called when all fetch retries are exhausted or the iframe fires onError.
   * Receives a human-readable reason string.
   */
  onLoadFailure?: (reason: string) => void;
}

/** Backoff between preview fetch retries (production file settle / esbuild latency). */
const PREVIEW_RETRY_DELAYS_MS = [800, 1500, 3000, 5000];

function isRealUrl(url?: string): boolean {
  return (
    Boolean(url) &&
    !url!.includes("localhost") &&
    !url!.includes("127.0.0.1") &&
    url!.startsWith("https://")
  );
}

function withCacheBust(url: string, revision: number): string {
  if (!revision) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${revision}`;
}

/** Vite/dev skeleton or empty shell — not a usable iframe preview. */
function isUnusablePreviewHtml(html: string): boolean {
  const body = html.trim();
  if (body.length < 200) return true;
  if (body.startsWith("{") && body.includes("detail")) return true;
  const hasBundle = body.includes("__AppBundle");
  const viteEntry =
    body.includes('src="/src/main.') ||
    body.includes("src='/src/main.") ||
    body.includes('src="/src/index.') ||
    body.includes("src='/src/index.");
  if (viteEntry && !hasBundle) return true;
  // DOCTYPE + module /src without a real bundle → blank iframe
  if (
    body.includes("<!DOCTYPE") &&
    body.includes('type="module"') &&
    body.includes("/src/") &&
    !hasBundle &&
    !body.includes("text/babel")
  ) {
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function AppPreview({
  url,
  sessionId,
  projectId,
  revision = 0,
  versionId,
  onLoadSuccess,
  onLoadFailure,
}: AppPreviewProps) {
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Stable refs so the async effect can call the latest callbacks without re-running.
  const onLoadSuccessRef = useRef(onLoadSuccess);
  const onLoadFailureRef = useRef(onLoadFailure);
  useEffect(() => { onLoadSuccessRef.current = onLoadSuccess; }, [onLoadSuccess]);
  useEffect(() => { onLoadFailureRef.current = onLoadFailure; }, [onLoadFailure]);

  // Prefer sessionId for the on-demand esbuild route — the preview handler resolves
  // project_id from the session. Passing projectId alone skips that mapping and
  // often hits the AI /preview Vite skeleton path.
  const previewId = sessionId || projectId;

  // When versionId changes, reset all state immediately so stale src is never displayed.
  const prevVersionRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (prevVersionRef.current === undefined) {
      prevVersionRef.current = versionId ?? null;
      return;
    }
    if (versionId !== prevVersionRef.current) {
      prevVersionRef.current = versionId ?? null;
      // Hard reset — clears previewSrc so the iframe is unmounted before the new load runs.
      setPreviewSrc(null);
      setLoadError(null);
      setIsLoading(true);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setKey((k) => k + 1);
    }
  }, [versionId]);

  // When the preferred id first arrives, bump key so iframe reloads.
  const prevIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (previewId && !prevIdRef.current) {
      setKey((k) => k + 1);
    }
    prevIdRef.current = previewId;
  }, [previewId]);

  useEffect(() => {
    const signal = { cancelled: false };

    const revokeBlob = () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };

    const run = async () => {
      revokeBlob();
      setLoadError(null);
      setIsLoading(true);
      setPreviewSrc(null);

      if (isRealUrl(url)) {
        // Real HTTPS URL — set src and let the iframe's onLoad/onError report success/failure.
        // No HEAD request (cross-origin restriction), no DOM inspection.
        // onLoadSuccess fires from the iframe onLoad handler below.
        if (!signal.cancelled) {
          setPreviewSrc(withCacheBust(url!, revision));
        }
        return;
      }

      if (!previewId) {
        if (!signal.cancelled) {
          setPreviewSrc(null);
          setIsLoading(false);
        }
        return;
      }

      const apiPath = `/api/ai/preview/${previewId}`;
      const maxAttempts = 1 + PREVIEW_RETRY_DELAYS_MS.length;
      let lastDetail = "Preview not available yet";

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (signal.cancelled) return;

        if (attempt > 0) {
          await sleep(PREVIEW_RETRY_DELAYS_MS[attempt - 1]);
          if (signal.cancelled) return;
        }

        try {
          const res = await fetch(apiPath, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "text/html,*/*" },
            cache: "no-store",
          });
          if (signal.cancelled) return;

          const ctype = res.headers.get("content-type") || "";
          if (!res.ok || ctype.includes("application/json")) {
            try {
              const body = await res.json();
              if (body?.detail) lastDetail = String(body.detail);
            } catch {
              /* ignore */
            }
            continue; // retry
          }

          const html = await res.text();
          if (signal.cancelled) return;

          if (isUnusablePreviewHtml(html)) {
            lastDetail = "Preview not available yet";
            continue; // retry
          }

          const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
          blobUrlRef.current = blobUrl;
          setPreviewSrc(blobUrl);
          // Blob path — onLoad will fire from the iframe and call onLoadSuccess there.
          return;
        } catch {
          lastDetail = "Could not build preview from the generated files.";
          // retry
        }
      }

      if (signal.cancelled) return;
      setPreviewSrc(null);
      setLoadError(lastDetail);
      setIsLoading(false);
      onLoadFailureRef.current?.(lastDetail);
    };

    void run();
    return () => {
      signal.cancelled = true;
      revokeBlob();
    };
  }, [url, previewId, key, revision]);

  const handleRefresh = () => {
    setIsLoading(true);
    setLoadError(null);
    setKey((k) => k + 1);
    setPreviewSrc(null);
  };

  // ── Empty / error state ───────────────────────────────────────────────────
  if (!previewSrc) {
    const showSpinner = Boolean(previewId) && !loadError && isLoading;
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--chat-bg-secondary)] gap-4 p-8 text-center">
        {showSpinner ? (
          <Loader2 className="w-8 h-8 text-[var(--chat-accent)] animate-spin" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-[var(--chat-accent)]/10 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-[var(--chat-accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3M5.25 20.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
        )}
        <p className="text-sm font-semibold text-[var(--chat-text-primary)]">
          {loadError
            ? "Preview unavailable"
            : showSpinner
            ? "Loading preview…"
            : "Web Preview"}
        </p>
        <p className="text-xs text-[var(--chat-text-secondary)] mt-1 max-w-sm">
          {loadError
            ? "Code may already be ready — open the Files tab, or refresh after deploy finishes."
            : showSpinner
            ? "Building your site from the generated files."
            : "Switch to the Files tab to explore the code."}
        </p>
        {loadError && previewId && (
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-1 text-xs font-medium text-[var(--chat-accent)] hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // ── Preview iframe ────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-[var(--chat-bg-secondary)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--chat-border)] bg-[var(--chat-bg-primary)]">
        <button
          onClick={() => {
            if (previewSrc) window.open(previewSrc, "_blank", "noopener,noreferrer");
          }}
          className="p-1.5 hover:bg-[var(--chat-bg-tertiary)] rounded-md transition-colors text-[var(--chat-text-secondary)]"
          title="Open in new tab"
        >
          <ExternalLink size={14} />
        </button>
        <button
          onClick={handleRefresh}
          className="p-1.5 hover:bg-[var(--chat-bg-tertiary)] rounded-md transition-colors text-[var(--chat-text-secondary)]"
          title="Refresh"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--chat-bg-secondary)] z-10">
            <Loader2 size={32} className="animate-spin text-[var(--chat-accent)]" />
          </div>
        )}
        <iframe
          key={key}
          src={previewSrc}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-forms allow-same-origin"
          onLoad={() => {
            setIsLoading(false);
            setLoadError(null);
            onLoadSuccessRef.current?.();
          }}
          onError={() => {
            setIsLoading(false);
            const reason = "Preview failed to load.";
            setLoadError(reason);
            setPreviewSrc(null);
            onLoadFailureRef.current?.(reason);
          }}
        />
      </div>
    </div>
  );
}

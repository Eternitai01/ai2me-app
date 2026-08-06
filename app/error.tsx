"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (error?.name === "ChunkLoadError" || error?.message?.includes("Loading chunk")) {
      window.location.reload();
    }
  }, [error]);

  const isChunkError = error?.name === "ChunkLoadError" || error?.message?.includes("Loading chunk");

  return (
    <div style={{ margin: 0, background: "#0a0a0f", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
        {isChunkError ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔄</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Refreshing…</h2>
            <p style={{ color: "#888", fontSize: 14 }}>A new version of AI2me was deployed. Reloading automatically.</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>{error?.message || "An unexpected error occurred."}</p>
            <button
              onClick={reset}
              style={{ padding: "10px 24px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

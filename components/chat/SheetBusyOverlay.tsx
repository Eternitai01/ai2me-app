"use client";

/** Genspark-style floating busy card for the sheet preview grid. */
export function SheetBusyOverlay() {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto"
      role="status"
      aria-live="polite"
      aria-label="Working on your sheet"
    >
      <div className="flex items-center gap-3 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] px-4 py-3 shadow-lg">
        <span className="flex gap-1" aria-hidden>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500 [animation-delay:300ms]" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--chat-text-primary)]">
            Working on your sheet...
          </p>
          <p className="mt-0.5 text-xs text-[var(--chat-text-muted)]">
            Keep this page open
          </p>
        </div>
      </div>
    </div>
  );
}

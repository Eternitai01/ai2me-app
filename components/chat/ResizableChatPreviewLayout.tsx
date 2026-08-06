"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePanelDrag } from "@/hooks/usePanelDrag";
import { usePanelLayout } from "@/hooks/usePanelLayout";
import type { PanelLayoutLimits } from "@/lib/panel-layout";

export type ResizableChatPreviewLayoutProps = {
  storageKey: string;
  chatHeader: ReactNode;
  chat: ReactNode;
  composer: ReactNode;
  preview: ReactNode;
  enabled?: boolean;
  limits?: Partial<PanelLayoutLimits>;
  className?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export function ResizableChatPreviewLayout({
  storageKey,
  chatHeader,
  chat,
  composer,
  preview,
  enabled = true,
  limits,
  className = "",
  onDragStart,
  onDragEnd,
}: ResizableChatPreviewLayoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  const {
    chatWidthRatio,
    setContainerMetrics,
    applyDragDelta,
    persistNow,
    getStartSnapshot,
  } = usePanelLayout({ storageKey, limits, enabled });

  const handleDragEnd = useCallback(() => {
    persistNow();
    onDragEnd?.();
  }, [persistNow, onDragEnd]);

  const { bindHandle, isDragging } = usePanelDrag({
    enabled,
    getStartSnapshot,
    onDelta: applyDragDelta,
    onDragStart,
    onDragEnd: handleDragEnd,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    const measure = () => {
      setContainerMetrics({
        workspaceWidth: root.getBoundingClientRect().width,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [enabled, setContainerMetrics]);

  const style = {
    "--chat-width-ratio": String(chatWidthRatio),
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`relative flex flex-1 min-h-0 min-w-0 overflow-hidden ${className}`}
      style={style}
      data-panel-dragging={isDragging ? "true" : "false"}
    >
      <div
        ref={leftRef}
        className="relative flex flex-col min-h-0 min-w-0 border-r border-[var(--chat-border)] bg-[var(--chat-bg-primary)]"
        style={{
          width: `calc(var(--chat-width-ratio) * 100%)`,
          flexShrink: 0,
        }}
      >
        <div className="shrink-0">{chatHeader}</div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {chat}
        </div>

        <div className="shrink-0 sticky bottom-0 p-4 border-t border-[var(--chat-border)] bg-[var(--chat-bg-primary)] z-10">
          {composer}
        </div>
      </div>

      <div
        className="relative z-30 w-1.5 -ml-0.5 flex-shrink-0 cursor-col-resize group touch-none select-none"
        {...bindHandle("vertical")}
        aria-label="Resize chat panel"
        role="separator"
        aria-orientation="vertical"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover:bg-[var(--chat-accent)] group-hover:w-0.5 transition-colors" />
      </div>

      <div
        className={`flex-1 min-w-0 min-h-0 flex flex-col bg-[var(--chat-bg-primary)] ${
          isDragging ? "pointer-events-none" : ""
        }`}
      >
        {preview}
      </div>
    </div>
  );
}

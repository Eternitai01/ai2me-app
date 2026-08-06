"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { PanelDragMode, PanelLayoutValues } from "@/lib/panel-layout";

export type PanelDragStartSnapshot = {
  values: PanelLayoutValues;
  startChatWidthPx: number;
};

export type UsePanelDragOptions = {
  enabled?: boolean;
  getStartSnapshot: () => PanelDragStartSnapshot;
  onDelta: (args: {
    mode: PanelDragMode;
    deltaX: number;
    deltaY: number;
    startValues: PanelLayoutValues;
    startChatWidthPx: number;
  }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

function clearDragChrome() {
  if (typeof document === "undefined") return;
  document.body.style.removeProperty("cursor");
  document.body.style.removeProperty("user-select");
}

function setDragChrome(cursor: string) {
  if (typeof document === "undefined") return;
  document.body.style.cursor = cursor;
  document.body.style.userSelect = "none";
}

function cursorForMode(_mode: PanelDragMode): string {
  return "col-resize";
}

export function usePanelDrag(options: UsePanelDragOptions) {
  const {
    enabled = true,
    getStartSnapshot,
    onDelta,
    onDragStart,
    onDragEnd,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    mode: PanelDragMode;
    pointerId: number;
    originX: number;
    originY: number;
    startValues: PanelLayoutValues;
    startChatWidthPx: number;
    target: HTMLElement;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ deltaX: number; deltaY: number } | null>(null);

  const endDrag = useCallback(() => {
    const active = dragRef.current;
    if (!active) return;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingRef.current = null;

    try {
      if (active.target.hasPointerCapture?.(active.pointerId)) {
        active.target.releasePointerCapture(active.pointerId);
      }
    } catch {
      /* ignore */
    }

    dragRef.current = null;
    setIsDragging(false);
    clearDragChrome();
    onDragEnd?.();
  }, [onDragEnd]);

  const flushDelta = useCallback(() => {
    rafRef.current = null;
    const active = dragRef.current;
    const pending = pendingRef.current;
    if (!active || !pending) return;
    pendingRef.current = null;
    onDelta({
      mode: active.mode,
      deltaX: pending.deltaX,
      deltaY: pending.deltaY,
      startValues: active.startValues,
      startChatWidthPx: active.startChatWidthPx,
    });
  }, [onDelta]);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const active = dragRef.current;
      if (!active || e.pointerId !== active.pointerId) return;
      pendingRef.current = {
        deltaX: e.clientX - active.originX,
        deltaY: e.clientY - active.originY,
      };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flushDelta);
      }
    },
    [flushDelta]
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const active = dragRef.current;
      if (!active || e.pointerId !== active.pointerId) return;
      if (pendingRef.current) flushDelta();
      endDrag();
    },
    [endDrag, flushDelta]
  );

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    const onLostCapture = (e: Event) => {
      const active = dragRef.current;
      if (!active) return;
      if ((e as PointerEvent).pointerId === active.pointerId) endDrag();
    };
    const target = dragRef.current?.target;
    target?.addEventListener("lostpointercapture", onLostCapture);
    const onBlur = () => endDrag();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") endDrag();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      target?.removeEventListener("lostpointercapture", onLostCapture);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isDragging, onPointerMove, onPointerUp, endDrag]);

  useEffect(() => {
    if (!enabled && dragRef.current) {
      endDrag();
    }
  }, [enabled, endDrag]);

  useEffect(() => {
    return () => {
      if (dragRef.current) endDrag();
      else clearDragChrome();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  const bindHandle = useCallback(
    (mode: PanelDragMode) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        if (!enabled) return;
        if (e.button !== 0) return;
        if (dragRef.current) return;

        e.preventDefault();
        const snapshot = getStartSnapshot();
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);

        dragRef.current = {
          mode,
          pointerId: e.pointerId,
          originX: e.clientX,
          originY: e.clientY,
          startValues: snapshot.values,
          startChatWidthPx: snapshot.startChatWidthPx,
          target,
        };
        setIsDragging(true);
        setDragChrome(cursorForMode(mode));
        onDragStart?.();
      },
    }),
    [enabled, getStartSnapshot, onDragStart]
  );

  return { bindHandle, isDragging, endDrag };
}

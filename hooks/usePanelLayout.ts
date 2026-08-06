"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_CHAT_WIDTH_RATIO,
  clampLayout,
  mergeLimits,
  nextLayoutFromDrag,
  parseStoredLayout,
  serializeStoredLayout,
  type ContainerMetrics,
  type PanelDragMode,
  type PanelLayoutLimits,
  type PanelLayoutValues,
} from "@/lib/panel-layout";

const EMPTY_METRICS: ContainerMetrics = {
  workspaceWidth: 0,
};

export type UsePanelLayoutOptions = {
  storageKey: string;
  defaults?: PanelLayoutValues;
  limits?: Partial<PanelLayoutLimits>;
  enabled?: boolean;
};

export function usePanelLayout(options: UsePanelLayoutOptions) {
  const {
    storageKey,
    defaults = { chatWidthRatio: DEFAULT_CHAT_WIDTH_RATIO },
    limits: limitsPartial,
    enabled = true,
  } = options;

  const limitsRef = useRef(mergeLimits(limitsPartial));
  limitsRef.current = mergeLimits(limitsPartial);
  const metricsRef = useRef<ContainerMetrics>(EMPTY_METRICS);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [values, setValues] = useState<PanelLayoutValues>(defaults);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const persistNow = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    try {
      window.localStorage.setItem(
        storageKey,
        serializeStoredLayout(valuesRef.current)
      );
    } catch {
      /* private mode / quota */
    }
  }, [enabled, storageKey]);

  const schedulePersist = useCallback(() => {
    if (!enabled) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      persistNow();
    }, 250);
  }, [enabled, persistNow]);

  const setClamped = useCallback(
    (
      next: PanelLayoutValues,
      { persist }: { persist?: "now" | "debounce" | false } = {}
    ) => {
      const m = metricsRef.current;
      const clamped =
        m.workspaceWidth > 0
          ? clampLayout(next, m, limitsRef.current)
          : next;
      setValues(clamped);
      valuesRef.current = clamped;
      if (persist === "now") {
        if (persistTimerRef.current) {
          clearTimeout(persistTimerRef.current);
          persistTimerRef.current = null;
        }
        if (enabled && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              storageKey,
              serializeStoredLayout(clamped)
            );
          } catch {
            /* ignore */
          }
        }
      } else if (persist === "debounce") {
        schedulePersist();
      }
    },
    [enabled, schedulePersist, storageKey]
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const parsed = parseStoredLayout(window.localStorage.getItem(storageKey));
    if (parsed) {
      const m = metricsRef.current;
      const next =
        m.workspaceWidth > 0
          ? clampLayout(parsed, m, limitsRef.current)
          : parsed;
      setValues(next);
      valuesRef.current = next;
    }
  }, [enabled, storageKey]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  const setContainerMetrics = useCallback(
    (metrics: ContainerMetrics) => {
      metricsRef.current = metrics;
      if (metrics.workspaceWidth <= 0) return;
      setClamped(valuesRef.current, { persist: "debounce" });
    },
    [setClamped]
  );

  const applyDragDelta = useCallback(
    (args: {
      mode: PanelDragMode;
      deltaX: number;
      deltaY: number;
      startValues: PanelLayoutValues;
      startChatWidthPx: number;
    }) => {
      const m = metricsRef.current;
      if (m.workspaceWidth <= 0) return;
      const next = nextLayoutFromDrag({
        ...args,
        metrics: m,
        limits: limitsRef.current,
      });
      setValues(next);
      valuesRef.current = next;
    },
    []
  );

  const resetLayout = useCallback(() => {
    setClamped(defaults, { persist: "now" });
  }, [defaults, setClamped]);

  const getStartSnapshot = useCallback(() => {
    const m = metricsRef.current;
    const v = valuesRef.current;
    return {
      values: { ...v },
      startChatWidthPx:
        m.workspaceWidth > 0 ? v.chatWidthRatio * m.workspaceWidth : 0,
    };
  }, []);

  return {
    chatWidthRatio: values.chatWidthRatio,
    setContainerMetrics,
    applyDragDelta,
    persistNow,
    resetLayout,
    getStartSnapshot,
  };
}

export const PANEL_LAYOUT_STORAGE_VERSION = 1 as const;
export const AI_SHEETS_PANEL_LAYOUT_KEY = "ai2me:ai-sheets:panel-layout:v1";
export const AI_DOCS_PANEL_LAYOUT_KEY = "ai2me:ai-docs:panel-layout:v1";
export const AI_SLIDES_PANEL_LAYOUT_KEY = "ai2me:ai-slides:panel-layout:v1";

export const DEFAULT_CHAT_WIDTH_RATIO = 0.38;

export const DEFAULT_LIMITS = {
  chatMinPx: 300,
  previewMinPx: 400,
} as const;

export type PanelDragMode = "vertical";

export type PanelLayoutValues = {
  chatWidthRatio: number;
};

export type PanelLayoutLimits = {
  chatMinPx: number;
  previewMinPx: number;
};

export type ContainerMetrics = {
  workspaceWidth: number;
};

export function mergeLimits(
  partial?: Partial<PanelLayoutLimits>
): PanelLayoutLimits {
  return { ...DEFAULT_LIMITS, ...partial };
}

export function clampChatWidthRatio(
  ratio: number,
  workspaceWidth: number,
  limits: PanelLayoutLimits
): number {
  if (!Number.isFinite(ratio)) ratio = DEFAULT_CHAT_WIDTH_RATIO;
  if (!Number.isFinite(workspaceWidth) || workspaceWidth <= 0) {
    return Math.min(1, Math.max(0, ratio));
  }

  const minRatio = limits.chatMinPx / workspaceWidth;
  const maxRatio = 1 - limits.previewMinPx / workspaceWidth;

  if (minRatio > maxRatio) {
    const mid = limits.chatMinPx / (limits.chatMinPx + limits.previewMinPx);
    return Math.min(1, Math.max(0, mid));
  }

  return Math.min(maxRatio, Math.max(minRatio, ratio));
}

export function clampLayout(
  values: PanelLayoutValues,
  metrics: ContainerMetrics,
  limits: PanelLayoutLimits
): PanelLayoutValues {
  return {
    chatWidthRatio: clampChatWidthRatio(
      values.chatWidthRatio,
      metrics.workspaceWidth,
      limits
    ),
  };
}

/** Origin-based; startValues are values at pointerdown. */
export function nextLayoutFromDrag(args: {
  mode: PanelDragMode;
  deltaX: number;
  deltaY: number;
  startValues: PanelLayoutValues;
  startChatWidthPx: number;
  metrics: ContainerMetrics;
  limits: PanelLayoutLimits;
}): PanelLayoutValues {
  const { deltaX, startValues, startChatWidthPx, metrics, limits } = args;
  const w = metrics.workspaceWidth;
  const chatWidthRatio =
    w > 0 ? (startChatWidthPx + deltaX) / w : startValues.chatWidthRatio;
  return clampLayout({ chatWidthRatio }, metrics, limits);
}

export function parseStoredLayout(raw: string | null): PanelLayoutValues | null {
  if (raw == null || raw === "") return null;
  try {
    const data = JSON.parse(raw) as {
      v?: unknown;
      chatWidthRatio?: unknown;
    };
    if (data.v !== PANEL_LAYOUT_STORAGE_VERSION) return null;
    const chatWidthRatio = data.chatWidthRatio;
    if (typeof chatWidthRatio !== "number" || !Number.isFinite(chatWidthRatio)) {
      return null;
    }
    return { chatWidthRatio };
  } catch {
    return null;
  }
}

export function serializeStoredLayout(values: PanelLayoutValues): string {
  return JSON.stringify({
    v: PANEL_LAYOUT_STORAGE_VERSION,
    chatWidthRatio: values.chatWidthRatio,
  });
}

/** Dev-only; no-op in production builds. */
export function warnPanelLayoutDev(message: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[panel-layout] ${message}`);
  }
}

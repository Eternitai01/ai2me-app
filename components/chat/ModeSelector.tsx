"use client";

import { Zap, FlaskConical, Code2, Pencil, Settings2 } from "lucide-react";

export type ChatMode = "express" | "research" | "code" | "create" | "custom";

interface ModeConfig {
  id: ChatMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  preferences: {
    preferredProvider: string;
    costSensitivity: string;
    qualityPriority: string;
  };
}

export const CHAT_MODES: ModeConfig[] = [
  {
    id: "express",
    label: "Express",
    icon: <Zap className="w-4 h-4" />,
    description: "Fast, cost-effective responses",
    preferences: {
      preferredProvider: "auto",
      costSensitivity: "high",
      qualityPriority: "balanced",
    },
  },
  {
    id: "research",
    label: "Research",
    icon: <FlaskConical className="w-4 h-4" />,
    description: "Deep, accurate analysis",
    preferences: {
      preferredProvider: "anthropic",
      costSensitivity: "low",
      qualityPriority: "quality",
    },
  },
  {
    id: "code",
    label: "Code",
    icon: <Code2 className="w-4 h-4" />,
    description: "Programming assistance",
    preferences: {
      preferredProvider: "openai",
      costSensitivity: "medium",
      qualityPriority: "quality",
    },
  },
  {
    id: "create",
    label: "Create",
    icon: <Pencil className="w-4 h-4" />,
    description: "Creative writing",
    preferences: {
      preferredProvider: "anthropic",
      costSensitivity: "medium",
      qualityPriority: "balanced",
    },
  },
  {
    id: "custom",
    label: "Custom",
    icon: <Settings2 className="w-4 h-4" />,
    description: "Manual settings",
    preferences: {
      preferredProvider: "auto",
      costSensitivity: "medium",
      qualityPriority: "balanced",
    },
  },
];

interface ModeSelectorProps {
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  compact?: boolean;
}

export function ModeSelector({
  selectedMode,
  onModeChange,
  compact = false,
}: ModeSelectorProps) {
  if (compact) {
    // Filter out "custom" mode from compact view - it's an auto-indicator, not a button
    // When users change settings manually via the LLM Settings panel, mode auto-switches to custom
    const visibleModes = CHAT_MODES.filter((m) => m.id !== "custom");
    
    return (
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {visibleModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg
              text-xs sm:text-sm font-medium
              transition-all duration-200
              ${
                selectedMode === mode.id
                  ? "bg-[var(--chat-accent)] text-white"
                  : selectedMode === "custom"
                    ? "text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)]"
                    : "text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)]"
              }
            `}
            title={mode.description}
          >
            {mode.icon}
            <span className="hidden md:inline">{mode.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {CHAT_MODES.slice(0, 4).map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`
            flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl
            min-w-[70px] sm:min-w-[100px]
            border transition-all duration-200
            chat-mode-button
            ${
              selectedMode === mode.id
                ? "bg-[var(--chat-accent-muted)] border-[var(--chat-accent)] text-[var(--chat-accent)]"
                : "bg-[var(--chat-bg-secondary)] border-[var(--chat-border)] text-[var(--chat-text-secondary)] hover:border-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)]"
            }
          `}
        >
          <div
            className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center
              ${
                selectedMode === mode.id
                  ? "bg-[var(--chat-accent)] text-white"
                  : "bg-[var(--chat-bg-tertiary)]"
              }
            `}
          >
            {mode.icon}
          </div>
          <span className="text-xs sm:text-sm font-medium">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

export function getModePreferences(mode: ChatMode) {
  const modeConfig = CHAT_MODES.find((m) => m.id === mode);
  return modeConfig?.preferences || CHAT_MODES[0].preferences;
}


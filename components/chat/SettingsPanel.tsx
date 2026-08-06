"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, ChevronDown } from "lucide-react";

interface SettingsPanelProps {
  preferredProvider: string;
  costSensitivity: string;
  qualityPriority: string;
  instantResponse: boolean;
  onPreferredProviderChange: (value: string) => void;
  onCostSensitivityChange: (value: string) => void;
  onQualityPriorityChange: (value: string) => void;
  onInstantResponseChange: (value: boolean) => void;
}

const PROVIDERS = [
  { value: "auto", label: "Auto LLM Routing", description: "Smart AI routing" },
  { value: "openai", label: "OpenAI", description: "GPT models" },
  { value: "anthropic", label: "Anthropic", description: "Claude models" },
  { value: "google", label: "Google", description: "Gemini models" },
  { value: "cohere", label: "Cohere", description: "Command models" },
  { value: "mistral", label: "Mistral", description: "Open-weight AI" },
  { value: "kimi", label: "Kimi (Moonshot)", description: "Kimi models" },
  { value: "minimax", label: "MiniMax", description: "MiniMax M2 models" },
  { value: "huggingface", label: "Hugging Face", description: "Open-source hub" },
  { value: "azure_openai", label: "Azure OpenAI", description: "Microsoft Azure" },
  { value: "aws_bedrock", label: "AWS Bedrock", description: "Amazon AI" },
];

const COST_OPTIONS = [
  { value: "low", label: "Low", description: "Premium providers" },
  { value: "medium", label: "Medium", description: "Balanced" },
  { value: "high", label: "High", description: "Cost-effective" },
];

const QUALITY_OPTIONS = [
  { value: "cost", label: "Cost", description: "Optimize for cost" },
  { value: "balanced", label: "Balanced", description: "Best of both" },
  { value: "quality", label: "Quality", description: "Best results" },
];

export function SettingsPanel({
  preferredProvider,
  costSensitivity,
  qualityPriority,
  instantResponse,
  onPreferredProviderChange,
  onCostSensitivityChange,
  onQualityPriorityChange,
  onInstantResponseChange,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });

  // Calculate panel position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelHeight = Math.min(400, window.innerHeight * 0.7); // Approximate panel height
      const spaceAbove = rect.top;
      
      // Position above the button if there's space, otherwise below
      if (spaceAbove > panelHeight) {
        setPanelPosition({
          top: rect.top - panelHeight - 8, // 8px gap
          right: window.innerWidth - rect.right,
        });
      } else {
        setPanelPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [isOpen]);

  // Get current provider label
  const currentProviderLabel = PROVIDERS.find(p => p.value === preferredProvider)?.label || "Auto-select";

  return (
    <div className="relative flex-shrink-0">
      {/* Toggle button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          text-sm font-medium
          transition-all duration-200
          ${
            isOpen
              ? "bg-[var(--chat-accent)] text-white"
              : "text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)]"
          }
        `}
        title="LLM Settings"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">{currentProviderLabel}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Settings dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel - fixed position calculated dynamically */}
          <div
            style={{
              top: `${panelPosition.top}px`,
              right: `${panelPosition.right}px`,
            }}
            className="
              fixed z-50
              w-[calc(100vw-2rem)] sm:w-80 max-h-[70vh] overflow-y-auto
              p-4 rounded-xl
              bg-[var(--chat-bg-secondary)]
              border border-[var(--chat-border)]
              shadow-xl
              chat-message-enter
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--chat-text-primary)]">
                LLM Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="
                  p-1 rounded-md
                  text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)]
                  hover:bg-[var(--chat-bg-hover)]
                  transition-colors duration-200
                "
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Provider selection */}
              <div>
                <label className="block text-xs font-medium text-[var(--chat-text-secondary)] mb-2">
                  Provider
                </label>
                <div className="relative">
                  <select
                    value={preferredProvider}
                    onChange={(e) => onPreferredProviderChange(e.target.value)}
                    className="
                      w-full px-3 py-2 rounded-lg appearance-none
                      bg-[var(--chat-bg-tertiary)]
                      border border-[var(--chat-border)]
                      text-[var(--chat-text-primary)]
                      text-sm
                      focus:outline-none focus:border-[var(--chat-accent)]
                      cursor-pointer
                    "
                  >
                    {PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--chat-text-muted)] pointer-events-none" />
                </div>
                {preferredProvider === "auto" && (
                  <p className="text-[10px] text-[var(--chat-text-muted)] mt-1">
                    Model auto-selected based on your query
                  </p>
                )}
              </div>

              {/* Cost sensitivity */}
              <div>
                <label className="block text-xs font-medium text-[var(--chat-text-secondary)] mb-2">
                  Cost Sensitivity
                </label>
                <div className="flex gap-2">
                  {COST_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onCostSensitivityChange(option.value)}
                      className={`
                        flex-1 px-3 py-2 rounded-lg
                        text-xs font-medium
                        transition-all duration-200
                        ${
                          costSensitivity === option.value
                            ? "bg-[var(--chat-accent)] text-white"
                            : "bg-[var(--chat-bg-tertiary)] text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)]"
                        }
                      `}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality priority */}
              <div>
                <label className="block text-xs font-medium text-[var(--chat-text-secondary)] mb-2">
                  Quality Priority
                </label>
                <div className="flex gap-2">
                  {QUALITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onQualityPriorityChange(option.value)}
                      className={`
                        flex-1 px-3 py-2 rounded-lg
                        text-xs font-medium
                        transition-all duration-200
                        ${
                          qualityPriority === option.value
                            ? "bg-[var(--chat-accent)] text-white"
                            : "bg-[var(--chat-bg-tertiary)] text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)]"
                        }
                      `}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant response toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-medium text-[var(--chat-text-secondary)]">
                    Instant Response
                  </label>
                  <p className="text-[10px] text-[var(--chat-text-muted)]">
                    Stream responses as they generate
                  </p>
                </div>
                <button
                  onClick={() => onInstantResponseChange(!instantResponse)}
                  className={`
                    relative w-10 h-5 rounded-full
                    transition-colors duration-200
                    ${instantResponse ? "bg-[var(--chat-accent)]" : "bg-[var(--chat-bg-tertiary)]"}
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 w-4 h-4 rounded-full bg-white
                      transition-transform duration-200
                      ${instantResponse ? "left-5" : "left-0.5"}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


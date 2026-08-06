"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Zap, Brain, Cpu, Image as ImageIcon } from "lucide-react";

// Model definitions with exact model IDs
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  tier: "flagship" | "balanced" | "efficient" | "reasoning";
  description: string;
  icon?: React.ReactNode;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "aws_bedrock",
    modelId: "us.anthropic.claude-sonnet-4-6",
    tier: "balanced",
    description: "Powered by AWS Bedrock",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "openai",
    modelId: "gpt-4o-mini",
    tier: "efficient",
    description: "Fast, cheap, reliable",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    modelId: "gpt-4o",
    tier: "flagship",
    description: "Higher quality OpenAI model",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    modelId: "gemini-2.0-flash",
    tier: "efficient",
    description: "Fast Google responses",
  },
  {
    id: "command-r",
    name: "Command R",
    provider: "cohere",
    modelId: "command-r",
    tier: "balanced",
    description: "Stable Cohere fallback",
  },
];

export const DEFAULT_IMAGE_MODEL_ID = "EternitAI Pro";

export const IMAGE_MODELS: AIModel[] = [
  { id: "Dalle-3", name: "Dalle-3", provider: "image", modelId: "Dalle-3", tier: "balanced", description: "" },
  { id: "Flux", name: "Flux", provider: "image", modelId: "Flux", tier: "balanced", description: "" },
  { id: "Flux Advanced", name: "Flux Advanced", provider: "image", modelId: "Flux Advanced", tier: "flagship", description: "" },
  { id: "Stable diffusion", name: "Stable Diffusion", provider: "image", modelId: "Stable diffusion", tier: "balanced", description: "" },
  { id: "EternitAI Pro", name: "EternitAI Pro", provider: "image", modelId: "EternitAI Pro", tier: "balanced", description: "" },
  { id: "Ideogram", name: "Ideogram", provider: "image", modelId: "Ideogram", tier: "balanced", description: "" },
  { id: "Google", name: "Google", provider: "image", modelId: "Google", tier: "balanced", description: "" },
];

export interface ImageRatio {
  label: string;
  width: number;
  height: number;
}

export const RATIOS: ImageRatio[] = [
  { label: "1:1", width: 1024, height: 1024 },
  { label: "2:3", width: 682, height: 1024 },
  { label: "3:2", width: 1536, height: 1024 },
  { label: "3:4", width: 768, height: 1024 },
  { label: "4:3", width: 1024, height: 768 },
  { label: "9:16", width: 576, height: 1024 },
  { label: "16:9", width: 1792, height: 1024 },
  { label: "21:9", width: 2389, height: 1024 },
];

export const MODEL_IMAGE_RATIOS: Record<string, ImageRatio[]> = {};

export function getRatiosForImageModel(modelId: string): ImageRatio[] {
  return MODEL_IMAGE_RATIOS[modelId] ?? RATIOS;
}

// Provider color mappings
const PROVIDER_COLORS: Record<string, string> = {
  ai2me: "text-indigo-500",
  anthropic: "text-orange-500",
  openai: "text-green-500",
  google: "text-blue-500",
  cohere: "text-purple-500",
  mistral: "text-cyan-500",
  kimi: "text-rose-500",
  minimax: "text-emerald-500",
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  flagship: <Sparkles className="w-4 h-4" />,
  balanced: <Zap className="w-4 h-4" />,
  efficient: <Cpu className="w-4 h-4" />,
  reasoning: <Brain className="w-4 h-4" />,
};

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string, model: AIModel) => void;
  dropdownDirection?: "top" | "bottom";
  dropdownAlign?: "left" | "right" | "center";
  autoOnly?: boolean;
}

export function ModelSelector({
  selectedModelId,
  onModelChange,
  dropdownDirection = "top",
  dropdownAlign = "left",
  autoOnly = true,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableModels = AVAILABLE_MODELS;
  const selectedModel = availableModels.find((m) => m.id === selectedModelId) || availableModels[0];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group models by provider
  const groupedModels = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  const providerOrder = ["AI2me", "anthropic", "openai", "google", "cohere", "kimi", "minimax", "mistral"];
  const providerLabels: Record<string, string> = {
    ai2me: "Smart Routing",
    anthropic: "Anthropic",
    openai: "OpenAI",
    google: "Google",
    cohere: "Cohere",
    kimi: "Kimi (Moonshot)",
    minimax: "MiniMax",
    mistral: "Mistral",
  };

  const dropdownClasses = `
    absolute 
    ${dropdownDirection === "top" ? "bottom-full mb-2" : "top-full mt-2"} 
    ${dropdownAlign === "right" ? "right-0" : dropdownAlign === "center" ? "left-1/2 -translate-x-1/2" : "left-0"}
  `;

  return (
    <div className="relative">
      {/* Trigger button - Pill Shape */}
      <button
        ref={buttonRef}
        onClick={() => {
          if (!autoOnly) {
            setIsOpen(!isOpen);
          }
        }}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-[var(--chat-bg-secondary)] hover:bg-[var(--chat-bg-hover)] 
          border border-[var(--chat-border)]
          transition-colors duration-200
          group
        `}
        aria-label="Select model"
      >
        <span className={`${PROVIDER_COLORS[selectedModel.provider]} shrink-0`}>
          {TIER_ICONS[selectedModel.tier]}
        </span>
        <span className="text-sm font-medium text-[var(--chat-text-primary)]">
          {selectedModel.name}
        </span>
        {!autoOnly && (
          <ChevronDown
            className={`w-4 h-4 text-[var(--chat-text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && !autoOnly && (
        <div
          ref={dropdownRef}
          className={`
            ${dropdownClasses}
            w-[max-content] min-w-[280px] max-w-[calc(100vw-32px)] lg:w-[320px]
            max-h-[60vh] lg:max-h-[80vh]
            model-selector-dropdown
            chat-scrollbar
            z-[100]
            overflow-y-auto
            chat-message-enter
          `}
        >
          {providerOrder.map((providerId) => {
            const models = groupedModels[providerId];
            if (!models) return null;

            return (
              <div key={providerId}>
                <div className="model-selector-dropdown-label">
                  {providerLabels[providerId]}
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id, model);
                      setIsOpen(false);
                    }}
                    className={`
                      model-selector-dropdown-item
                      w-full flex items-center gap-3 px-3 py-2.5
                      text-left
                      transition-all duration-150
                      rounded-lg
                      ${selectedModelId === model.id ? 'model-selector-dropdown-item-selected' : ''}
                    `}
                  >
                    <span className={`shrink-0 ${PROVIDER_COLORS[model.provider]}`}>
                      {TIER_ICONS[model.tier]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${selectedModelId === model.id
                            ? 'chat-model-name-selected'
                            : 'chat-model-name'
                            }`}
                        >
                          {model.name}
                        </span>
                        {model.tier === "flagship" && (
                          <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded bg-amber-500/20 text-amber-600">
                            Pro
                          </span>
                        )}
                        {model.tier === "reasoning" && (
                          <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded bg-purple-500/20 text-purple-600">
                            Think
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] truncate chat-model-description">
                        {model.description}
                      </p>
                    </div>
                    {/* Radio Button Indicator */}
                    <div className={`
                      w-4 h-4 rounded-full border flex items-center justify-center transition-colors
                      ${selectedModelId === model.id
                        ? "bg-blue-600 border-blue-600"
                        : "bg-transparent border-[var(--chat-border)] hover:border-[var(--chat-text-muted)]"}
                    `}>
                      {selectedModelId === model.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper to get model by ID
export function getModelById(modelId: string): AIModel | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

// Helper to get actual model_id for API calls
export function getModelApiId(modelId: string): string {
  const model = getModelById(modelId);
  return model?.modelId || "auto";
}

// Helper to get provider from model ID
export function getProviderFromModelId(modelId: string): string {
  const model = getModelById(modelId);
  return model?.provider || "auto";
}
export function getImageModelById(modelId: string): AIModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === modelId);
}

interface RatioSelectorProps {
  value: ImageRatio;
  onChange: (r: ImageRatio) => void;
  className?: string;
  dropdownDirection?: "top" | "bottom";
}

export function RatioSelector({
  value,
  onChange,
  className = "",
  dropdownDirection = "bottom",
}: RatioSelectorProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className={`relative min-w-0 max-w-full ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full
          bg-[var(--chat-bg-secondary)] hover:bg-[var(--chat-bg-hover)]
          border border-[var(--chat-border)]
          transition-colors duration-200 min-w-0 max-w-full
        `}
        aria-label="Select aspect ratio"
      >
        <span className="text-violet-500 shrink-0 w-4 h-4 flex items-center justify-center">
          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </span>
        <span className="text-xs sm:text-sm font-medium text-[var(--chat-text-primary)] truncate min-w-0">
          {value.label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[var(--chat-text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          ref={panelRef}
          className={`
            absolute
            ${dropdownDirection === "top" ? "bottom-full mb-2" : "top-full mt-2"}
            left-0
            w-[min(320px,calc(100vw-2rem))] min-w-[180px] max-w-[calc(100vw-2rem)]
            max-h-[50vh] sm:max-h-[60vh]
            model-selector-dropdown
            chat-scrollbar
            z-[100]
            overflow-y-auto
            chat-message-enter
          `}
        >
          <div className="model-selector-dropdown-label">Aspect Ratio</div>
          {RATIOS.map((r) => (
            <button
              key={r.label}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
              className={`
                model-selector-dropdown-item
                w-full flex items-center gap-3 px-3 py-2.5
                text-left
                transition-all duration-150
                rounded-lg
                ${value.label === r.label ? "model-selector-dropdown-item-selected" : ""}
              `}
            >
              <span className="shrink-0 text-violet-500">
                <ImageIcon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm font-medium ${value.label === r.label ? "chat-model-name-selected" : "chat-model-name"}`}
                >
                  {r.label}
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${value.label === r.label
                  ? "bg-blue-600 border-blue-600"
                  : "bg-transparent border-[var(--chat-border)] hover:border-[var(--chat-text-muted)]"
                  }`}
              >
                {value.label === r.label && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

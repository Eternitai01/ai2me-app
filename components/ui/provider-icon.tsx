"use client";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface ProviderIconProps {
  providerName: string;
  model?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showModel?: boolean;
  transparent?: boolean;
  className?: string;
}

const PROVIDER_ICON_MAP: Record<string, string> = {
  openai: "/images/openai_logo.svg",
  anthropic: "/images/anthropic_logo.svg",
  google: "/images/google_logo.svg",
  cohere: "/images/cohere_logo.svg",
  huggingface: "/images/huggingface_logo.svg",
  azure_openai: "/images/azure_logo.svg",
  aws_bedrock: "/images/bedrock_logo.svg",
  mistral: "/images/mistral_logo.svg",
};

// Provider display names for accessibility
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Claude",
  google: "Google Gemini",
  cohere: "Cohere",
  huggingface: "Hugging Face",
  azure_openai: "Azure OpenAI",
  aws_bedrock: "AWS Bedrock",
  mistral: "Mistral AI",
  auto: "AI2ME",
};

const SIZE_MAP = {
  sm: { icon: 16, container: "h-6 w-6" },
  md: { icon: 20, container: "h-7 w-7" },
  lg: { icon: 24, container: "h-8 w-8" },
  xl: { icon: 32, container: "h-10 w-10" },
};

export function ProviderIcon({
  providerName,
  model,
  size = "sm",
  showModel = true,
  transparent = false,
  className = "",
}: ProviderIconProps) {
  // Normalize provider name for better matching
  const normalizedProvider = providerName?.trim().toLowerCase() || "";
  const iconSrc =
    PROVIDER_ICON_MAP[normalizedProvider] ||
    PROVIDER_ICON_MAP[providerName?.trim() || ""] ||
    "";

  const sizeConfig = SIZE_MAP[size];
  const displayName = PROVIDER_DISPLAY_NAMES[normalizedProvider] || providerName;

  if (!normalizedProvider || !iconSrc) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`
          flex items-center justify-center ${sizeConfig.container}
          ${transparent 
            ? "" 
            : "rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-1"
          }
        `}
      >
        <Image
          src={iconSrc}
          alt={displayName}
          width={sizeConfig.icon}
          height={sizeConfig.icon}
          className={`object-contain ${transparent ? "drop-shadow-sm" : ""}`}
        />
      </div>
      {showModel && model && (
        <Badge variant="outline" className="text-xs font-medium">
          {model}
        </Badge>
      )}
    </div>
  );
}

// Export for use elsewhere
export { PROVIDER_ICON_MAP, PROVIDER_DISPLAY_NAMES };

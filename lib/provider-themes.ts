/**
 * Provider-Specific Theme Configuration
 * 
 * This file defines the visual themes for each AI provider to create
 * an authentic, native experience matching each LLM's aesthetic.
 */

export type ProviderTheme = {
  id: string;
  name: string;
  displayName: string;
  colors: {
    // Primary accent color (buttons, highlights)
    accent: string;
    accentHover: string;
    accentMuted: string;
    
    // User message bubble
    userBubble: string;
    userBubbleText: string;
    
    // AI message bubble
    aiBubble: string;
    aiBubbleText: string;
    
    // Background colors
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgHover: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    
    // Border colors
    border: string;
    borderSubtle: string;
    
    // Sidebar
    sidebarBg: string;
    sidebarHover: string;
    sidebarActive: string;
    
    // Input
    inputBg: string;
    inputBorder: string;
    inputFocus: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    
    // Code blocks
    codeBg: string;
    codeBorder: string;
  };
  typography: {
    fontFamily?: string;
    messageRadius: string;
    inputRadius: string;
    buttonRadius: string;
  };
  style: {
    messageShadow: boolean;
    glassMorphism: boolean;
    gradientAccent: boolean;
  };
};

// OpenAI / ChatGPT Theme - Clean, minimal, teal/green
export const openaiTheme: ProviderTheme = {
  id: "openai",
  name: "openai",
  displayName: "ChatGPT",
  colors: {
    accent: "#10a37f",
    accentHover: "#0d8a6a",
    accentMuted: "rgba(16, 163, 127, 0.15)",
    userBubble: "#10a37f",
    userBubbleText: "#ffffff",
    aiBubble: "#f7f7f8",
    aiBubbleText: "#1a1a1a",
    bgPrimary: "#ffffff",
    bgSecondary: "#f7f7f8",
    bgTertiary: "#ececf1",
    bgHover: "#e5e5e5",
    textPrimary: "#1a1a1a",
    textSecondary: "#6e6e80",
    textMuted: "#8e8ea0",
    border: "#e5e5e5",
    borderSubtle: "#ececf1",
    sidebarBg: "#202123",
    sidebarHover: "#2a2b2d",
    sidebarActive: "rgba(16, 163, 127, 0.2)",
    inputBg: "#ffffff",
    inputBorder: "#e5e5e5",
    inputFocus: "#10a37f",
    success: "#10a37f",
    warning: "#f59e0b",
    error: "#ef4444",
    codeBg: "#1e1e1e",
    codeBorder: "#3e3e3e",
  },
  typography: {
    fontFamily: "Söhne, ui-sans-serif, system-ui, sans-serif",
    messageRadius: "1.25rem",
    inputRadius: "1.5rem",
    buttonRadius: "0.75rem",
  },
  style: {
    messageShadow: false,
    glassMorphism: false,
    gradientAccent: false,
  },
};

// Anthropic / Claude Theme - Warm, conversational, orange/tan
export const anthropicTheme: ProviderTheme = {
  id: "anthropic",
  name: "anthropic",
  displayName: "Claude",
  colors: {
    accent: "#d97706",
    accentHover: "#b45309",
    accentMuted: "rgba(217, 119, 6, 0.15)",
    userBubble: "#d97706",
    userBubbleText: "#ffffff",
    aiBubble: "#fef3c7",
    aiBubbleText: "#1c1917",
    bgPrimary: "#fffbeb",
    bgSecondary: "#fef9e7",
    bgTertiary: "#fef3c7",
    bgHover: "#fde68a",
    textPrimary: "#1c1917",
    textSecondary: "#78716c",
    textMuted: "#a8a29e",
    border: "#fde68a",
    borderSubtle: "#fef3c7",
    sidebarBg: "#1c1917",
    sidebarHover: "#292524",
    sidebarActive: "rgba(217, 119, 6, 0.2)",
    inputBg: "#ffffff",
    inputBorder: "#fde68a",
    inputFocus: "#d97706",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    codeBg: "#292524",
    codeBorder: "#44403c",
  },
  typography: {
    fontFamily: "Styrene A, system-ui, sans-serif",
    messageRadius: "1rem",
    inputRadius: "1rem",
    buttonRadius: "0.5rem",
  },
  style: {
    messageShadow: true,
    glassMorphism: false,
    gradientAccent: false,
  },
};

// Google / Gemini Theme - Material design, blue/white
export const googleTheme: ProviderTheme = {
  id: "google",
  name: "google",
  displayName: "Gemini",
  colors: {
    accent: "#4285f4",
    accentHover: "#3367d6",
    accentMuted: "rgba(66, 133, 244, 0.12)",
    userBubble: "#4285f4",
    userBubbleText: "#ffffff",
    aiBubble: "#f1f3f4",
    aiBubbleText: "#202124",
    bgPrimary: "#ffffff",
    bgSecondary: "#f8f9fa",
    bgTertiary: "#f1f3f4",
    bgHover: "#e8eaed",
    textPrimary: "#202124",
    textSecondary: "#5f6368",
    textMuted: "#9aa0a6",
    border: "#e8eaed",
    borderSubtle: "#f1f3f4",
    sidebarBg: "#202124",
    sidebarHover: "#303134",
    sidebarActive: "rgba(66, 133, 244, 0.2)",
    inputBg: "#ffffff",
    inputBorder: "#e8eaed",
    inputFocus: "#4285f4",
    success: "#34a853",
    warning: "#fbbc04",
    error: "#ea4335",
    codeBg: "#1e1e1e",
    codeBorder: "#3c4043",
  },
  typography: {
    fontFamily: "Google Sans, Roboto, system-ui, sans-serif",
    messageRadius: "1.5rem",
    inputRadius: "1.75rem",
    buttonRadius: "1.25rem",
  },
  style: {
    messageShadow: true,
    glassMorphism: false,
    gradientAccent: true,
  },
};

// Mistral Theme - Modern, sleek, purple
export const mistralTheme: ProviderTheme = {
  id: "mistral",
  name: "mistral",
  displayName: "Mistral",
  colors: {
    accent: "#8b5cf6",
    accentHover: "#7c3aed",
    accentMuted: "rgba(139, 92, 246, 0.15)",
    userBubble: "#8b5cf6",
    userBubbleText: "#ffffff",
    aiBubble: "#f5f3ff",
    aiBubbleText: "#1e1b4b",
    bgPrimary: "#faf5ff",
    bgSecondary: "#f5f3ff",
    bgTertiary: "#ede9fe",
    bgHover: "#ddd6fe",
    textPrimary: "#1e1b4b",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
    border: "#ddd6fe",
    borderSubtle: "#ede9fe",
    sidebarBg: "#1e1b4b",
    sidebarHover: "#312e81",
    sidebarActive: "rgba(139, 92, 246, 0.2)",
    inputBg: "#ffffff",
    inputBorder: "#ddd6fe",
    inputFocus: "#8b5cf6",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    codeBg: "#1e1b4b",
    codeBorder: "#4c1d95",
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    messageRadius: "1rem",
    inputRadius: "0.75rem",
    buttonRadius: "0.5rem",
  },
  style: {
    messageShadow: false,
    glassMorphism: true,
    gradientAccent: true,
  },
};

// Cohere Theme - Bold, energetic, coral/orange
export const cohereTheme: ProviderTheme = {
  id: "cohere",
  name: "cohere",
  displayName: "Cohere",
  colors: {
    accent: "#f97316",
    accentHover: "#ea580c",
    accentMuted: "rgba(249, 115, 22, 0.15)",
    userBubble: "#f97316",
    userBubbleText: "#ffffff",
    aiBubble: "#fff7ed",
    aiBubbleText: "#1c1917",
    bgPrimary: "#ffffff",
    bgSecondary: "#fff7ed",
    bgTertiary: "#ffedd5",
    bgHover: "#fed7aa",
    textPrimary: "#1c1917",
    textSecondary: "#78716c",
    textMuted: "#a8a29e",
    border: "#fed7aa",
    borderSubtle: "#ffedd5",
    sidebarBg: "#1c1917",
    sidebarHover: "#292524",
    sidebarActive: "rgba(249, 115, 22, 0.2)",
    inputBg: "#ffffff",
    inputBorder: "#fed7aa",
    inputFocus: "#f97316",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    codeBg: "#1c1917",
    codeBorder: "#44403c",
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    messageRadius: "0.75rem",
    inputRadius: "0.75rem",
    buttonRadius: "0.5rem",
  },
  style: {
    messageShadow: false,
    glassMorphism: false,
    gradientAccent: false,
  },
};

// Azure OpenAI Theme - Microsoft Fluent design, blue
export const azureTheme: ProviderTheme = {
  id: "azure_openai",
  name: "azure_openai",
  displayName: "Azure OpenAI",
  colors: {
    accent: "#0078d4",
    accentHover: "#106ebe",
    accentMuted: "rgba(0, 120, 212, 0.12)",
    userBubble: "#0078d4",
    userBubbleText: "#ffffff",
    aiBubble: "#f3f2f1",
    aiBubbleText: "#323130",
    bgPrimary: "#ffffff",
    bgSecondary: "#faf9f8",
    bgTertiary: "#f3f2f1",
    bgHover: "#edebe9",
    textPrimary: "#323130",
    textSecondary: "#605e5c",
    textMuted: "#a19f9d",
    border: "#edebe9",
    borderSubtle: "#f3f2f1",
    sidebarBg: "#1b1a19",
    sidebarHover: "#292827",
    sidebarActive: "rgba(0, 120, 212, 0.2)",
    inputBg: "#ffffff",
    inputBorder: "#edebe9",
    inputFocus: "#0078d4",
    success: "#107c10",
    warning: "#ffb900",
    error: "#d13438",
    codeBg: "#1b1a19",
    codeBorder: "#3b3a39",
  },
  typography: {
    fontFamily: "Segoe UI, system-ui, sans-serif",
    messageRadius: "0.5rem",
    inputRadius: "0.25rem",
    buttonRadius: "0.25rem",
  },
  style: {
    messageShadow: true,
    glassMorphism: false,
    gradientAccent: false,
  },
};

// AWS Bedrock Theme - AWS styling, orange/black
export const bedrockTheme: ProviderTheme = {
  id: "aws_bedrock",
  name: "aws_bedrock",
  displayName: "AWS Bedrock",
  colors: {
    accent: "#ff9900",
    accentHover: "#ec7211",
    accentMuted: "rgba(255, 153, 0, 0.15)",
    userBubble: "#ff9900",
    userBubbleText: "#1a1a1a",
    aiBubble: "#f2f3f3",
    aiBubbleText: "#16191f",
    bgPrimary: "#ffffff",
    bgSecondary: "#f2f3f3",
    bgTertiary: "#eaeded",
    bgHover: "#d5dbdb",
    textPrimary: "#16191f",
    textSecondary: "#545b64",
    textMuted: "#879596",
    border: "#d5dbdb",
    borderSubtle: "#eaeded",
    sidebarBg: "#232f3e",
    sidebarHover: "#2a3f54",
    sidebarActive: "rgba(255, 153, 0, 0.2)",
    inputBg: "#ffffff",
    inputBorder: "#d5dbdb",
    inputFocus: "#ff9900",
    success: "#1d8102",
    warning: "#ff9900",
    error: "#d13212",
    codeBg: "#16191f",
    codeBorder: "#2a2e33",
  },
  typography: {
    fontFamily: "Amazon Ember, Helvetica Neue, system-ui, sans-serif",
    messageRadius: "0.5rem",
    inputRadius: "0.5rem",
    buttonRadius: "0.25rem",
  },
  style: {
    messageShadow: false,
    glassMorphism: false,
    gradientAccent: false,
  },
};

// Hugging Face Theme - Yellow/orange, friendly
export const huggingfaceTheme: ProviderTheme = {
  id: "huggingface",
  name: "huggingface",
  displayName: "Hugging Face",
  colors: {
    accent: "#ffd21e",
    accentHover: "#f0c000",
    accentMuted: "rgba(255, 210, 30, 0.2)",
    userBubble: "#ffd21e",
    userBubbleText: "#1a1a1a",
    aiBubble: "#fffbeb",
    aiBubbleText: "#1a1a1a",
    bgPrimary: "#ffffff",
    bgSecondary: "#fefce8",
    bgTertiary: "#fef9c3",
    bgHover: "#fef08a",
    textPrimary: "#1a1a1a",
    textSecondary: "#525252",
    textMuted: "#a3a3a3",
    border: "#fef08a",
    borderSubtle: "#fef9c3",
    sidebarBg: "#1a1a1a",
    sidebarHover: "#262626",
    sidebarActive: "rgba(255, 210, 30, 0.2)",
    inputBg: "#ffffff",
    inputBorder: "#fef08a",
    inputFocus: "#ffd21e",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    codeBg: "#1a1a1a",
    codeBorder: "#404040",
  },
  typography: {
    fontFamily: "Source Sans Pro, system-ui, sans-serif",
    messageRadius: "1rem",
    inputRadius: "1rem",
    buttonRadius: "0.75rem",
  },
  style: {
    messageShadow: false,
    glassMorphism: false,
    gradientAccent: false,
  },
};

// Default/Auto Theme - AI2ME branded (purple/indigo)
export const defaultTheme: ProviderTheme = {
  id: "auto",
  name: "auto",
  displayName: "AI2ME Auto",
  colors: {
    accent: "#6366f1",
    accentHover: "#4f46e5",
    accentMuted: "rgba(99, 102, 241, 0.15)",
    userBubble: "#6366f1",
    userBubbleText: "#ffffff",
    aiBubble: "#f3f4f6",
    aiBubbleText: "#111827",
    bgPrimary: "#ffffff",
    bgSecondary: "#f9fafb",
    bgTertiary: "#f3f4f6",
    bgHover: "#e5e7eb",
    textPrimary: "#111827",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
    border: "#e5e7eb",
    borderSubtle: "#f3f4f6",
    sidebarBg: "#0a0a0a",
    sidebarHover: "#1f1f1f",
    sidebarActive: "rgba(99, 102, 241, 0.15)",
    inputBg: "#ffffff",
    inputBorder: "#e5e7eb",
    inputFocus: "#6366f1",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    codeBg: "#1a1a2e",
    codeBorder: "#2a2a4a",
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    messageRadius: "1.25rem",
    inputRadius: "0.75rem",
    buttonRadius: "0.75rem",
  },
  style: {
    messageShadow: false,
    glassMorphism: false,
    gradientAccent: true,
  },
};

// Theme registry
export const providerThemes: Record<string, ProviderTheme> = {
  auto: defaultTheme,
  openai: openaiTheme,
  anthropic: anthropicTheme,
  google: googleTheme,
  mistral: mistralTheme,
  cohere: cohereTheme,
  azure_openai: azureTheme,
  aws_bedrock: bedrockTheme,
  huggingface: huggingfaceTheme,
};

// Get theme by provider name
export function getProviderTheme(provider: string): ProviderTheme {
  const normalizedProvider = provider?.toLowerCase().trim() || "auto";
  return providerThemes[normalizedProvider] || defaultTheme;
}

// Get all available themes
export function getAllThemes(): ProviderTheme[] {
  return Object.values(providerThemes);
}

// Provider display info (for UI selection)
export const providerInfo = [
  { id: "auto", name: "AI2ME Auto", icon: "✨", description: "Smart auto-selection" },
  { id: "openai", name: "ChatGPT", icon: "🟢", description: "OpenAI's conversational AI" },
  { id: "anthropic", name: "Claude", icon: "🟠", description: "Anthropic's helpful assistant" },
  { id: "google", name: "Gemini", icon: "🔵", description: "Google's multimodal AI" },
  { id: "mistral", name: "Mistral", icon: "🟣", description: "European open-weight models" },
  { id: "cohere", name: "Cohere", icon: "🟤", description: "Enterprise AI platform" },
  { id: "azure_openai", name: "Azure OpenAI", icon: "💠", description: "Microsoft's OpenAI service" },
  { id: "aws_bedrock", name: "AWS Bedrock", icon: "🟡", description: "Amazon's AI service" },
  { id: "huggingface", name: "Hugging Face", icon: "🤗", description: "Open-source AI hub" },
];


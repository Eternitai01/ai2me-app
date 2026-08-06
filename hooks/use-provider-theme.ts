"use client";

import { useEffect, useCallback, useState } from "react";
import { getProviderTheme, type ProviderTheme } from "@/lib/provider-themes";

const STORAGE_KEY = "chat-provider-theme";

/**
 * Hook to manage provider-specific theming
 * 
 * Applies the appropriate CSS theme based on the selected AI provider,
 * creating an authentic experience matching each LLM's aesthetic.
 */
export function useProviderTheme(provider: string = "auto") {
  const [currentTheme, setCurrentTheme] = useState<ProviderTheme>(() => 
    getProviderTheme(provider)
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Apply theme to document
  const applyTheme = useCallback((providerId: string) => {
    if (typeof document === "undefined") return;

    const theme = getProviderTheme(providerId);
    setCurrentTheme(theme);

    // Start transition
    setIsTransitioning(true);

    // Apply provider data attribute for CSS theming
    document.documentElement.setAttribute("data-provider", providerId);

    // Store preference
    try {
      localStorage.setItem(STORAGE_KEY, providerId);
    } catch (e) {
      console.warn("Failed to save provider theme preference:", e);
    }

    // End transition after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    // Try to restore saved preference, otherwise use provided prop
    let savedProvider: string | null = null;
    try {
      savedProvider = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage not available
    }

    const initialProvider = savedProvider || provider;
    applyTheme(initialProvider);
  }, []);

  // Update theme when provider prop changes
  useEffect(() => {
    if (provider) {
      applyTheme(provider);
    }
  }, [provider, applyTheme]);

  // Get current dark/light mode
  const isDarkMode = useCallback(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  }, []);

  // Reset to default theme
  const resetTheme = useCallback(() => {
    applyTheme("auto");
  }, [applyTheme]);

  // Clean up on unmount (optional - comment out if you want persistence)
  // useEffect(() => {
  //   return () => {
  //     document.documentElement.removeAttribute("data-provider");
  //   };
  // }, []);

  return {
    currentTheme,
    providerId: currentTheme.id,
    providerName: currentTheme.displayName,
    isTransitioning,
    applyTheme,
    resetTheme,
    isDarkMode,
  };
}

/**
 * Get provider theme colors for use in components
 */
export function useProviderColors(provider: string = "auto") {
  const theme = getProviderTheme(provider);
  return theme.colors;
}

/**
 * Get provider theme typography settings
 */
export function useProviderTypography(provider: string = "auto") {
  const theme = getProviderTheme(provider);
  return theme.typography;
}


"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("chat-theme") as Theme | null;
    if (stored) {
      setThemeState(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("dark");
    }
  }, []);

  // Apply theme class to document but ONLY for dashboard/chat areas
  useEffect(() => {
    if (!mounted) return;

    const isFunctionalArea =
      pathname === "/" ||
      pathname?.startsWith("/landing") ||
      pathname?.startsWith("/dashboard") ||
      pathname?.startsWith("/chat") ||
      pathname?.startsWith("/ai-chat") ||
      pathname?.startsWith("/ai-sheets") ||
      pathname?.startsWith("/ai-docs") ||
      pathname?.startsWith("/ai-slides") ||
      pathname?.startsWith("/boardroom") ||
      pathname?.startsWith("/connectors") ||
      pathname?.startsWith("/account") ||
      pathname?.startsWith("/project") ||
      pathname?.startsWith("/ai-builder");

    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (isFunctionalArea) {
      root.classList.add(theme);
    } else {
      root.classList.add("light"); // Marketing is always light
    }

    localStorage.setItem("chat-theme", theme);
  }, [theme, mounted, pathname]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}


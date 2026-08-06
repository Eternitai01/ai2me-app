"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-lg
        bg-[var(--chat-bg-tertiary)] hover:bg-[var(--chat-bg-hover)]
        border border-[var(--chat-border)]
        text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)]
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chat-bg-primary)]
        cursor-pointer no-auth-intercept
        ${className}

      `}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300
            ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"}
          `}
        />
        <Moon
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300
            ${theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}
          `}
        />
      </div>
    </button>
  );
}


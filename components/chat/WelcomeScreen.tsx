"use client";

import { PROVIDER_ICON_MAP } from "@/components/ui/provider-icon";
import Image from "next/image";

interface WelcomeScreenProps {
  userName?: string;
  provider?: string;
}

export function WelcomeScreen({
  userName,
  provider = "auto",
}: WelcomeScreenProps) {
  const displayName = userName?.split(" ")[0] || "there";
  const providerLogo = PROVIDER_ICON_MAP[provider];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      {/* Clean, centered greeting */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[var(--chat-text-primary)] tracking-tight">
          Build <span className="opacity-40">+</span> Launch <span className="opacity-40">+</span> Operate <span className="opacity-40">+</span> Scale
        </h1>
        <p className="text-lg sm:text-2xl text-[var(--chat-text-muted)] font-light">
          What would you like to create today?
        </p>
      </div>

      {/* Subtle decorative element */}
      <div className="mt-12 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--chat-accent)] opacity-40" />
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--chat-accent)] opacity-60" />
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--chat-accent)] opacity-80" />
      </div>
    </div>
  );
}

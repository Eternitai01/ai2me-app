"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SubscriptionSafeGuard } from "@/components/SubscriptionSafeGuard";
import BetaGateModal from "@/components/BetaGateModal";

// ──────────────────────────────────────────────────────────────────────────────
// Beta Gate — remove this block when INTERNAL_BETA_MODE is set to false.
// These accounts have full access regardless of beta mode.
// ──────────────────────────────────────────────────────────────────────────────
const BETA_MODE = process.env.NEXT_PUBLIC_INTERNAL_BETA_MODE === "true";
const BETA_ALLOWLIST = [
  "cc@eternitaigroup.com",
  "sc@eternitai.com",
  "nelson@eternitai.com",
  "nc@eternitai.com",
];
// ──────────────────────────────────────────────────────────────────────────────

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Beta gate: non-allowlisted users see the modal instead of the tool.
  // The underlying tool does not start; clicking "Got it" returns to home.
  const betaRestricted =
    BETA_MODE &&
    !BETA_ALLOWLIST.includes((user.email || "").toLowerCase());

  if (betaRestricted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <BetaGateModal onClose={() => router.push("/")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--chat-bg-primary)] text-[var(--chat-text-primary)] transition-colors duration-200">
      <SubscriptionSafeGuard>{children}</SubscriptionSafeGuard>
    </div>
  );
}

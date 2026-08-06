"use client";

import LandingPage from "./landing/page";
import { OAuthCallbackHandler } from "@/components/OAuthCallbackHandler";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

export default function Home() {
  const { user, loading } = useAuth();
  const { openModal } = useAuthModal();

  // While auth is loading, show nothing to avoid flash of landing page
  // before redirect fires (e.g. clicking a recent session)
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Suspense fallback={null}>
          <OAuthCallbackHandler />
        </Suspense>
      </div>
    );
  }
  const handleGlobalClick = (e: React.MouseEvent) => {
    // If user is already logged in or auth is still loading, allow normal behavior
    if (loading || user) return;

    const target = e.target as HTMLElement;

    // Check if the click is within an exempted area (executive cards, video modal, etc.)
    if (target.closest('.exec-team-card, .no-auth-intercept')) {
      return;
    }

    // Find the nearest clickable element
    const clickable = target.closest('button, a, [role="button"], input[type="submit"], input[type="button"], .cursor-pointer');

    if (!clickable) return;

    // We want to intercept this click and show the login modal
    // We stop propagation so the original element's onClick doesn't fire
    e.preventDefault();
    e.stopPropagation();
    openModal("login");
  };

  return (
    <div className="relative min-h-screen" onClickCapture={handleGlobalClick}>
      <Suspense fallback={null}>
        <OAuthCallbackHandler />
      </Suspense>
      <LandingPage />
    </div>
  )
}

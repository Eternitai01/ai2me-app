"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/lib/i18n";
import { CompanySettingsProvider } from "@/context/CompanySettingsContext";
import { Suspense } from "react";
import { GlobalAuthModal } from "@/components/GlobalAuthModal";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { SessionTokenSync } from "@/components/SessionTokenSync";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // Unregister any stale Sandpack service workers. They intercept iframe requests
  // and run their own script transformer (transformScriptTags.ts) which breaks
  // the CDN-based preview HTML. Only Sandpack's own preview iframes should use it.
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          // Unregister ALL service workers — Sandpack sometimes registers at scope "/"
          // which intercepts /api/ai/preview/ requests and runs transformScriptTags.ts
          reg.unregister();
        }
      }).catch(() => {/* ignore */});
    }
  }, []);
    return (
        <LanguageProvider>
        <ThemeProvider>
            <CompanySettingsProvider>
            {children}

            <SessionTokenSync />
            <SubscriptionGuard />

            {/* Anything that uses useSearchParams / client hooks must be inside Suspense */}
            <Suspense fallback={null}>
                <GlobalAuthModal />
            </Suspense>
            </CompanySettingsProvider>
        </ThemeProvider>
        </LanguageProvider>
    );
}

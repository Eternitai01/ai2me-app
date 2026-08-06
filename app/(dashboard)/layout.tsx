"use client";

import React from "react";
import { DashboardSidebar } from "@/components/organisms/dashboard-sidebar";
import { DashboardHeader } from "@/components/organisms/dashboard-header";
import { CreditWarningBanner } from "@/components/organisms/credit-warning-banner";
import AuthGuard from "@/components/AuthGuard";
import { SubscriptionSafeGuard } from "@/components/SubscriptionSafeGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <DashboardSidebar
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />
        <div className="pl-0 lg:pl-[var(--sidebar-content-padding,18rem)] transition-all duration-300">
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />
          <CreditWarningBanner
            onAddCredits={() => (window.location.href = "/dashboard/credits")}
          />
          <main className="py-8">
            <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
              <SubscriptionSafeGuard exemptRoutes={["/dashboard/subscription", "/dashboard/settings"]}>
                {children}
              </SubscriptionSafeGuard>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

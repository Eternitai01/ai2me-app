"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface SubscriptionSafeGuardProps {
  children: React.ReactNode;
  exemptRoutes?: string[];
}

export function SubscriptionSafeGuard({ children, exemptRoutes = [] }: SubscriptionSafeGuardProps) {
  const { hasPlan, loading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();

  const isExempt = exemptRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
  
  // Specific exemption for the subscription page itself to prevent circular redirects
  const isSubscriptionPage = pathname === "/dashboard/subscription";

  useEffect(() => {
    if (!loading && hasPlan === false && !isExempt && !isSubscriptionPage) {
      router.push("/dashboard/subscription");
    }
  }, [hasPlan, loading, isExempt, isSubscriptionPage, router, pathname]);

  // If loading, show nothing or a subtle spinner to prevent content flash
  if (loading && !isExempt && !isSubscriptionPage) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If we have no plan and are NOT on an exempt/subscription page, don't render children
  // This is the CRITICAL part that prevents the "flash" of restricted content
  if (hasPlan === false && !isExempt && !isSubscriptionPage) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { SubscriptionRequiredModal } from "./SubscriptionRequiredModal";
import { usePathname } from "next/navigation";
import { useSubscription } from "@/hooks/use-subscription";

export function SubscriptionGuard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { hasPlan, loading: subLoading } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Subscription paywall disabled — all authenticated users access the platform freely.
    // Users upgrade via their own intent (pricing page, settings), not a forced modal.
    setShowModal(false);
  }, []);

  return <SubscriptionRequiredModal isOpen={showModal} onClose={() => setShowModal(false)} />;
}
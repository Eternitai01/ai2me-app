"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export function useSubscription() {
  const { user } = useAuth();
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedUserId, setCheckedUserId] = useState<string | undefined>(undefined);

  if (user?.id !== checkedUserId) {
    setCheckedUserId(user?.id);
    if (user) {
      setLoading(true);
    } else {
      setHasPlan(null);
      setLoading(false);
    }
  }

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setHasPlan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/current?t=${Date.now()}`, {
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setHasPlan(data.has_subscription === true);
      } else {
        setHasPlan(false);
      }
    } catch (err) {
      console.error("useSubscription: Error fetching status", err);
      setHasPlan(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return { hasPlan, loading, refresh: checkSubscription };
}

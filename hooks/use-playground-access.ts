import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

interface CreditBalance {
  available_credits: number;
  total_purchased: number;
  total_used: number;
}

interface UsePlaygroundAccessReturn {
  canAccessPlayground: boolean;
  isLoading: boolean;
  error: string | null;
  checkAccess: () => Promise<boolean>;
  refreshAccess: () => Promise<boolean>;
}

export function usePlaygroundAccess(): UsePlaygroundAccessReturn {
  const [canAccessPlayground, setCanAccessPlayground] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openModal } = useAuthModal();

  const checkAccess = useCallback(async (): Promise<boolean> => {
    // Don't check access if user is not authenticated
    if (authLoading || !user) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/credits/balance", {
        credentials: "include",
        cache: "no-store", // Use no-store instead of no-cache
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Credit balance API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: response.url,
        });

        // If 401, open auth modal
        if (response.status === 401) {
          openModal("login");
          return false;
        }

        throw new Error(
          `Failed to fetch credit balance: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      const creditBalance: CreditBalance = data.data || data;

      const hasCredits = creditBalance.available_credits > 0;
      setCanAccessPlayground(hasCredits);

      if (!hasCredits) {
        toast.error("🚫 Insufficient Credits", {
          description:
            "You need credits to access the AI Playground. Add credits to start chatting with AI models.",
          duration: 5000,
        });
        return false;
      }

      return hasCredits;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check credit balance";
      setError(errorMessage);
      console.error("Error checking playground access:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, user, authLoading, openModal]);

  // Auto-check access on mount when user is available
  useEffect(() => {
    if (!authLoading && user) {
      checkAccess();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Refresh access method that forces a fresh check
  const refreshAccess = useCallback(async (): Promise<boolean> => {
    return await checkAccess();
  }, [checkAccess]);

  return {
    canAccessPlayground,
    isLoading,
    error,
    checkAccess,
    refreshAccess,
  };
}

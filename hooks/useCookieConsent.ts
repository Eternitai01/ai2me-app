/**
 * React hook for managing cookie consent state
 */

import { useState, useEffect, useCallback } from "react";
import {
  getCookieConsent,
  saveCookieConsent,
  hasCookieConsent,
  getConsentPreferences,
  updateConsentPreferences,
  clearCookieConsent,
  isFirstTimeVisitor,
  isUserLoggedIn,
  hasRejectedCookies,
  shouldShowCookieModal,
  type CookieConsentData,
} from "@/lib/cookie-consent";
import { useAuth } from "@/context/AuthContext";

export function useCookieConsent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [consent, setConsent] = useState<CookieConsentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent on mount
  useEffect(() => {
    const loadConsent = () => {
      try {
        const consentData = getCookieConsent();
        setConsent(consentData);
      } catch (error) {
        console.error("Failed to load cookie consent:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, []);

  // Check if user has given consent
  const hasConsent = useCallback(() => {
    return hasCookieConsent();
  }, []);

  // Get consent preferences
  const getPreferences = useCallback(() => {
    return getConsentPreferences();
  }, []);

  // Update consent
  const updateConsent = useCallback(
    (consentData: Omit<CookieConsentData, "timestamp" | "version">) => {
      try {
        saveCookieConsent(consentData);
        const updatedConsent = getCookieConsent();
        setConsent(updatedConsent);
        return true;
      } catch (error) {
        console.error("Failed to update consent:", error);
        return false;
      }
    },
    []
  );

  // Update preferences only
  const updatePreferences = useCallback(
    (preferences: CookieConsentData["preferences"]) => {
      try {
        updateConsentPreferences(preferences);
        const updatedConsent = getCookieConsent();
        setConsent(updatedConsent);
        return true;
      } catch (error) {
        console.error("Failed to update preferences:", error);
        return false;
      }
    },
    []
  );

  // Clear consent
  const clearConsent = useCallback(() => {
    try {
      clearCookieConsent();
      setConsent(null);
      return true;
    } catch (error) {
      console.error("Failed to clear consent:", error);
      return false;
    }
  }, []);

  // Check if specific cookie type is allowed
  const isAllowed = useCallback(
    (type: keyof NonNullable<CookieConsentData["preferences"]>) => {
      if (!consent?.preferences) return type === "necessary";
      return consent.preferences[type] === true;
    },
    [consent]
  );

  return {
    // State
    consent,
    isLoading: isLoading || authLoading,
    hasConsent: hasConsent(),
    preferences: getPreferences(),
    isFirstTimeVisitor: isFirstTimeVisitor(),
    isUserLoggedIn: isAuthenticated,
    hasRejectedCookies: hasRejectedCookies(),
    shouldShowModal: shouldShowCookieModal() && !isAuthenticated,

    // Actions
    updateConsent,
    updatePreferences,
    clearConsent,

    // Utilities
    isAllowed,
    refreshConsent: () => {
      const consentData = getCookieConsent();
      setConsent(consentData);
    },
  };
}

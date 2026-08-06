/**
 * Cookie Consent Management Utilities
 * Handles cookie consent storage and retrieval from localStorage
 */

const COOKIE_CONSENT_KEY = "ai2me_cookie_consent";
const COOKIE_CONSENT_VERSION = "1.0";

export interface CookieConsentData {
  accepted: boolean;
  timestamp: number;
  version: string;
  consentId?: string; // Store the database ID
  preferences?: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
}

/**
 * Get the current cookie consent status
 */
export function getCookieConsent(): CookieConsentData | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;

    const consent: CookieConsentData = JSON.parse(stored);

    // Check if consent is still valid (not expired)
    const isExpired = isConsentExpired(consent.timestamp);
    if (isExpired) {
      clearCookieConsent();
      return null;
    }

    return consent;
  } catch (error) {
    console.error("Failed to get cookie consent:", error);
    return null;
  }
}

/**
 * Save cookie consent to localStorage
 */
export function saveCookieConsent(
  consent: Omit<CookieConsentData, "timestamp" | "version">
): void {
  try {
    // Preserve existing consentId if it exists
    const existingConsent = getCookieConsent();
    const consentData: CookieConsentData = {
      ...consent,
      timestamp: Date.now(),
      version: COOKIE_CONSENT_VERSION,
      // Preserve existing consentId to avoid creating duplicate records
      consentId: existingConsent?.consentId || consent.consentId,
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
  } catch (error) {
    console.error("Failed to save cookie consent:", error);
  }
}

/**
 * Update cookie consent with new ID from database
 */
export function updateCookieConsentId(consentId: string): void {
  try {
    const currentConsent = getCookieConsent();
    if (currentConsent) {
      const updatedConsent: CookieConsentData = {
        ...currentConsent,
        consentId,
      };
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(updatedConsent));
    }
  } catch (error) {
    console.error("Failed to update cookie consent ID:", error);
  }
}

/**
 * Check if user has given cookie consent
 */
export function hasCookieConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.accepted === true;
}

/**
 * Check if user has accepted necessary cookies (required for sign in/up)
 */
export function hasNecessaryCookieConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.preferences?.necessary === true;
}

/**
 * Check if user has explicitly rejected cookies
 */
export function hasRejectedCookies(): boolean {
  const consent = getCookieConsent();
  return consent?.accepted === false;
}

/**
 * Check if user is a first-time visitor (no consent given)
 */
export function isFirstTimeVisitor(): boolean {
  return !hasCookieConsent();
}

/**
 * Check if user should see the cookie consent modal
 * Shows modal if:
 * 1. First-time visitor (no consent given)
 * Note: Does NOT show for users who rejected all cookies (they can browse without consent)
 */
export function shouldShowCookieModal(): boolean {
  const consent = getCookieConsent();
  return !consent; // Only show for first-time visitors, not for users who rejected
}

/**
 * Check if user is logged in (has authentication token)
 */
export function isUserLoggedIn(): boolean {
  if (typeof window === "undefined") return false;

  // Check for auth-token cookie (used by AuthContext)
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth-token="))
    ?.split("=")[1];

  return !!token;
}

/**
 * Clear cookie consent from localStorage
 */
export function clearCookieConsent(): void {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch (error) {
    console.error("Failed to clear cookie consent:", error);
  }
}

/**
 * Check if consent has expired (older than 1 year)
 */
function isConsentExpired(timestamp: number): boolean {
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > oneYearInMs;
}

/**
 * Get consent preferences with defaults
 */
export function getConsentPreferences(): CookieConsentData["preferences"] {
  const consent = getCookieConsent();
  return (
    consent?.preferences || {
      necessary: true, // Always true
      analytics: false,
      marketing: false,
      functional: false,
    }
  );
}

/**
 * Update consent preferences
 */
export function updateConsentPreferences(
  preferences: CookieConsentData["preferences"]
): void {
  const currentConsent = getCookieConsent();
  if (currentConsent) {
    const defaultPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };

    saveCookieConsent({
      accepted: currentConsent.accepted,
      preferences: {
        ...defaultPreferences,
        ...currentConsent.preferences,
        ...preferences,
        necessary: true, // Always keep necessary cookies enabled
      },
    });
  }
}

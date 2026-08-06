/**
 * Cookie Consent Modal Component
 * Displays at the bottom of the screen when user hasn't given consent
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  saveCookieConsent,
  updateCookieConsentId,
  getCookieConsent,
  hasCookieConsent,
  hasNecessaryCookieConsent,
  getConsentPreferences,
  shouldShowCookieModal,
} from "@/lib/cookie-consent";
import { X, Cookie, Settings, Shield, BarChart3, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface CookieConsentModalProps {
  onConsentChange?: (hasConsent: boolean) => void;
  forceShow?: boolean; // Force show modal (e.g., for auth requirements)
  authRequired?: boolean; // Show auth-specific message
}

export function CookieConsentModal({
  onConsentChange,
  forceShow = false,
  authRequired = false,
}: CookieConsentModalProps) {
  const { isAuthenticated, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Don't show modal while auth is loading
    if (loading) return;

    // Check if user has already given consent
    const hasConsent = hasCookieConsent();
    const hasNecessaryConsent = hasNecessaryCookieConsent();
    const shouldShow = shouldShowCookieModal();

    // Show modal if:
    // 1. Force show is true (e.g., auth requirement)
    // 2. User should see modal (first-time visitor only) AND not authenticated
    // 3. Auth required but user doesn't have necessary cookie consent
    const shouldShowModal =
      forceShow ||
      (shouldShow && !isAuthenticated) ||
      (authRequired && !hasNecessaryConsent);

    setIsVisible(shouldShowModal);
    onConsentChange?.(hasConsent);

    // Load current preferences
    const currentPreferences = getConsentPreferences();
    setPreferences(
      currentPreferences || {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
      }
    );
  }, [onConsentChange, isAuthenticated, loading, forceShow, authRequired]);

  const handleAcceptAll = async () => {
    const consentData = {
      accepted: true,
      preferences: {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
      },
    };

    // Persist locally
    saveCookieConsent(consentData);
    setIsVisible(false);
    onConsentChange?.(true);

    // Forward to backend in background
    try {
      const currentConsent = getCookieConsent();
      const hasExistingConsent = currentConsent?.consentId;
      const url = hasExistingConsent
        ? `/api/cookie-consent/${currentConsent.consentId}`
        : "/api/cookie-consent";
      const method = hasExistingConsent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentData,
          privacyPolicyVersion: "1.0",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (!hasExistingConsent && result.data?.consent_id) {
          updateCookieConsentId(result.data.consent_id);
        }
      } else {
        const errorText = await response.text();
        console.error("🍪 API error response:", errorText);
      }
    } catch (err) {
      console.error("🍪 Failed to send cookie consent:", err);
    }
  };

  const handleAcceptSelected = async () => {
    const consentData = {
      accepted: true,
      preferences: {
        necessary: true, // Always true
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        functional: preferences.functional,
      },
    };

    // Persist locally
    saveCookieConsent(consentData);
    setIsVisible(false);
    onConsentChange?.(true);

    // Forward to backend in background
    try {
      const currentConsent = getCookieConsent();
      const hasExistingConsent = currentConsent?.consentId;
      const url = hasExistingConsent
        ? `/api/cookie-consent/${currentConsent.consentId}`
        : "/api/cookie-consent";
      const method = hasExistingConsent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentData,
          privacyPolicyVersion: "1.0",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (!hasExistingConsent && result.data?.consent_id) {
          updateCookieConsentId(result.data.consent_id);
        }
      }
    } catch (err) {
      console.error("Failed to send cookie consent:", err);
    }
  };

  const handleRejectAll = async () => {
    const consentData = {
      accepted: false,
      preferences: {
        necessary: false,
        analytics: false,
        marketing: false,
        functional: false,
      },
    };

    // Persist locally
    saveCookieConsent(consentData);
    setIsVisible(false);
    onConsentChange?.(false);

    // Forward to backend in background
    try {
      const currentConsent = getCookieConsent();
      const hasExistingConsent = currentConsent?.consentId;
      const url = hasExistingConsent
        ? `/api/cookie-consent/${currentConsent.consentId}`
        : "/api/cookie-consent";
      const method = hasExistingConsent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentData,
          privacyPolicyVersion: "1.0",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (!hasExistingConsent && result.data?.consent_id) {
          updateCookieConsentId(result.data.consent_id);
        }
      } else {
        const errorText = await response.text();
        console.error("🍪 API error response:", errorText);
      }
    } catch (err) {
      console.error("🍪 Failed to send cookie consent:", err);
    }
  };

  const handleAcceptNecessaryOnly = async () => {
    const consentData = {
      accepted: true,
      preferences: {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
      },
    };

    // Persist locally
    saveCookieConsent(consentData);
    setIsVisible(false);
    onConsentChange?.(true);

    // Forward to backend in background
    try {
      const currentConsent = getCookieConsent();
      const hasExistingConsent = currentConsent?.consentId;
      const url = hasExistingConsent
        ? `/api/cookie-consent/${currentConsent.consentId}`
        : "/api/cookie-consent";
      const method = hasExistingConsent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentData,
          privacyPolicyVersion: "1.0",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (!hasExistingConsent && result.data?.consent_id) {
          updateCookieConsentId(result.data.consent_id);
        }
      }
    } catch (err) {
      console.error("Failed to send cookie consent:", err);
    }
  };

  const handlePreferenceChange = (
    key: keyof typeof preferences,
    checked: boolean
  ) => {
    if (key === "necessary" && authRequired) return; // Can't disable necessary cookies when auth required

    setPreferences((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-black/20 backdrop-blur-sm light">
      <Card className="mx-auto shadow-2xl border-2">
        <CardContent className="">
          {!showPreferences ? (
            // Main consent view
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Cookie className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {authRequired
                      ? "Necessary cookies required for authentication"
                      : "We use cookies to enhance your experience"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {authRequired ? (
                      <>
                        To sign in or create an account, you need to accept
                        necessary cookies for security and authentication
                        purposes. You can customize your preferences or learn
                        more in our{" "}
                        <a
                          href="/privacy-policy"
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Privacy Policy
                        </a>
                        .
                      </>
                    ) : (
                      <>
                        We use cookies and similar technologies to provide,
                        protect, and improve our services. By clicking
                        &quot;Accept All&quot;, you consent to our use of
                        cookies. You can customize your preferences or learn
                        more in our{" "}
                        <a
                          href="/privacy-policy"
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Privacy Policy
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {authRequired ? (
                  <>
                    <Button
                      onClick={handleAcceptNecessaryOnly}
                      className="flex-1 sm:flex-none bg-blue-600 text-white hover:text-black-700"
                    >
                      Accept Necessary Cookies
                    </Button>
                    <Button
                      variant="outlineBlack"
                      onClick={() => setShowPreferences(true)}
                      className="flex-1 sm:flex-none"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Select Preferences
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleAcceptAll}
                      className="flex-1 sm:flex-none bg-blue-600 text-white hover:text-black-700"
                    >
                      Accept All
                    </Button>
                    <Button
                      variant="outlineBlack"
                      onClick={() => setShowPreferences(true)}
                      className="flex-1 sm:flex-none"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Select Preferences
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleRejectAll}
                      className="flex-1 sm:flex-none text-gray-600 hover:text-white"
                    >
                      Reject All
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Preferences view
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cookie Preferences
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreferences(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="necessary"
                        checked={preferences.necessary}
                        disabled={authRequired}
                        className={
                          authRequired
                            ? "cursor-not-allowed"
                            : "border border-gray-300"
                        }
                        onCheckedChange={
                          authRequired
                            ? undefined
                            : (checked) =>
                              handlePreferenceChange(
                                "necessary",
                                checked as boolean
                              )
                        }
                      />
                      <Label
                        htmlFor="necessary"
                        className="font-medium text-gray-900"
                      >
                        Necessary Cookies
                      </Label>
                      {authRequired && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Required for Auth
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {authRequired
                        ? "Essential for authentication and security. Required to sign in or create an account."
                        : "Essential for the website to function properly. These can be disabled but may affect functionality."}
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="analytics"
                        checked={preferences.analytics}
                        className="border border-gray-300"
                        onCheckedChange={(checked) =>
                          handlePreferenceChange(
                            "analytics",
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor="analytics"
                        className="font-medium text-gray-900"
                      >
                        Analytics Cookies
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Help us understand how visitors interact with our website
                      by collecting and reporting information anonymously.
                    </p>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="functional"
                        checked={preferences.functional}
                        className="border border-gray-300"
                        onCheckedChange={(checked) =>
                          handlePreferenceChange(
                            "functional",
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor="functional"
                        className="font-medium text-gray-900"
                      >
                        Functional Cookies
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Enable enhanced functionality and personalization, such as
                      remembering your preferences.
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Target className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="marketing"
                        checked={preferences.marketing}
                        className="border border-gray-300"
                        onCheckedChange={(checked) =>
                          handlePreferenceChange(
                            "marketing",
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor="marketing"
                        className="font-medium text-gray-900"
                      >
                        Marketing Cookies
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Used to track visitors across websites to display relevant
                      and engaging advertisements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={handleAcceptSelected}
                  className="flex-1 sm:flex-none bg-blue-600 text-white hover:text-white hover:bg-black"
                >
                  Accept Selected
                </Button>
                <Button
                  variant="outlineBlack"
                  onClick={() => setShowPreferences(false)}
                  className="flex-1 sm:flex-none"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
